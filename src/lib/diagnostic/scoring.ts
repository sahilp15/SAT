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
//    proportion, so the response weights from step 3 are re-proportioned toward
//    the blueprint weights in taxonomy.ts:
//      w_i *= clamp(0.5, 1.75, 1 + 0.2 * (target_share / observed_share - 1))
//    then renormalized so sum(w) is unchanged. This happens inside the single
//    estimate in step 4 — NOT by estimating each domain separately and
//    averaging, which would apply the prior once per domain and shrink the
//    result toward the middle five times over.
//
// 6. SCALED SCORE
//    A documented linear anchor maps logits to the 200-800 section scale:
//      theta = -2.35 -> 240,  theta = 0 -> 520,  theta = +2.35 -> 800
//      score = clamp(200, 800, round((520 + 120 * theta) / 10) * 10)
//    Scores are reported in multiples of 10, like the real exam. The slope is
//    set so that both ends of the scale are reachable by a 10-item estimate —
//    see the SCORE_SLOPE comment below, which is the part most likely to be
//    got wrong.
//
// 7. CONFIDENCE RANGE
//    Standard error from Fisher information plus the prior:
//      SE(theta) = 1 / sqrt( sum_i w_i * p_i * (1 - p_i)  +  1 / 1.2^2 )
//    Converted to score units (x120), then widened by penalties that reflect
//    evidence quality rather than ability:
//      + unanswered items, + rushed responses, + answer changes,
//      + inconsistency (missing easy items while getting hard ones right)
//    The reported band is an 80% interval (z = 1.28), with a floor of +/-30
//    points per section so the app never implies false precision. The total
//    combines the two sections' UNCLAMPED half-widths in quadrature, so a
//    section resting against 800 still contributes its real uncertainty.
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

/**
 * score = SCORE_ANCHOR + SCORE_SLOPE * theta, then clamped and rounded to 10s.
 *
 * SCORE_ANCHOR is the population mean section score. SCORE_SLOPE is one point of
 * latent ability per ~1 standard deviation of the real section-score
 * distribution, which is the usual IRT convention — and, not coincidentally, it
 * is the slope that makes the top of the scale *reachable*.
 *
 * That last part is the constraint that actually pins the number down. A MAP
 * estimate from ten items cannot run off to infinity: the N(0, PRIOR_SD^2) prior
 * pulls back harder than the likelihood pushes, so a flawless run on the hardest
 * adaptive track tops out at theta ~= 2.34 (R&W) / 2.36 (Math). At 90 points per
 * logit — the previous value — reporting 800 needed theta >= 3.11, which this
 * instrument can never produce. A perfect diagnostic scored 1420 and its
 * confidence range stopped at 1530. The floor was wrong the same way: a blank
 * test could not report below ~630.
 *
 * 280 points of headroom over 2.34 logits gives 119.7; 120 is the round number
 * just above it, so a flawless diagnostic reports exactly 1600 in both sections
 * and a hopeless one reports near the floor. `scoring.test.ts` asserts both ends
 * against the live blueprint, so this stays true if the blueprint changes.
 */
export const SCORE_ANCHOR = 520;
export const SCORE_SLOPE = 120;
export const SECTION_MIN = 200;
export const SECTION_MAX = 800;

/** z for the reported band. 1.28 ~ 80% of a normal distribution. */
export const CONFIDENCE_Z = 1.28;
export const MIN_HALF_WIDTH = 30;
export const MAX_HALF_WIDTH = 140;

export const BLUEPRINT_BLEND = 0.2;
/** Bounds on the per-domain weight multiplier — see blueprintWeights. */
export const MIN_DOMAIN_MULTIPLIER = 0.5;
export const MAX_DOMAIN_MULTIPLIER = 1.75;
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
  /**
   * The interval's half-width *before* clamping to 200–800. `low` and `high` are
   * clamped for display; this is what the total-score interval must be built
   * from, or a section resting against either end of the scale would contribute
   * zero uncertainty and imply a precision the model does not have.
   */
  halfWidth: number;
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
 * Per-response multipliers that re-proportion a section toward the official
 * content blueprint. A domain the form over-samples relative to its blueprint
 * share has each of its responses down-weighted, and vice versa.
 *
 * Two things keep this a nudge rather than a lever. The multipliers are damped
 * by BLUEPRINT_BLEND, and they are clamped: a lone response in a domain the
 * blueprint weights heavily would otherwise be scaled past 2x and end up
 * speaking for the whole section. The caller renormalizes afterwards, so the
 * correction moves *where* the evidence comes from, never how much there is.
 */
export function blueprintWeights(responses: ScoredResponse[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const res of responses) counts.set(res.domain, (counts.get(res.domain) ?? 0) + 1);
  if (counts.size < 2) return new Map();

  let weightSum = 0;
  for (const domain of counts.keys()) weightSum += domainWeight(domain);
  if (weightSum <= 0) return new Map();

  const n = responses.length;
  const out = new Map<string, number>();
  for (const [domain, count] of counts) {
    const target = domainWeight(domain) / weightSum; // share on a real test
    const observed = count / n; // share on this form
    const multiplier = 1 + BLUEPRINT_BLEND * (target / observed - 1);
    out.set(domain, clamp(multiplier, MIN_DOMAIN_MULTIPLIER, MAX_DOMAIN_MULTIPLIER));
  }
  return out;
}

/**
 * MAP estimate of theta over a fixed grid with a N(0, PRIOR_SD^2) prior.
 * Returns the prior itself (theta = 0, se = PRIOR_SD) when there is no evidence.
 *
 * The blueprint correction is applied to the response weights *inside* this one
 * estimate rather than by averaging separate per-domain estimates. Estimating
 * each domain separately would apply the prior once per domain — five shrinkages
 * averaged together instead of one — which biases every result toward the middle
 * and, at 2–3 items per domain, biases it hard.
 */
export function estimateAbility(
  responses: ScoredResponse[],
  { blueprintCorrection = true }: { blueprintCorrection?: boolean } = {}
): AbilityEstimate {
  if (responses.length === 0) return { theta: 0, se: PRIOR_SD };

  const multipliers = blueprintCorrection ? blueprintWeights(responses) : new Map<string, number>();
  const raw = responses.map((res) => responseWeight(res));
  const corrected = responses.map((res, i) => raw[i] * (multipliers.get(res.domain) ?? 1));
  // Renormalize so the blueprint correction cannot change the standard error.
  const rawTotal = raw.reduce((s, w) => s + w, 0);
  const correctedTotal = corrected.reduce((s, w) => s + w, 0);
  const scale = correctedTotal > 0 ? rawTotal / correctedTotal : 1;

  const items = responses.map((res, i) => ({
    b: ITEM_DIFFICULTY[res.difficulty],
    y: res.isCorrect ? 1 : 0,
    w: corrected[i] * scale,
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
  const theta = base.theta;
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
    halfWidth,
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
 * using the section's score-per-item sensitivity — about SCORE_SLOPE / 4 per
 * item at this test length. Reported as context — never added to the estimate.
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
    drag += slips * Math.round(SCORE_SLOPE / 4 / 10) * 10;
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
  // Uses the unclamped half-widths: a section sitting at 800 still carries its
  // full uncertainty, it just cannot express the upper half of it on a scale
  // that stops there.
  const totalHalf = Math.round(
    Math.sqrt(math.halfWidth * math.halfWidth + rw.halfWidth * rw.halfWidth)
  );
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
