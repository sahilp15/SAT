// Performance analytics derived from attempts, error logs, mastery, and SRS.
// Pure DB reads + aggregation so both the dashboard and the analytics page can
// reuse the same numbers.

import { prisma } from "./db";

export interface Overview {
  answered: number;
  correct: number;
  missed: number;
  accuracy: number; // 0..1
  errorLogsCompleted: number;
  srsDue: number;
  srsTotal: number;
  bySection: { section: string; answered: number; accuracy: number }[];
  byDifficulty: { difficulty: string; answered: number; accuracy: number }[];
  byTopic: {
    section: string;
    domain: string;
    skill: string;
    attempts: number;
    accuracy: number;
    trend: number; // accuracy - prevAccuracy
  }[];
  mistakeTypes: { type: string; count: number }[];
  accuracyOverTime: { date: string; accuracy: number; count: number }[];
  avgTimeSec: number | null;
}

export async function getOverview(userId: string): Promise<Overview> {
  const now = new Date();

  const attempts = await prisma.questionAttempt.findMany({
    where: { userId },
    select: {
      isCorrect: true,
      timeMs: true,
      createdAt: true,
      question: { select: { section: true, difficulty: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const answered = attempts.length;
  const correct = attempts.filter((a) => a.isCorrect).length;
  const missed = answered - correct;
  const accuracy = answered ? correct / answered : 0;

  const sectionMap = new Map<string, { a: number; c: number }>();
  const diffMap = new Map<string, { a: number; c: number }>();
  for (const at of attempts) {
    const s = at.question.section;
    const d = at.question.difficulty;
    const sm = sectionMap.get(s) ?? { a: 0, c: 0 };
    sm.a++; if (at.isCorrect) sm.c++; sectionMap.set(s, sm);
    const dm = diffMap.get(d) ?? { a: 0, c: 0 };
    dm.a++; if (at.isCorrect) dm.c++; diffMap.set(d, dm);
  }

  const bySection = [...sectionMap.entries()].map(([section, v]) => ({
    section,
    answered: v.a,
    accuracy: v.a ? v.c / v.a : 0,
  }));
  const order = ["EASY", "MEDIUM", "HARD"];
  const byDifficulty = [...diffMap.entries()]
    .map(([difficulty, v]) => ({ difficulty, answered: v.a, accuracy: v.a ? v.c / v.a : 0 }))
    .sort((x, y) => order.indexOf(x.difficulty) - order.indexOf(y.difficulty));

  const mastery = await prisma.topicMastery.findMany({
    where: { userId },
    orderBy: { accuracy: "asc" },
  });
  const byTopic = mastery.map((m) => ({
    section: m.section,
    domain: m.domain,
    skill: m.skill,
    attempts: m.attempts,
    accuracy: m.accuracy,
    trend: m.accuracy - m.prevAccuracy,
  }));

  const errorLogsCompleted = await prisma.errorLog.count({ where: { userId } });
  const srsDue = await prisma.srsItem.count({
    where: { userId, active: true, dueDate: { lte: now } },
  });
  const srsTotal = await prisma.srsItem.count({ where: { userId, active: true } });

  const logs = await prisma.errorLog.groupBy({
    by: ["mistakeType"],
    where: { userId },
    _count: true,
  });
  const mistakeTypes = logs
    .map((l) => ({ type: l.mistakeType, count: l._count }))
    .sort((a, b) => b.count - a.count);

  // Accuracy over time, bucketed by calendar day.
  const dayMap = new Map<string, { a: number; c: number }>();
  for (const at of attempts) {
    const key = at.createdAt.toISOString().slice(0, 10);
    const dm = dayMap.get(key) ?? { a: 0, c: 0 };
    dm.a++; if (at.isCorrect) dm.c++; dayMap.set(key, dm);
  }
  const accuracyOverTime = [...dayMap.entries()].map(([date, v]) => ({
    date,
    accuracy: v.a ? v.c / v.a : 0,
    count: v.a,
  }));

  const timed = attempts.filter((a) => a.timeMs != null) as { timeMs: number }[];
  const avgTimeSec = timed.length
    ? Math.round(timed.reduce((s, a) => s + a.timeMs, 0) / timed.length / 1000)
    : null;

  return {
    answered,
    correct,
    missed,
    accuracy,
    errorLogsCompleted,
    srsDue,
    srsTotal,
    bySection,
    byDifficulty,
    byTopic,
    mistakeTypes,
    accuracyOverTime,
    avgTimeSec,
  };
}

/** Rough, deliberately conservative readiness estimate (NOT a score guarantee). */
export function readinessEstimate(o: Overview, targetScore: number | null): {
  label: string;
  pct: number;
  note: string;
} {
  if (o.answered < 20) {
    return {
      label: "Not enough data yet",
      pct: Math.min(100, (o.answered / 20) * 100),
      note: "Answer at least 20 questions so estimates become meaningful.",
    };
  }
  // Blend overall accuracy with hard-question accuracy and coverage breadth.
  const hard = o.byDifficulty.find((d) => d.difficulty === "HARD");
  const hardAcc = hard?.accuracy ?? o.accuracy;
  const coverage = Math.min(1, o.byTopic.length / 10);
  const score = 0.5 * o.accuracy + 0.3 * hardAcc + 0.2 * coverage;
  const pct = Math.round(score * 100);
  const label = pct >= 85 ? "On track" : pct >= 65 ? "Building" : "Early";
  const target = targetScore ? ` toward ${targetScore}` : "";
  return {
    label,
    pct,
    note: `A blended signal from accuracy, hard-question accuracy, and topic coverage. Keep going${target} — consistency is what moves scores.`,
  };
}
