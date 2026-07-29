// Predicted SAT score model for the 20-question diagnostic.
//
// ============================================================================
// METHODOLOGY (also mirrored in docs/SCORING.md — keep the two in sync)
// ============================================================================
//
// This is an *estimate from 10 questions per section*, not a score. The model is
// deliberately built so every number can be traced back to a rule, and so that
// the reported uncertainty grows when the evidence is weak. There is no random
// component anywhere: the same responses always produce the same estimate.
//
// 1. ITEM DIFFICULTY (b)
//    Each item gets a latent difficulty on a logit scale:
//      EASY = -1.0, MEDIUM = 0.0, HARD = +1.1
//
// 2. RESPONSE LIKELIHOOD (Rasch / 1PL)
//      P(correct | theta) = 1 / (1 + exp(-(theta - b)))
//    theta is the student's latent ability in the same logit units.
//
// 3. RESPONSE WEIGHTS
//    Not every response is equally informative, so each contributes a weight w:
//      - baseline                                    w = 1.00
//      - adaptive-stage item (targeted at the
//        student's level, so more informative)       w x 1.05
//      - unanswered (scored incorrect, but running
//        out of time is weaker evidence than
//        choosing the wrong answer)                  w x 0.60
//      - correct but answered in under 25% of the
//        recommended time (may be a lucky guess)     w x 0.75
//
// 4. ABILITY ESTIMATE (MAP)
//    theta is chosen to maximize
//      sum_i w_i * [ y_i*log(p_i) + (1-y_i)*log(1-p_i) ]  -  (theta^2) / (2 * 1.2^2)
//    over a grid theta in [-3.5, 3.5] step 0.02. The N(0, 1.2^2) prior keeps a
//    perfect or all-wrong run from producing an infinite estimate, and pulls
//    thin evidence toward the middle instead of the extremes.
//
// 5. CONTENT-DOMAIN CORRECTION
//    A 10-item section cannot sample the four content domains in blueprint
//    proportion. So a second ability estimate is computed per domain and
//    recombined using the blueprint weights in taxonomy.ts, then blended:
//      theta_final = 0.8 * theta_overall + 0.2 * theta_blueprint
//    This nudges the estimate toward what the student would likely score on a
//    properly-proportioned test, without letting one domain dominate.
//
// 6. SCALED SCORE
//    A documented linear anchor maps logits to the 200-800 section scale:
//      theta = -3 -> 250,  theta = 0 -> 520,  theta = +3 -> 790
//      score = clamp(200, 800, round((520 + 90 * theta) / 10) * 10)
//    Scores are reported in multiples of 10, like the real exam.
//
// 7. CONFIDENCE RANGE
//    Standard error from Fisher information plus the prior:
//      SE(theta) = 1 / sqrt( sum_i w_i * p_i * (1 - p_i)  +  1 / 1.2^2 )
//    Converted to score units (x90), then widened by penalties that reflect
//    evidence quality rather than ability:
//      + unanswered items, + rushed responses, + answer changes,
//      + inconsistency (missing easy items while getting hard ones right)
//    The reported band is an 80% interval (z = 1.28), with a floor of +/-30
//    points per section so the app never implies false precision.
//
// 8. CONFIDENCE LEVEL
//    HIGH / MODERATE / LOW from the standard error, how many items were
//    actually answered, and how many responses were rushed or inconsistent.
//
// WHAT THIS MODEL DOES NOT DO
//    It does not claim to reproduce an official score, it is not equated to any
//    real form, and it has no idea how the student performs under three hours of
//    fatigue. Treat it as a starting point that gets more useful as more
//    practice data accumulates.
// ============================================================================

import { domainWeight, type Difficulty, type Section } from "../taxonomy";
import type { DiagnosticStage, DiagnosticTrack } from "./form";

// --- Model constants (exported so tests and the UI can cite them) -----------
export const ITEM_DIFFICULTY: Record<Difficulty, number> = {
  EASY: -1.0,
  MEDIUM: 0.0,
  HARD: 1.1,
};

export const PRIOR_SD = 1.2;
export const THETA_MIN = -3.5;
export const THETA_MAX = 3.5;
export const THETA_STEP = 0.02;

/** score = SCORE_ANCHOR + SCORE_SLOPE * theta, then clamped and rounded to 10s. */
export const SCORE_ANCHOR = 520;
export const SCORE_SLOPE = 90;
export const SECTION_MIN = 200;
export const SECTION_MAX = 800;

/** z for the reported band. 1.28 ~ 80% of a normal distribution. */
export const CONFIDENCE_Z = 1.28;
export const MIN_HALF_WIDTH = 30;
export const MAX_HALF_WIDTH = 140;

export const BLUEPRINT_BLEND = 0.2;
export const RUSHED_FRACTION = 0.25;
/** Spending more than this multiple of the recommended time counts as "slow". */
export const SLOW_MULTIPLE = 2.0;

export type ConfidenceLevel = "LOW" | "MODERATE" | "HIGH";

export interface ScoredResponse {
  questionId: string;
  section: Section;
  stage: DiagnosticStage;
  domain: string;
  skill: string;
  subskill?: string | null;
  difficulty: Difficulty;
  isCorrect: boolean;
  /** null / undefined means the student never answered. */
  chosenAnswer?: string | null;
  correctAnswer?: string;
  timeMs: number;
  recommendedSec: number;
  answerChanges: number;
  flagged: boolean;
}

export interface SectionEstimate {
  section: Section;
  theta: number;
  se: number;
  score: number;
  low: number;
  high: number;
  correct: number;
  answered: number;
  total: number;
  accuracy: number;
  routingAccuracy: number;
  adaptiveAccuracy: number;
  track: DiagnosticTrack | null;
}

export interface DomainPerformance {
  section: Section;
  domain: string;
  correct: number;
  total: number;
  accuracy: number;
  /** Share of the section this domain carries on a real test. */
  blueprintWeight: number;
}

export interface SkillPerformance {
  section: Section;
  domain: string;
  skill: string;
  subskill: string | null;
  correct: number;
  total: number;
  accuracy: number;
  avgTimeSec: number;
}

export type ResponseFlagKind =
  | "UNANSWERED"
  | "RUSHED"
  | "SLOW"
  | "CHANGED_ANSWER"
  | "MISSED_EASY";

export interface ResponseFlag {
  questionId: string;
  kind: ResponseFlagKind;
  detail: string;
}

export interface TimingAnalysis {
  section: Section;
  totalSec: number;
  avgSec: number;
  recommendedAvgSec: number;
  rushed: number;
  slow: number;
  /** avgSec / recommendedAvgSec — under 1 means faster than target pace. */
  paceRatio: number;
  verdict: "TOO_FAST" | "ON_PACE" | "TOO_SLOW";
}

export interface DifficultyPerformance {
  difficulty: Difficulty;
  correct: number;
  total: number;
  accuracy: number;
}

/** One row per question, in presentation order — drives the timing chart. */
export interface TimelinePoint {
  questionId: string;
  order: number;
  section: Section;
  stage: DiagnosticStage;
  difficulty: Difficulty;
  skill: string;
  correct: boolean;
  seconds: number;
  targetSeconds: number;
}

export interface DiagnosticBreakdown {
  sections: SectionEstimate[];
  domains: DomainPerformance[];
  skills: SkillPerformance[];
  difficulties: DifficultyPerformance[];
  timeline: TimelinePoint[];
  timing: TimingAnalysis[];
  strengths: SkillPerformance[];
  weaknesses: SkillPerformance[];
  flags: ResponseFlag[];
  unanswered: number;
  answerChanges: number;
  rushedCount: number;
  slowCount: number;
  /**
   * Points likely lost to avoidable slips: easy/medium items missed by a
   * student who got harder items in the same section right. Reported as
   * context, never added back into the estimate.
   */
  carelessDragPoints: number;
  consistencyIndex: number; // 0..1; 1 = perfectly consistent with difficulty
}

export interface DiagnosticScore {
  math: SectionEstimate;
  rw: SectionEstimate;
  total: number;
  totalLow: number;
  totalHigh: number;
  accuracyPct: number;
  confidence: ConfidenceLevel;
  confidenceNote: string;
  breakdown: DiagnosticBreakdown;
}

// ---------------------------------------------------------------------------
// Core math
// ---------------------------------------------------------------------------

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Weight for a single response — see step 3 of the methodology. */
export function responseWeight(res: ScoredResponse): number {
  let w = 1;
  if (res.stage === "ADAPTIVE") w *= 1.05;
  const unanswered = res.chosenAnswer == null || res.chosenAnswer === "";
  if (unanswered) w *= 0.6;
  else if (res.isCorrect && isRushed(res)) w *= 0.75;
  return w;
}

export function isRushed(res: ScoredResponse): boolean {
  if (res.timeMs <= 0) return false;
  return res.timeMs < res.recommendedSec * 1000 * RUSHED_FRACTION;
}

export function isSlow(res: ScoredResponse): boolean {
  return res.timeMs > res.recommendedSec * 1000 * SLOW_MULTIPLE;
}

interface AbilityEstimate {
  theta: number;
  se: number;
}

/**
 * MAP estimate of theta over a fixed grid with a N(0, PRIOR_SD^2) prior.
 * Returns the prior itself (theta = 0, se = PRIOR_SD) when there is no evidence.
 */
export function estimateAbility(responses: ScoredResponse[]): AbilityEstimate {
  if (responses.length === 0) return { theta: 0, se: PRIOR_SD };

  const items = responses.map((res) => ({
    b: ITEM_DIFFICULTY[res.difficulty],
    y: res.isCorrect ? 1 : 0,
    w: responseWeight(res),
  }));

  let bestTheta = 0;
  let bestLogPost = -Infinity;
  for (let theta = THETA_MIN; theta <= THETA_MAX + 1e-9; theta += THETA_STEP) {
    let logLik = 0;
    for (const it of items) {
      const p = clamp(logistic(theta - it.b), 1e-6, 1 - 1e-6);
      logLik += it.w * (it.y === 1 ? Math.log(p) : Math.log(1 - p));
    }
    const logPrior = -(theta * theta) / (2 * PRIOR_SD * PRIOR_SD);
    const logPost = logLik + logPrior;
    if (logPost > bestLogPost) {
      bestLogPost = logPost;
      bestTheta = theta;
    }
  }

  // Fisher information at the estimate, plus the prior's contribution.
  let info = 1 / (PRIOR_SD * PRIOR_SD);
  for (const it of items) {
    const p = logistic(bestTheta - it.b);
    info += it.w * p * (1 - p);
  }

  return { theta: Number(bestTheta.toFixed(4)), se: 1 / Math.sqrt(info) };
}

/**
 * Re-weight the ability estimate toward the real blueprint. Each domain that
 * has responses gets its own theta; those are combined using blueprint weights
 * (renormalized over the domains actually sampled) and blended with the overall
 * estimate at BLUEPRINT_BLEND.
 */
export function blueprintAdjustedTheta(
  responses: ScoredResponse[],
  overallTheta: number
): number {
  const byDomain = new Map<string, ScoredResponse[]>();
  for (const res of responses) {
    const list = byDomain.get(res.domain) ?? [];
    list.push(res);
    byDomain.set(res.domain, list);
  }
  if (byDomain.size < 2) return overallTheta;

  let weightSum = 0;
  let weighted = 0;
  for (const [domain, list] of byDomain) {
    const w = domainWeight(domain);
    weighted += w * estimateAbility(list).theta;
    weightSum += w;
  }
  if (weightSum === 0) return overallTheta;

  const blueprintTheta = weighted / weightSum;
  return (1 - BLUEPRINT_BLEND) * overallTheta + BLUEPRINT_BLEND * blueprintTheta;
}

/** Convert a latent ability to a 200–800 section score (multiples of 10). */
export function thetaToScore(theta: number): number {
  const raw = SCORE_ANCHOR + SCORE_SLOPE * theta;
  return clamp(Math.round(raw / 10) * 10, SECTION_MIN, SECTION_MAX);
}

/** Round a score bound to the nearest 10 and clamp into the section scale. */
function boundToScore(value: number): number {
  return clamp(Math.round(value / 10) * 10, SECTION_MIN, SECTION_MAX);
}

interface EvidencePenalty {
  unanswered: number;
  rushed: number;
  answerChanges: number;
  inconsistency: number;
}

/** Extra half-width (in score points) added for weak or noisy evidence. */
export function evidencePenaltyPoints(p: EvidencePenalty): number {
  return (
    p.unanswered * 12 +
    p.rushed * 6 +
    Math.min(p.answerChanges, 8) * 2 +
    p.inconsistency * 25
  );
}

// ---------------------------------------------------------------------------
// Section + whole-test scoring
// ---------------------------------------------------------------------------

function accuracyOf(list: ScoredResponse[]): number {
  if (!list.length) return 0;
  return list.filter((r) => r.isCorrect).length / list.length;
}

/**
 * How consistent the responses are with item difficulty: 0 when easy items are
 * missed while hard ones are correct, 1 when performance decreases monotonically
 * with difficulty. Used to widen the interval, not to move the estimate.
 */
export function consistencyIndex(responses: ScoredResponse[]): number {
  if (responses.length < 3) return 1;
  const easy = responses.filter((r) => r.difficulty === "EASY");
  const medium = responses.filter((r) => r.difficulty === "MEDIUM");
  const hard = responses.filter((r) => r.difficulty === "HARD");

  let inversions = 0;
  let comparisons = 0;
  const pairs: [ScoredResponse[], ScoredResponse[]][] = [
    [easy, medium],
    [medium, hard],
    [easy, hard],
  ];
  for (const [lower, higher] of pairs) {
    if (!lower.length || !higher.length) continue;
    comparisons += 1;
    const drop = accuracyOf(lower) - accuracyOf(higher);
    // A negative drop means the student did better on the harder band.
    if (drop < 0) inversions += Math.min(1, -drop);
  }
  if (comparisons === 0) return 1;
  return clamp(1 - inversions / comparisons, 0, 1);
}

export function scoreSection(
  section: Section,
  responses: ScoredResponse[],
  track: DiagnosticTrack | null
): SectionEstimate {
  const total = responses.length;
  const answeredList = responses.filter((r) => r.chosenAnswer != null && r.chosenAnswer !== "");
  const correct = responses.filter((r) => r.isCorrect).length;

  const base = estimateAbility(responses);
  const theta = blueprintAdjustedTheta(responses, base.theta);
  const score = thetaToScore(theta);

  const unanswered = total - answeredList.length;
  const rushed = responses.filter((r) => isRushed(r)).length;
  const answerChanges = responses.reduce((s, r) => s + r.answerChanges, 0);
  const consistency = consistencyIndex(responses);

  const sePoints = base.se * SCORE_SLOPE;
  const penalty = evidencePenaltyPoints({
    unanswered,
    rushed,
    answerChanges,
    inconsistency: 1 - consistency,
  });
  const halfWidth = clamp(
    Math.round(sePoints * CONFIDENCE_Z + penalty),
    MIN_HALF_WIDTH,
    MAX_HALF_WIDTH
  );

  return {
    section,
    theta: Number(theta.toFixed(3)),
    se: Number(base.se.toFixed(3)),
    score,
    low: boundToScore(score - halfWidth),
    high: boundToScore(score + halfWidth),
    correct,
    answered: answeredList.length,
    total,
    accuracy: total ? correct / total : 0,
    routingAccuracy: accuracyOf(responses.filter((r) => r.stage === "ROUTING")),
    adaptiveAccuracy: accuracyOf(responses.filter((r) => r.stage === "ADAPTIVE")),
    track,
  };
}

function buildFlags(responses: ScoredResponse[]): ResponseFlag[] {
  const flags: ResponseFlag[] = [];
  for (const res of responses) {
    const unanswered = res.chosenAnswer == null || res.chosenAnswer === "";
    if (unanswered) {
      flags.push({
        questionId: res.questionId,
        kind: "UNANSWERED",
        detail: "Left blank — on the real test there is no penalty for guessing.",
      });
      continue;
    }
    if (isRushed(res)) {
      flags.push({
        questionId: res.questionId,
        kind: "RUSHED",
        detail: `Answered in ${Math.round(res.timeMs / 1000)}s against a ${res.recommendedSec}s target — fast enough that a guess is likely.`,
      });
    }
    if (isSlow(res)) {
      flags.push({
        questionId: res.questionId,
        kind: "SLOW",
        detail: `Spent ${Math.round(res.timeMs / 1000)}s against a ${res.recommendedSec}s target — this is where the clock gets lost.`,
      });
    }
    if (res.answerChanges >= 2) {
      flags.push({
        questionId: res.questionId,
        kind: "CHANGED_ANSWER",
        detail: `Changed the answer ${res.answerChanges} times — usually a sign of not being able to eliminate cleanly.`,
      });
    }
    if (!res.isCorrect && res.difficulty === "EASY") {
      flags.push({
        questionId: res.questionId,
        kind: "MISSED_EASY",
        detail: "Missed an easy item — these are the cheapest points to win back.",
      });
    }
  }
  return flags;
}

function buildTiming(section: Section, responses: ScoredResponse[]): TimingAnalysis {
  const totalMs = responses.reduce((s, r) => s + r.timeMs, 0);
  const totalSec = Math.round(totalMs / 1000);
  const avgSec = responses.length ? Math.round(totalSec / responses.length) : 0;
  const recommendedAvgSec = responses.length
    ? Math.round(responses.reduce((s, r) => s + r.recommendedSec, 0) / responses.length)
    : 0;
  const paceRatio = recommendedAvgSec > 0 ? avgSec / recommendedAvgSec : 1;
  const verdict = paceRatio < 0.6 ? "TOO_FAST" : paceRatio > 1.25 ? "TOO_SLOW" : "ON_PACE";
  return {
    section,
    totalSec,
    avgSec,
    recommendedAvgSec,
    rushed: responses.filter(isRushed).length,
    slow: responses.filter(isSlow).length,
    paceRatio: Number(paceRatio.toFixed(2)),
    verdict,
  };
}

/**
 * Points likely lost to avoidable slips. For each section, count easy/medium
 * misses by a student who cleared at least one harder item, and price them
 * using the section's score-per-item sensitivity (~SCORE_SLOPE / 4 per item at
 * this test length). Reported as context — never added to the estimate.
 */
function carelessDrag(responses: ScoredResponse[]): number {
  let drag = 0;
  for (const section of ["MATH", "READING_WRITING"] as Section[]) {
    const inSection = responses.filter((r) => r.section === section);
    const clearedHard = inSection.some((r) => r.difficulty === "HARD" && r.isCorrect);
    if (!clearedHard) continue;
    const slips = inSection.filter(
      (r) => !r.isCorrect && r.difficulty !== "HARD" && r.chosenAnswer
    ).length;
    drag += slips * 20;
  }
  return drag;
}

function summarizeDomains(responses: ScoredResponse[]): DomainPerformance[] {
  const map = new Map<string, DomainPerformance>();
  for (const res of responses) {
    const key = `${res.section}::${res.domain}`;
    const cur =
      map.get(key) ??
      ({
        section: res.section,
        domain: res.domain,
        correct: 0,
        total: 0,
        accuracy: 0,
        blueprintWeight: domainWeight(res.domain),
      } satisfies DomainPerformance);
    cur.total += 1;
    if (res.isCorrect) cur.correct += 1;
    cur.accuracy = cur.correct / cur.total;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => a.accuracy - b.accuracy);
}

function summarizeDifficulties(responses: ScoredResponse[]): DifficultyPerformance[] {
  const order: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
  return order
    .map((difficulty) => {
      const rows = responses.filter((r) => r.difficulty === difficulty);
      const correct = rows.filter((r) => r.isCorrect).length;
      return {
        difficulty,
        correct,
        total: rows.length,
        accuracy: rows.length ? correct / rows.length : 0,
      };
    })
    .filter((d) => d.total > 0);
}

function summarizeSkills(responses: ScoredResponse[]): SkillPerformance[] {
  const map = new Map<string, SkillPerformance & { timeMs: number }>();
  for (const res of responses) {
    const key = `${res.section}::${res.skill}`;
    const cur =
      map.get(key) ??
      ({
        section: res.section,
        domain: res.domain,
        skill: res.skill,
        subskill: res.subskill ?? null,
        correct: 0,
        total: 0,
        accuracy: 0,
        avgTimeSec: 0,
        timeMs: 0,
      } as SkillPerformance & { timeMs: number });
    cur.total += 1;
    cur.timeMs += res.timeMs;
    if (res.isCorrect) cur.correct += 1;
    if (!cur.subskill && res.subskill) cur.subskill = res.subskill;
    cur.accuracy = cur.correct / cur.total;
    cur.avgTimeSec = Math.round(cur.timeMs / cur.total / 1000);
    map.set(key, cur);
  }
  return [...map.values()]
    .map(({ timeMs: _timeMs, ...rest }) => rest)
    .sort((a, b) => a.accuracy - b.accuracy);
}

function confidenceFrom(
  math: SectionEstimate,
  rw: SectionEstimate,
  breakdown: Pick<DiagnosticBreakdown, "unanswered" | "rushedCount" | "consistencyIndex">
): { level: ConfidenceLevel; note: string } {
  const answered = math.answered + rw.answered;
  const worstSe = Math.max(math.se, rw.se);

  if (answered < 14 || worstSe > 0.85 || breakdown.unanswered > 4) {
    return {
      level: "LOW",
      note: "Only part of the diagnostic produced usable evidence, so this range is wide. Finish a full diagnostic or log 40–60 practice questions to tighten it.",
    };
  }
  if (
    answered >= 19 &&
    worstSe <= 0.62 &&
    breakdown.rushedCount <= 2 &&
    breakdown.consistencyIndex >= 0.8
  ) {
    return {
      level: "HIGH",
      note: "You answered nearly everything at a steady pace and your results lined up with question difficulty — about as much signal as 20 questions can give.",
    };
  }
  return {
    level: "MODERATE",
    note: "Twenty questions give a usable starting point, but not a precise one. The range narrows as you log more practice.",
  };
}

/**
 * Score a completed diagnostic. `tracks` records which adaptive track each
 * section routed into, purely for reporting.
 */
export function scoreDiagnostic(
  responses: ScoredResponse[],
  tracks: Partial<Record<Section, DiagnosticTrack | null>> = {}
): DiagnosticScore {
  const mathResponses = responses.filter((r) => r.section === "MATH");
  const rwResponses = responses.filter((r) => r.section === "READING_WRITING");

  const math = scoreSection("MATH", mathResponses, tracks.MATH ?? null);
  const rw = scoreSection("READING_WRITING", rwResponses, tracks.READING_WRITING ?? null);

  const total = clamp(math.score + rw.score, 400, 1600);
  // Section errors are combined in quadrature — they are independent estimates.
  const mathHalf = math.high - math.score;
  const rwHalf = rw.high - rw.score;
  const totalHalf = Math.round(Math.sqrt(mathHalf * mathHalf + rwHalf * rwHalf));
  const totalLow = clamp(Math.round((total - totalHalf) / 10) * 10, 400, 1600);
  const totalHigh = clamp(Math.round((total + totalHalf) / 10) * 10, 400, 1600);

  const skills = summarizeSkills(responses);
  const answeredCount = responses.filter((r) => r.chosenAnswer).length;
  const correctCount = responses.filter((r) => r.isCorrect).length;

  const breakdown: DiagnosticBreakdown = {
    sections: [math, rw],
    domains: summarizeDomains(responses),
    skills,
    difficulties: summarizeDifficulties(responses),
    timeline: responses.map((r, i) => ({
      questionId: r.questionId,
      order: i + 1,
      section: r.section,
      stage: r.stage,
      difficulty: r.difficulty,
      skill: r.skill,
      correct: r.isCorrect,
      seconds: Math.round(r.timeMs / 1000),
      targetSeconds: r.recommendedSec,
    })),
    timing: [buildTiming("MATH", mathResponses), buildTiming("READING_WRITING", rwResponses)],
    strengths: skills.filter((s) => s.accuracy >= 0.75).slice(-4).reverse(),
    weaknesses: skills.filter((s) => s.accuracy < 0.6).slice(0, 5),
    flags: buildFlags(responses),
    unanswered: responses.length - answeredCount,
    answerChanges: responses.reduce((s, r) => s + r.answerChanges, 0),
    rushedCount: responses.filter(isRushed).length,
    slowCount: responses.filter(isSlow).length,
    carelessDragPoints: carelessDrag(responses),
    consistencyIndex: Number(consistencyIndex(responses).toFixed(2)),
  };

  const { level, note } = confidenceFrom(math, rw, breakdown);

  return {
    math,
    rw,
    total,
    totalLow,
    totalHigh,
    accuracyPct: responses.length ? (correctCount / responses.length) * 100 : 0,
    confidence: level,
    confidenceNote: note,
    breakdown,
  };
}
