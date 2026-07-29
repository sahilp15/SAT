// Everything the dashboard shows, assembled in one place so the page component
// stays a layout and the numbers stay testable.

import { prisma } from "./db";
import { getTodayPlan, readWeeklyGoals, type PlanDayView } from "./planning";
import { getAppStatus, type AppStatus } from "./status";
import { daysBetween, resolveTestDate, startOfDay, toIsoDate } from "./testDate";
import { FORMS } from "./diagnostic/form";
import type { WeeklyGoal } from "./studyPlanner";
import type { MasterySignal } from "./mastery";

export interface SkillTrend {
  section: string;
  domain: string;
  skill: string;
  mastery: number;
  delta: number;
  attempts: number;
  signal: MasterySignal;
}

export interface DashboardData {
  status: AppStatus;
  today: PlanDayView | null;
  weeklyGoal: WeeklyGoal | null;
  planPhase: string | null;
  planSummary: string | null;

  questionsToday: number;
  minutesToday: number;
  dailyGoalQuestions: number;

  questionsThisWeek: number;
  minutesThisWeek: number;
  accuracyThisWeek: number | null;
  accuracyPrevWeek: number | null;

  totalQuestions: number;
  totalAccuracy: number;
  accuracyTrend: { date: string; accuracy: number; count: number }[];

  improving: SkillTrend[];
  needsAttention: SkillTrend[];

  nextAction: { label: string; href: string; detail: string };
  unresolvedErrors: number;
  predictedSection: { math: number | null; rw: number | null };
  scoreHistory: { date: string; total: number }[];
}

const WEEK_MS = 7 * 86_400_000;

/**
 * How stale an estimate has to get before retaking beats today's plan. Two or
 * three diagnostics a week is the intended cadence; a week without one means the
 * plan is being built on evidence that has stopped describing the student.
 */
export const STALE_DIAGNOSTIC_DAYS = 7;

/** The lowest-numbered diagnostic not yet submitted, or null once all are done. */
export function untakenFormId(taken: Set<number>): number | null {
  return FORMS.find((f) => !taken.has(f.id))?.id ?? null;
}

export async function getDashboardData(
  userId: string,
  now: Date = new Date()
): Promise<DashboardData> {
  const todayStart = startOfDay(now);
  const weekStart = new Date(now.getTime() - WEEK_MS);
  const prevWeekStart = new Date(now.getTime() - 2 * WEEK_MS);

  const [status, today, plan, profile, attempts, mastery, unresolvedErrors, results] =
    await Promise.all([
      getAppStatus(userId, now),
      getTodayPlan(userId, now),
      prisma.studyPlan.findFirst({
        where: { userId, active: true },
        include: { tasks: { orderBy: { orderIndex: "asc" } } },
      }),
      prisma.studentProfile.findUnique({ where: { userId } }),
      prisma.questionAttempt.findMany({
        where: { userId },
        select: { isCorrect: true, timeMs: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.topicMastery.findMany({ where: { userId, attempts: { gte: 2 } } }),
      prisma.questionAttempt.count({
        where: { userId, resolved: false, OR: [{ isCorrect: false }, { flagged: true }] },
      }),
      prisma.diagnosticResult.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          createdAt: true,
          formId: true,
          totalScore: true,
          mathScore: true,
          rwScore: true,
        },
      }),
    ]);

  const todayAttempts = attempts.filter((a) => a.createdAt >= todayStart);
  const weekAttempts = attempts.filter((a) => a.createdAt >= weekStart);
  const prevWeekAttempts = attempts.filter(
    (a) => a.createdAt >= prevWeekStart && a.createdAt < weekStart
  );

  const acc = (rows: { isCorrect: boolean }[]) =>
    rows.length ? rows.filter((r) => r.isCorrect).length / rows.length : null;
  const minutes = (rows: { timeMs: number | null }[]) =>
    Math.round(rows.reduce((s, r) => s + (r.timeMs ?? 0), 0) / 60000);

  // Daily accuracy for the last 30 days, so the trend line has a fixed window.
  const cutoff = new Date(now.getTime() - 30 * 86_400_000);
  const dayMap = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    if (a.createdAt < cutoff) continue;
    const key = toIsoDate(a.createdAt);
    const cur = dayMap.get(key) ?? { correct: 0, total: 0 };
    cur.total += 1;
    if (a.isCorrect) cur.correct += 1;
    dayMap.set(key, cur);
  }

  const trends: SkillTrend[] = mastery.map((m) => ({
    section: m.section,
    domain: m.domain,
    skill: m.skill,
    mastery: m.mastery,
    delta: m.mastery - m.prevMastery,
    attempts: m.attempts,
    signal: (m.signal as MasterySignal | null) ?? "UNTESTED",
  }));

  const latestResult = results[results.length - 1];
  const weeklyGoals = plan ? readWeeklyGoals(plan.tasks) : [];
  const resolved = resolveTestDate(profile, now);

  return {
    status,
    today,
    weeklyGoal: weeklyGoals[0] ?? null,
    planPhase: plan?.phase ?? null,
    planSummary: plan?.summary ?? null,

    questionsToday: todayAttempts.length,
    minutesToday: minutes(todayAttempts),
    dailyGoalQuestions: profile?.dailyGoalQuestions ?? 20,

    questionsThisWeek: weekAttempts.length,
    minutesThisWeek: minutes(weekAttempts),
    accuracyThisWeek: acc(weekAttempts),
    accuracyPrevWeek: acc(prevWeekAttempts),

    totalQuestions: attempts.length,
    totalAccuracy: acc(attempts) ?? 0,
    accuracyTrend: [...dayMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, accuracy: v.correct / v.total, count: v.total })),

    improving: trends
      .filter((t) => t.delta > 0.02 || t.signal === "IMPROVING")
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 4),
    needsAttention: trends
      .filter((t) => t.signal !== "STRONG" && t.mastery < 0.7)
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 4),

    nextAction: pickNextAction({
      hasDiagnostic: status.hasDiagnostic,
      dueCount: status.dueCount,
      today,
      questionsToday: todayAttempts.length,
      dailyGoal: profile?.dailyGoalQuestions ?? 20,
      unresolvedErrors,
      daysRemaining: resolved?.daysRemaining ?? null,
      daysSinceDiagnostic: latestResult ? daysBetween(latestResult.createdAt, now) : null,
      nextDiagnosticId: untakenFormId(new Set(results.map((r) => r.formId))),
    }),
    unresolvedErrors,
    predictedSection: {
      math: latestResult?.mathScore ?? profile?.lastMathScore ?? null,
      rw: latestResult?.rwScore ?? profile?.lastRwScore ?? null,
    },
    scoreHistory: results.map((r) => ({
      date: toIsoDate(r.createdAt),
      total: r.totalScore,
    })),
  };
}

/**
 * The single most useful thing to do right now. Ordered so the highest-leverage
 * action wins: get a baseline, then clear what's due, then do today's work.
 */
export function pickNextAction(input: {
  hasDiagnostic: boolean;
  dueCount: number;
  today: PlanDayView | null;
  questionsToday: number;
  dailyGoal: number;
  unresolvedErrors: number;
  daysRemaining: number | null;
  /** Whole days since the most recent submitted diagnostic. */
  daysSinceDiagnostic: number | null;
  /** The diagnostic to suggest next, or null when every form is done. */
  nextDiagnosticId: number | null;
}): { label: string; href: string; detail: string } {
  if (!input.hasDiagnostic) {
    return {
      label: "Take the score predictor",
      href: "/diagnostic",
      detail:
        "Twenty adaptive questions. Until this is done, every recommendation is based on guesswork rather than evidence.",
    };
  }
  if (input.daysRemaining != null && input.daysRemaining <= 1) {
    return {
      label: "Review your error log",
      href: "/errors",
      detail: "No new material this close to the test — light review only, then rest.",
    };
  }
  if (input.dueCount > 0) {
    return {
      label: `Clear ${input.dueCount} due review${input.dueCount === 1 ? "" : "s"}`,
      href: "/review/spaced-repetition",
      detail: "Spaced repetition first — these are questions you've already missed once.",
    };
  }
  // Two or three diagnostics a week keeps the estimate — and therefore the plan —
  // built on current evidence. Past a week, it isn't.
  if (
    input.daysSinceDiagnostic != null &&
    input.daysSinceDiagnostic >= STALE_DIAGNOSTIC_DAYS &&
    input.nextDiagnosticId != null
  ) {
    return {
      label: `Take diagnostic ${input.nextDiagnosticId}`,
      href: `/diagnostic/run?form=${input.nextDiagnosticId}`,
      detail: `Your last one was ${input.daysSinceDiagnostic} days ago. A fresh 20-question read keeps the plan pointed at what's actually weak now.`,
    };
  }
  if (input.today && input.today.items.length > 0 && !input.today.completed) {
    const first = input.today.items[0];
    return {
      label: first.label,
      href: first.href ?? "/plan",
      detail: `From today's plan · about ${first.minutes} minutes.`,
    };
  }
  if (input.questionsToday < input.dailyGoal) {
    return {
      label: `${input.dailyGoal - input.questionsToday} more questions to hit today's goal`,
      href: "/practice",
      detail: "Pick a recommended set — they target your highest-impact gaps.",
    };
  }
  if (input.unresolvedErrors > 0) {
    return {
      label: `Work through ${input.unresolvedErrors} unresolved mistake${input.unresolvedErrors === 1 ? "" : "s"}`,
      href: "/errors",
      detail: "Today's target is met. Unresolved misses are the next-best use of time.",
    };
  }
  return {
    label: "Today's goal is done",
    href: "/analytics",
    detail: "Take a look at how the week is trending, or bank a few extra questions.",
  };
}
