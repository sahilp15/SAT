// Performance analytics derived from attempts, mastery, diagnoses, and SRS.
// Pure DB reads plus aggregation, so the analytics page and the dashboard can
// share one definition of every number.

import { prisma } from "./db";
import { toIsoDate } from "./testDate";
import type { MasterySignal } from "./mastery";

export interface TopicRow {
  section: string;
  domain: string;
  skill: string;
  attempts: number;
  correct: number;
  accuracy: number;
  mastery: number;
  delta: number;
  signal: MasterySignal;
  avgTimeMs: number | null;
  byDifficulty: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
  };
}

export interface Overview {
  answered: number;
  correct: number;
  missed: number;
  accuracy: number;
  errorLogsCompleted: number;
  srsDue: number;
  srsTotal: number;
  avgTimeSec: number | null;
  bySection: { section: string; answered: number; correct: number; accuracy: number }[];
  byDifficulty: { difficulty: string; answered: number; correct: number; accuracy: number }[];
  byDomain: { section: string; domain: string; attempts: number; accuracy: number }[];
  topics: TopicRow[];
  mistakeTypes: { type: string; count: number }[];
  accuracyOverTime: { date: string; accuracy: number; count: number }[];
  volumeOverTime: { date: string; questions: number; minutes: number }[];
}

const DIFFICULTY_ORDER = ["EASY", "MEDIUM", "HARD"];

export async function getOverview(userId: string): Promise<Overview> {
  const now = new Date();

  const [attempts, mastery, errorLogsCompleted, srsDue, srsTotal, diagnoses] = await Promise.all([
    prisma.questionAttempt.findMany({
      where: { userId },
      select: {
        isCorrect: true,
        timeMs: true,
        createdAt: true,
        question: { select: { section: true, difficulty: true, domain: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.topicMastery.findMany({ where: { userId }, orderBy: { mastery: "asc" } }),
    prisma.errorLog.count({ where: { userId } }),
    prisma.srsItem.count({ where: { userId, active: true, dueDate: { lte: now } } }),
    prisma.srsItem.count({ where: { userId, active: true } }),
    prisma.mistakeDiagnosis.groupBy({ by: ["category"], where: { userId }, _count: true }),
  ]);

  const answered = attempts.length;
  const correct = attempts.filter((a) => a.isCorrect).length;

  const bucket = (keyOf: (a: (typeof attempts)[number]) => string) => {
    const map = new Map<string, { total: number; correct: number }>();
    for (const a of attempts) {
      const key = keyOf(a);
      const cur = map.get(key) ?? { total: 0, correct: 0 };
      cur.total += 1;
      if (a.isCorrect) cur.correct += 1;
      map.set(key, cur);
    }
    return map;
  };

  const sectionMap = bucket((a) => a.question.section);
  const diffMap = bucket((a) => a.question.difficulty);
  const domainMap = bucket((a) => `${a.question.section}::${a.question.domain}`);

  const dayMap = new Map<string, { total: number; correct: number; ms: number }>();
  for (const a of attempts) {
    const key = toIsoDate(a.createdAt);
    const cur = dayMap.get(key) ?? { total: 0, correct: 0, ms: 0 };
    cur.total += 1;
    cur.ms += a.timeMs ?? 0;
    if (a.isCorrect) cur.correct += 1;
    dayMap.set(key, cur);
  }
  const days = [...dayMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const timed = attempts.filter((a) => (a.timeMs ?? 0) > 0);

  return {
    answered,
    correct,
    missed: answered - correct,
    accuracy: answered ? correct / answered : 0,
    errorLogsCompleted,
    srsDue,
    srsTotal,
    avgTimeSec: timed.length
      ? Math.round(timed.reduce((s, a) => s + (a.timeMs ?? 0), 0) / timed.length / 1000)
      : null,
    bySection: [...sectionMap.entries()].map(([section, v]) => ({
      section,
      answered: v.total,
      correct: v.correct,
      accuracy: v.total ? v.correct / v.total : 0,
    })),
    byDifficulty: [...diffMap.entries()]
      .map(([difficulty, v]) => ({
        difficulty,
        answered: v.total,
        correct: v.correct,
        accuracy: v.total ? v.correct / v.total : 0,
      }))
      .sort(
        (a, b) => DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty)
      ),
    byDomain: [...domainMap.entries()].map(([key, v]) => {
      const [section, domain] = key.split("::");
      return { section, domain, attempts: v.total, accuracy: v.total ? v.correct / v.total : 0 };
    }),
    topics: mastery.map((m) => ({
      section: m.section,
      domain: m.domain,
      skill: m.skill,
      attempts: m.attempts,
      correct: m.correct,
      accuracy: m.accuracy,
      mastery: m.mastery,
      delta: m.mastery - m.prevMastery,
      signal: (m.signal as MasterySignal | null) ?? "UNTESTED",
      avgTimeMs: m.avgTimeMs,
      byDifficulty: {
        easy: { correct: m.easyCorrect, total: m.easyAttempts },
        medium: { correct: m.mediumCorrect, total: m.mediumAttempts },
        hard: { correct: m.hardCorrect, total: m.hardAttempts },
      },
    })),
    mistakeTypes: diagnoses
      .map((d) => ({ type: d.category, count: d._count }))
      .sort((a, b) => b.count - a.count),
    accuracyOverTime: days.map(([date, v]) => ({
      date,
      accuracy: v.correct / v.total,
      count: v.total,
    })),
    volumeOverTime: days.map(([date, v]) => ({
      date,
      questions: v.total,
      minutes: Math.round(v.ms / 60000),
    })),
  };
}

/**
 * A deliberately conservative readiness signal. It is NOT a score prediction —
 * the score predictor does that with a proper model. This gauges how much
 * evidence there is and how good it looks.
 */
export function readinessEstimate(
  o: Overview,
  targetScore: number | null
): { label: string; pct: number; note: string } {
  if (o.answered < 20) {
    return {
      label: "Not enough data yet",
      pct: Math.min(100, Math.round((o.answered / 20) * 100)),
      note: "Answer at least 20 questions before these numbers mean much.",
    };
  }
  const hard = o.byDifficulty.find((d) => d.difficulty === "HARD");
  const hardAcc = hard?.accuracy ?? o.accuracy;
  const coverage = Math.min(1, o.topics.length / 12);
  const masteryAvg = o.topics.length
    ? o.topics.reduce((s, t) => s + t.mastery, 0) / o.topics.length
    : o.accuracy;

  const score = 0.35 * o.accuracy + 0.25 * hardAcc + 0.2 * coverage + 0.2 * masteryAvg;
  const pct = Math.round(score * 100);
  const label = pct >= 85 ? "On track" : pct >= 65 ? "Building" : "Early";
  const target = targetScore ? ` toward ${targetScore}` : "";
  return {
    label,
    pct,
    note: `Blended from accuracy, hard-question accuracy, topic coverage, and average mastery. It measures preparation${target}, not a predicted score.`,
  };
}
