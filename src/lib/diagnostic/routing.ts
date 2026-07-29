// Adaptive routing for the score predictor.
//
// The real digital SAT routes between two modules using an item-response model.
// A 5-question routing stage cannot support that precision, so this uses the
// same *idea* with an honest, inspectable rule: score the routing stage by
// difficulty-weighted credit, then send the student to the track that will
// produce the most diagnostic information about where their ceiling actually is.
//
// Pure functions only — no DB, no clock, no randomness. Every routing decision
// is reproducible from the responses alone.

import type { Difficulty } from "../taxonomy";
import type { DiagnosticTrack } from "./form";

/** Credit a correct answer earns, by item difficulty. */
export const DIFFICULTY_CREDIT: Record<Difficulty, number> = {
  EASY: 1.0,
  MEDIUM: 1.6,
  HARD: 2.4,
};

/**
 * A miss on an easy item is stronger negative evidence than a miss on a hard
 * one, so misses carry their own (smaller, inverted) penalty scale.
 */
export const DIFFICULTY_MISS_PENALTY: Record<Difficulty, number> = {
  EASY: 0.7,
  MEDIUM: 0.4,
  HARD: 0.15,
};

export interface RoutingResponse {
  difficulty: Difficulty;
  isCorrect: boolean;
  /** True when the item was left blank — treated as a miss with less weight. */
  unanswered?: boolean;
}

export interface RoutingDecision {
  track: DiagnosticTrack;
  /** Difficulty-weighted score earned, 0..maxScore. */
  score: number;
  maxScore: number;
  /** score / maxScore, 0..1. */
  ratio: number;
  correct: number;
  answered: number;
  reason: string;
}

// Thresholds on the weighted ratio. Chosen so that:
//   - clearing the two hard/medium items plus the easy ones routes HARD,
//   - roughly half credit routes MEDIUM,
//   - missing the easy items routes EASY, where cheaper items will actually
//     discriminate between "shaky" and "hasn't learned it".
export const HARD_TRACK_THRESHOLD = 0.7;
export const MEDIUM_TRACK_THRESHOLD = 0.4;

/**
 * Decide which adaptive track follows a section's routing stage.
 *
 * Scoring: each correct answer earns DIFFICULTY_CREDIT[difficulty]; each miss
 * subtracts DIFFICULTY_MISS_PENALTY[difficulty]. An unanswered item counts as a
 * miss at half penalty (running out of time is weaker evidence than choosing
 * wrong). The result is clamped to >= 0 and divided by the total available
 * credit to get a 0..1 ratio.
 */
export function decideTrack(responses: RoutingResponse[]): RoutingDecision {
  let score = 0;
  let maxScore = 0;
  let correct = 0;
  let answered = 0;

  for (const res of responses) {
    maxScore += DIFFICULTY_CREDIT[res.difficulty];
    if (res.isCorrect) {
      score += DIFFICULTY_CREDIT[res.difficulty];
      correct += 1;
      answered += 1;
    } else {
      const penalty = DIFFICULTY_MISS_PENALTY[res.difficulty] * (res.unanswered ? 0.5 : 1);
      score -= penalty;
      if (!res.unanswered) answered += 1;
    }
  }

  score = Math.max(0, score);
  const ratio = maxScore > 0 ? score / maxScore : 0;

  let track: DiagnosticTrack;
  let reason: string;
  if (ratio >= HARD_TRACK_THRESHOLD) {
    track = "HARD";
    reason =
      "Strong routing performance, including on the harder items — the next set pushes into hard questions to find where your ceiling actually is.";
  } else if (ratio >= MEDIUM_TRACK_THRESHOLD) {
    track = "MEDIUM";
    reason =
      "Solid on the accessible items with some slips higher up — the next set sits at medium with one hard probe, which separates pacing problems from content gaps.";
  } else {
    track = "EASY";
    reason =
      "The routing stage suggests the foundations need attention first — the next set uses easier and medium items, which pin down exactly which fundamentals are missing.";
  }

  return { track, score, maxScore, ratio, correct, answered, reason };
}

/** Human-readable label for a track. */
export const TRACK_LABELS: Record<DiagnosticTrack, string> = {
  HARD: "Advanced",
  MEDIUM: "Standard",
  EASY: "Foundations",
};
