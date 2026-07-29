// Skill mastery model.
//
// "Accuracy on this skill" is a bad progress signal: it treats an easy question
// the same as a hard one, and it never forgets a bad week from three months ago.
// This model instead estimates, from the student's recent attempts, the
// probability they would answer a *medium* question on that skill correctly.
//
// It uses the same Rasch formulation as the score predictor (see
// src/lib/diagnostic/scoring.ts) so the two never disagree about what "hard"
// means, with two additions:
//   - recency weighting, so improvement shows up quickly, and
//   - a prior that keeps a skill with two attempts from reading as mastered.
//
// Pure functions here; the DB write lives in updateSkillMastery().

import { prisma } from "./db";
import { ITEM_DIFFICULTY } from "./diagnostic/scoring";
import type { Difficulty, Section } from "./taxonomy";

export const MASTERY_PRIOR_SD = 1.0;
/** Each older attempt counts this much less than the one after it. */
export const RECENCY_DECAY = 0.92;
export const MIN_RECENCY_WEIGHT = 0.35;
/** Below this many attempts a skill is reported as untested, not weak. */
export const MIN_ATTEMPTS_FOR_SIGNAL = 3;
export const RECENT_WINDOW = 20;

export type MasterySignal =
  | "UNTESTED"
  | "STRONG"
  | "IMPROVING"
  | "HARD_ONLY"
  | "TIMING"
  | "CARELESS"
  | "CONCEPT_GAP";

export const SIGNAL_LABELS: Record<MasterySignal, string> = {
  UNTESTED: "Not enough data",
  STRONG: "Consistently strong",
  IMPROVING: "Improving",
  HARD_ONLY: "Breaks down on hard questions",
  TIMING: "Accurate but slow",
  CARELESS: "Careless slips",
  CONCEPT_GAP: "Conceptual gap",
};

export const SIGNAL_DESCRIPTIONS: Record<MasterySignal, string> = {
  UNTESTED: "Too few attempts to say anything useful yet.",
  STRONG: "Reliable across difficulties — worth maintaining, not drilling.",
  IMPROVING: "Moving in the right direction. Keep the current approach.",
  HARD_ONLY: "Fine on easy and medium items, but the hard versions expose a gap.",
  TIMING: "You get these right, but they cost more time than they should.",
  CARELESS: "Misses cluster on easier items — this is points lost to slips, not knowledge.",
  CONCEPT_GAP: "Misses are spread across difficulties, which points at the underlying method.",
};

export interface AttemptRecord {
  /** true = correct */
  c: boolean;
  d: Difficulty;
  /** time in ms */
  t: number;
  /** recommended seconds for the item, used for the timing signal */
  r?: number;
}

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Probability the student answers a MEDIUM item on this skill correctly.
 * `records` is oldest-first; the last entry is the most recent attempt.
 */
export function computeMastery(records: AttemptRecord[]): number {
  if (records.length === 0) return 0;

  const n = records.length;
  const items = records.map((rec, i) => ({
    b: ITEM_DIFFICULTY[rec.d] ?? 0,
    y: rec.c ? 1 : 0,
    w: Math.max(MIN_RECENCY_WEIGHT, Math.pow(RECENCY_DECAY, n - 1 - i)),
  }));

  let bestTheta = 0;
  let bestPost = -Infinity;
  for (let theta = -3.5; theta <= 3.5 + 1e-9; theta += 0.05) {
    let ll = 0;
    for (const it of items) {
      const p = Math.min(1 - 1e-6, Math.max(1e-6, logistic(theta - it.b)));
      ll += it.w * (it.y ? Math.log(p) : Math.log(1 - p));
    }
    const post = ll - (theta * theta) / (2 * MASTERY_PRIOR_SD * MASTERY_PRIOR_SD);
    if (post > bestPost) {
      bestPost = post;
      bestTheta = theta;
    }
  }
  // Mastery is the modelled chance of clearing a medium item (b = 0).
  return Number(logistic(bestTheta).toFixed(4));
}

export interface SignalInput {
  records: AttemptRecord[];
  mastery: number;
  prevMastery: number;
}

/**
 * Turn the raw history into one actionable label. Order matters: the checks run
 * from most specific to most general so "slow but accurate" doesn't get
 * flattened into "conceptual gap".
 */
export function classifySignal({ records, mastery, prevMastery }: SignalInput): MasterySignal {
  if (records.length < MIN_ATTEMPTS_FOR_SIGNAL) return "UNTESTED";

  const by = (d: Difficulty) => records.filter((r) => r.d === d);
  const acc = (list: AttemptRecord[]) =>
    list.length ? list.filter((r) => r.c).length / list.length : null;

  const easyAcc = acc(by("EASY"));
  const mediumAcc = acc(by("MEDIUM"));
  const hardAcc = acc(by("HARD"));
  const lowerAcc =
    easyAcc != null && mediumAcc != null
      ? (easyAcc + mediumAcc) / 2
      : (easyAcc ?? mediumAcc);

  if (mastery >= 0.85 && records.length >= 4) return "STRONG";
  if (mastery - prevMastery >= 0.08 && mastery >= 0.55) return "IMPROVING";

  if (by("HARD").length >= 2 && hardAcc != null && hardAcc <= 0.4 && (lowerAcc ?? 0) >= 0.75) {
    return "HARD_ONLY";
  }

  // Accurate but consistently over the item's time budget.
  const timed = records.filter((r) => r.r && r.t > 0);
  if (timed.length >= 3) {
    const overBudget = timed.filter((r) => r.t > (r.r as number) * 1000 * 1.4).length;
    const overall = records.filter((r) => r.c).length / records.length;
    if (overall >= 0.7 && overBudget / timed.length >= 0.5) return "TIMING";
  }

  // Misses concentrated on the easier items = slips, not gaps.
  if (easyAcc != null && easyAcc < 0.75 && (hardAcc ?? 0) >= (easyAcc ?? 0) && mastery >= 0.5) {
    return "CARELESS";
  }

  if (mastery < 0.6) return "CONCEPT_GAP";
  return records.length >= 4 ? "STRONG" : "UNTESTED";
}

/** Target mastery scales with the score the student is aiming for. */
export function targetMasteryFor(targetScore: number | null): number {
  if (!targetScore) return 0.8;
  if (targetScore >= 1550) return 0.92;
  if (targetScore >= 1450) return 0.87;
  if (targetScore >= 1300) return 0.8;
  return 0.72;
}

export function parseRecent(json: string | null | undefined): AttemptRecord[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is AttemptRecord =>
        typeof r === "object" &&
        r !== null &&
        typeof (r as AttemptRecord).c === "boolean" &&
        typeof (r as AttemptRecord).d === "string"
    );
  } catch {
    return [];
  }
}

export interface MasteryUpdateInput {
  userId: string;
  section: Section | string;
  domain: string;
  skill: string;
  difficulty: Difficulty | string;
  isCorrect: boolean;
  timeMs?: number | null;
  recommendedSec?: number | null;
}

/**
 * Record one attempt against a skill and recompute its mastery + signal.
 * Called from the practice grader and from diagnostic submission.
 */
export async function updateSkillMastery(input: MasteryUpdateInput) {
  const difficulty = (["EASY", "MEDIUM", "HARD"].includes(input.difficulty)
    ? input.difficulty
    : "MEDIUM") as Difficulty;

  const key = {
    userId_section_domain_skill: {
      userId: input.userId,
      section: input.section,
      domain: input.domain,
      skill: input.skill,
    },
  };
  const existing = await prisma.topicMastery.findUnique({ where: key });

  const records = parseRecent(existing?.recentJson);
  records.push({
    c: input.isCorrect,
    d: difficulty,
    t: input.timeMs ?? 0,
    r: input.recommendedSec ?? undefined,
  });
  const recent = records.slice(-RECENT_WINDOW);

  const attempts = (existing?.attempts ?? 0) + 1;
  const correct = (existing?.correct ?? 0) + (input.isCorrect ? 1 : 0);
  const accuracy = correct / attempts;

  const prevMastery = existing?.mastery ?? 0;
  const mastery = computeMastery(recent);
  const signal = classifySignal({ records: recent, mastery, prevMastery });

  const totalTime = recent.reduce((s, r) => s + (r.t ?? 0), 0);
  const timedCount = recent.filter((r) => (r.t ?? 0) > 0).length;
  const avgTimeMs = timedCount ? Math.round(totalTime / timedCount) : null;

  const diffCounters = {
    easyAttempts: (existing?.easyAttempts ?? 0) + (difficulty === "EASY" ? 1 : 0),
    easyCorrect: (existing?.easyCorrect ?? 0) + (difficulty === "EASY" && input.isCorrect ? 1 : 0),
    mediumAttempts: (existing?.mediumAttempts ?? 0) + (difficulty === "MEDIUM" ? 1 : 0),
    mediumCorrect:
      (existing?.mediumCorrect ?? 0) + (difficulty === "MEDIUM" && input.isCorrect ? 1 : 0),
    hardAttempts: (existing?.hardAttempts ?? 0) + (difficulty === "HARD" ? 1 : 0),
    hardCorrect: (existing?.hardCorrect ?? 0) + (difficulty === "HARD" && input.isCorrect ? 1 : 0),
  };

  const data = {
    attempts,
    correct,
    accuracy,
    prevAccuracy: existing?.accuracy ?? accuracy,
    mastery,
    prevMastery: existing?.mastery ?? mastery,
    signal,
    avgTimeMs,
    recentJson: JSON.stringify(recent),
    lastAttemptAt: new Date(),
    ...diffCounters,
  };

  await prisma.topicMastery.upsert({
    where: key,
    create: {
      userId: input.userId,
      section: input.section,
      domain: input.domain,
      skill: input.skill,
      ...data,
    },
    update: data,
  });
}
