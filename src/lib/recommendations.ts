// Practice recommendation engine.
//
// The goal is to never say "practice Math". Every recommendation names a
// specific skill (and where possible a subskill), explains why it surfaced,
// states the current and target mastery, and sizes the practice set.
//
// Ranking is impact-first, not weakness-first: a 60%-mastery skill that carries
// 12% of the section is worth more than a 40%-mastery skill that shows up once
// per test. The signal from the mastery model also matters — a careless-slip
// skill needs a short mixed set, while a conceptual gap needs a longer set that
// starts easier.

import { prisma } from "./db";
import {
  SIGNAL_DESCRIPTIONS,
  targetMasteryFor,
  type MasterySignal,
} from "./mastery";
import { domainWeight, type Section } from "./taxonomy";

export type PriorityLabel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface RecommendationInput {
  section: Section | string;
  domain: string;
  skill: string;
  subskill?: string | null;
  mastery: number;
  attempts: number;
  signal: MasterySignal;
  /** True when the student named this topic during onboarding. */
  selfReported?: boolean;
  /** True when this skill was missed on the diagnostic. */
  missedOnDiagnostic?: boolean;
}

export interface Recommendation {
  section: string;
  domain: string;
  skill: string;
  subskill: string | null;
  priority: number;
  priorityLabel: PriorityLabel;
  reason: string;
  signal: MasterySignal;
  currentMastery: number;
  targetMastery: number;
  recommendedQuestions: number;
  estimatedMinutes: number;
  recommendedDifficulty: "EASY" | "MEDIUM" | "HARD" | "MIXED";
  /** Raw ranking score — exposed for tests and for the "why this order" UI. */
  impactScore: number;
}

/**
 * How much attention a skill deserves given what kind of problem it is.
 * A conceptual gap is worth the most study time; a strong skill the least.
 */
const SIGNAL_MULTIPLIER: Record<MasterySignal, number> = {
  CONCEPT_GAP: 1.0,
  HARD_ONLY: 0.8,
  TIMING: 0.7,
  CARELESS: 0.55,
  UNTESTED: 0.5,
  IMPROVING: 0.35,
  STRONG: 0.08,
};

const SIGNAL_DIFFICULTY: Record<MasterySignal, Recommendation["recommendedDifficulty"]> = {
  CONCEPT_GAP: "EASY",
  HARD_ONLY: "HARD",
  TIMING: "MEDIUM",
  CARELESS: "MIXED",
  UNTESTED: "MEDIUM",
  IMPROVING: "MEDIUM",
  STRONG: "HARD",
};

/** Seconds per question used to size a practice set. */
const SECONDS_PER_QUESTION: Record<string, number> = {
  MATH: 105,
  READING_WRITING: 80,
};

function priorityLabelFor(score: number): PriorityLabel {
  if (score >= 0.09) return "CRITICAL";
  if (score >= 0.055) return "HIGH";
  if (score >= 0.03) return "MEDIUM";
  return "LOW";
}

function reasonFor(input: RecommendationInput, gap: number): string {
  const pct = Math.round(input.mastery * 100);
  const base = SIGNAL_DESCRIPTIONS[input.signal];

  const evidence =
    input.attempts === 0
      ? "You haven't answered a question on this skill yet, so it's an unknown."
      : `${pct}% estimated mastery across ${input.attempts} attempt${input.attempts === 1 ? "" : "s"}.`;

  const flags: string[] = [];
  if (input.missedOnDiagnostic) flags.push("you missed it on the diagnostic");
  if (input.selfReported) flags.push("you flagged it during setup");
  const flagText = flags.length ? ` Surfaced because ${flags.join(" and ")}.` : "";

  const weightText =
    domainWeight(input.domain) >= 0.25
      ? ` ${input.domain} is one of the heaviest domains on the test, so closing this gap moves the score more than most.`
      : "";

  const gapText =
    gap > 0.25
      ? " This is one of the widest gaps between where you are and where you need to be."
      : "";

  return `${base} ${evidence}${flagText}${weightText}${gapText}`.trim();
}

/**
 * Size the practice set. Bigger gaps get more questions, but never so many that
 * a single skill eats a whole session.
 */
function sizeSet(gap: number, signal: MasterySignal): number {
  if (signal === "CARELESS") return 8; // slips need reps, not volume
  if (signal === "STRONG") return 5;
  if (gap >= 0.4) return 20;
  if (gap >= 0.25) return 15;
  if (gap >= 0.12) return 12;
  return 8;
}

export function buildRecommendation(
  input: RecommendationInput,
  targetScore: number | null
): Recommendation {
  const targetMastery = targetMasteryFor(targetScore);
  const gap = Math.max(0, targetMastery - input.mastery);

  // Impact = how much of the test this touches x how far off you are x what
  // kind of problem it is. Self-reported and diagnostic-missed skills get a
  // bounded boost so the student's own signal is respected without dominating.
  let impactScore =
    domainWeight(input.domain) * gap * SIGNAL_MULTIPLIER[input.signal];
  if (input.missedOnDiagnostic) impactScore *= 1.35;
  if (input.selfReported) impactScore *= 1.2;

  const recommendedQuestions = sizeSet(gap, input.signal);
  const secondsPer = SECONDS_PER_QUESTION[input.section] ?? 90;

  return {
    section: input.section,
    domain: input.domain,
    skill: input.skill,
    subskill: input.subskill ?? null,
    priority: 0, // assigned after sorting
    priorityLabel: priorityLabelFor(impactScore),
    reason: reasonFor(input, gap),
    signal: input.signal,
    currentMastery: Number(input.mastery.toFixed(3)),
    targetMastery,
    recommendedQuestions,
    // Review time is real: budget ~35% on top of raw answering time.
    estimatedMinutes: Math.max(5, Math.round((recommendedQuestions * secondsPer * 1.35) / 60)),
    recommendedDifficulty: SIGNAL_DIFFICULTY[input.signal],
    impactScore: Number(impactScore.toFixed(5)),
  };
}

/** Rank a set of candidate skills and assign 1-based priorities. */
export function rankRecommendations(
  inputs: RecommendationInput[],
  targetScore: number | null,
  limit = 8
): Recommendation[] {
  return inputs
    .map((i) => buildRecommendation(i, targetScore))
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, limit)
    .map((r, i) => ({ ...r, priority: i + 1 }));
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * Recompute recommendations from current mastery + diagnostic evidence and
 * replace the stored ACTIVE set. Skills the student already marked DONE stay
 * done until their mastery drops again.
 */
export async function regenerateRecommendations(userId: string): Promise<Recommendation[]> {
  const [profile, mastery, latestResult] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId } }),
    prisma.topicMastery.findMany({ where: { userId } }),
    prisma.diagnosticResult.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const selfReported = new Set<string>(safeParseArray(profile?.strugglingTopics));

  const missedSkills = new Set<string>();
  if (latestResult) {
    const missed = await prisma.diagnosticResponse.findMany({
      where: { sessionId: latestResult.sessionId, isCorrect: false },
      select: { question: { select: { skill: true } } },
    });
    for (const m of missed) missedSkills.add(m.question.skill);
  }

  const inputs: RecommendationInput[] = mastery.map((m) => ({
    section: m.section,
    domain: m.domain,
    skill: m.skill,
    mastery: m.mastery,
    attempts: m.attempts,
    signal: (m.signal as MasterySignal | null) ?? "UNTESTED",
    selfReported: selfReported.has(m.skill),
    missedOnDiagnostic: missedSkills.has(m.skill),
  }));

  // Skills the student named but has never practiced still deserve a slot.
  for (const skill of selfReported) {
    if (inputs.some((i) => i.skill === skill)) continue;
    const meta = await prisma.question.findFirst({
      where: { skill },
      select: { section: true, domain: true },
    });
    if (!meta) continue;
    inputs.push({
      section: meta.section,
      domain: meta.domain,
      skill,
      mastery: 0.35,
      attempts: 0,
      signal: "UNTESTED",
      selfReported: true,
      missedOnDiagnostic: missedSkills.has(skill),
    });
  }

  const ranked = rankRecommendations(inputs, profile?.targetScore ?? null);

  await prisma.$transaction([
    prisma.skillRecommendation.deleteMany({ where: { userId, status: "ACTIVE" } }),
    prisma.skillRecommendation.createMany({
      data: ranked.map((r) => ({
        userId,
        section: r.section,
        domain: r.domain,
        skill: r.skill,
        priority: r.priority,
        priorityLabel: r.priorityLabel,
        reason: r.reason,
        signal: r.signal,
        currentMastery: r.currentMastery,
        targetMastery: r.targetMastery,
        recommendedQuestions: r.recommendedQuestions,
        estimatedMinutes: r.estimatedMinutes,
        recommendedDifficulty: r.recommendedDifficulty,
        status: "ACTIVE",
      })),
    }),
  ]);

  return ranked;
}

function safeParseArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}
