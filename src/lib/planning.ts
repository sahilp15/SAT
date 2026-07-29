// Generates and persists the personalized plan: recommendations, the day-by-day
// schedule through test day, and the narrative summary shown on the dashboard.
//
// Deterministic and offline-safe — no AI is involved in building the schedule,
// so the plan is identical whether or not a key is configured. Called after
// onboarding, after a diagnostic, after a practice test, and on demand.

import { prisma } from "./db";
import { regenerateRecommendations, type Recommendation } from "./recommendations";
import { generateStudyPlan, PHASE_LABELS, type PlanPhase, type WeeklyGoal } from "./studyPlanner";
import { resolveTestDate, startOfDay } from "./testDate";
import { planPracticeTests } from "./studyPlan";

const DEFAULT_AVAILABLE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Sat"];

function parseStringArray(json: string | null | undefined, fallback: string[]): string[] {
  if (!json) return fallback;
  try {
    const parsed: unknown = JSON.parse(json);
    const arr = Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
    return arr.length ? arr : fallback;
  } catch {
    return fallback;
  }
}

export interface PlanSnapshot {
  phase: PlanPhase;
  phaseLabel: string;
  summary: string;
  daysGenerated: number;
  recommendations: Recommendation[];
}

/**
 * Rebuild everything downstream of the student's profile and performance.
 * Completion state for days that survive the rebuild is preserved, so
 * re-planning never erases what someone already finished today.
 */
export async function generateAndSavePlan(userId: string): Promise<PlanSnapshot | null> {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) return null;

  const recommendations = await regenerateRecommendations(userId);

  const resolved = resolveTestDate(profile);
  const latestResult = await prisma.diagnosticResult.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const hasDiagnostic = !!latestResult || profile.hasTakenOfficial;

  if (!resolved || resolved.isPast) {
    const summary = resolved?.isPast
      ? "Your test date has passed. Set a new date in Settings and the schedule will rebuild around it."
      : "Add your test date in Settings and the day-by-day plan will build itself around it.";
    await writeStudyPlanRow(userId, "FOUNDATION", summary, recommendations, []);
    return {
      phase: "FOUNDATION",
      phaseLabel: PHASE_LABELS.FOUNDATION,
      summary,
      daysGenerated: 0,
      recommendations,
    };
  }

  const plan = generateStudyPlan({
    testDate: resolved.date,
    availableDays: parseStringArray(profile.availableDays, DEFAULT_AVAILABLE_DAYS),
    minutesPerDay: profile.minutesPerDay ?? 45,
    daysPerWeek: profile.daysPerWeek ?? 5,
    recommendations,
    hasDiagnostic,
    predictedTotal: latestResult?.totalScore ?? profile.lastTotalScore ?? null,
    targetScore: profile.targetScore ?? null,
  });

  const previous = await prisma.studyPlanDay.findMany({
    where: { userId, completed: true },
    select: { date: true, completedAt: true },
  });
  const completedByTime = new Map(previous.map((p) => [p.date.getTime(), p.completedAt]));

  await prisma.$transaction([
    prisma.studyPlanDay.deleteMany({ where: { userId } }),
    prisma.studyPlanDay.createMany({
      data: plan.days.map((d) => {
        const completedAt = completedByTime.get(startOfDay(d.date).getTime()) ?? null;
        return {
          userId,
          date: startOfDay(d.date),
          weekIndex: d.weekIndex,
          kind: d.kind,
          title: d.title,
          itemsJson: JSON.stringify(d.items),
          targetMinutes: d.targetMinutes,
          targetQuestions: d.targetQuestions,
          completed: !!completedAt,
          completedAt,
        };
      }),
    }),
  ]);

  await writeStudyPlanRow(userId, plan.phase, plan.summary, recommendations, plan.weeklyGoals);

  await prisma.practiceTestSchedule.deleteMany({ where: { userId, completed: false } });
  const tests = planPracticeTests({ satDateId: profile.satDateId, hasDiagnostic });
  if (tests.length) {
    await prisma.practiceTestSchedule.createMany({
      data: tests.map((t) => ({
        userId,
        testLabel: t.testLabel,
        scheduledFor: t.scheduledFor,
        kind: t.kind,
      })),
    });
  }

  return {
    phase: plan.phase,
    phaseLabel: PHASE_LABELS[plan.phase],
    summary: plan.summary,
    daysGenerated: plan.days.length,
    recommendations,
  };
}

/** The StudyPlan row carries the narrative + weekly goals for the dashboard. */
async function writeStudyPlanRow(
  userId: string,
  phase: PlanPhase,
  summary: string,
  recommendations: Recommendation[],
  weeklyGoals: WeeklyGoal[]
) {
  await prisma.studyPlan.updateMany({ where: { userId, active: true }, data: { active: false } });
  await prisma.studyPlan.create({
    data: {
      userId,
      summary,
      phase,
      generatedBy: "rule-based",
      active: true,
      tasks: {
        create: [
          ...recommendations.slice(0, 5).map((r, i) => ({
            title: `Focus: ${r.skill}`,
            description: r.reason,
            cadence: "weekly",
            section: String(r.section),
            orderIndex: i,
          })),
          {
            title: WEEKLY_GOALS_TASK,
            description: JSON.stringify(weeklyGoals),
            cadence: "weekly",
            orderIndex: 99,
          },
        ],
      },
    },
  });
}

/** Sentinel title for the task row that stores serialized weekly goals. */
export const WEEKLY_GOALS_TASK = "__weekly_goals__";

export function readWeeklyGoals(
  tasks: { title: string; description: string | null }[]
): WeeklyGoal[] {
  const row = tasks.find((t) => t.title === WEEKLY_GOALS_TASK);
  if (!row?.description) return [];
  try {
    const parsed: unknown = JSON.parse(row.description);
    return Array.isArray(parsed) ? (parsed as WeeklyGoal[]) : [];
  } catch {
    return [];
  }
}

export interface PlanDayView {
  id: string;
  date: Date;
  kind: string;
  title: string;
  items: {
    label: string;
    detail?: string;
    section?: string | null;
    skill?: string | null;
    questions?: number;
    minutes: number;
    href?: string;
  }[];
  targetMinutes: number;
  targetQuestions: number;
  completed: boolean;
}

function parseItems(json: string): PlanDayView["items"] {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as PlanDayView["items"]) : [];
  } catch {
    return [];
  }
}

function toView(day: {
  id: string;
  date: Date;
  kind: string;
  title: string;
  itemsJson: string;
  targetMinutes: number;
  targetQuestions: number;
  completed: boolean;
}): PlanDayView {
  return {
    id: day.id,
    date: day.date,
    kind: day.kind,
    title: day.title,
    items: parseItems(day.itemsJson),
    targetMinutes: day.targetMinutes,
    targetQuestions: day.targetQuestions,
    completed: day.completed,
  };
}

export async function getTodayPlan(
  userId: string,
  now: Date = new Date()
): Promise<PlanDayView | null> {
  const day = await prisma.studyPlanDay.findFirst({ where: { userId, date: startOfDay(now) } });
  return day ? toView(day) : null;
}

export async function getUpcomingPlan(
  userId: string,
  days = 14,
  now: Date = new Date()
): Promise<PlanDayView[]> {
  const start = startOfDay(now);
  const end = new Date(start.getTime() + days * 86_400_000);
  const rows = await prisma.studyPlanDay.findMany({
    where: { userId, date: { gte: start, lt: end } },
    orderBy: { date: "asc" },
  });
  return rows.map(toView);
}
