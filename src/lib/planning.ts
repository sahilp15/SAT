// Generates and persists the study plan + practice-test schedule for a user.
// Rule-based by default; if AI is configured the summary/tasks are enriched.
// Reused by onboarding completion and manual "regenerate" from the dashboard.

import { prisma } from "./db";
import { generateRuleBasedPlan } from "./studyPlan";
import { planPracticeTests } from "./studyPlan";
import { generateStudyPlan } from "./ai";
import { getSatDateById, daysUntil } from "./satDates";

export async function generateAndSavePlan(userId: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) return null;

  // Weakest topics from in-app performance (lowest accuracy, with >= 2 attempts).
  const mastery = await prisma.topicMastery.findMany({
    where: { userId, attempts: { gte: 2 } },
    orderBy: { accuracy: "asc" },
    take: 5,
  });
  const weakestTopics = mastery.map((m) => ({
    section: m.section,
    domain: m.domain,
    skill: m.skill,
    accuracy: m.accuracy,
  }));

  const hasDiagnostic = profile.hasTakenOfficial || profile.hasTakenBluebook;

  const base = generateRuleBasedPlan({
    satDateId: profile.satDateId,
    targetScore: profile.targetScore,
    lastTotalScore: profile.lastTotalScore,
    weeklyHours: profile.weeklyHours,
    planIntensity: profile.planIntensity,
    hasDiagnostic,
    weakestTopics,
  });

  // Optional AI enrichment (server-side only).
  let summary = base.summary;
  let weeklyTasks = base.weeklyTasks;
  let dailyTasks = base.dailyTasks;
  let generatedBy = "rule-based";

  const satDate = getSatDateById(profile.satDateId);
  const ai = await generateStudyPlan({
    grade: profile.grade,
    daysUntilSat: satDate ? daysUntil(satDate) : null,
    targetScore: profile.targetScore,
    lastTotalScore: profile.lastTotalScore,
    lastMathScore: profile.lastMathScore,
    lastRwScore: profile.lastRwScore,
    weeklyHours: profile.weeklyHours,
    strongerSection: profile.strongerSection,
    planIntensity: profile.planIntensity,
    hasDiagnostic,
    weakestTopics: weakestTopics.map((t) => t.skill),
  });
  if (ai.configured && ai.data) {
    summary = ai.data.summary || summary;
    if (ai.data.weeklyTasks?.length) {
      weeklyTasks = ai.data.weeklyTasks.map((t) => ({
        title: t.title,
        description: t.description,
        cadence: "weekly" as const,
        section: t.section ?? null,
      }));
    }
    if (ai.data.dailyTasks?.length) {
      dailyTasks = ai.data.dailyTasks.map((t) => ({
        title: t.title,
        description: t.description,
        cadence: "daily" as const,
      }));
    }
    generatedBy = "ai";
  }

  // Deactivate prior plans, create the new active one.
  await prisma.studyPlan.updateMany({ where: { userId, active: true }, data: { active: false } });
  const plan = await prisma.studyPlan.create({
    data: {
      userId,
      summary,
      phase: base.phase,
      generatedBy,
      active: true,
      tasks: {
        create: [...weeklyTasks, ...dailyTasks].map((t, i) => ({
          title: t.title,
          description: t.description ?? null,
          cadence: t.cadence,
          section: "section" in t ? (t.section ?? null) : null,
          orderIndex: i,
        })),
      },
    },
    include: { tasks: true },
  });

  // Refresh upcoming (incomplete) practice-test schedule.
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

  return plan;
}
