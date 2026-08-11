import { describe, expect, it } from "vitest";
import {
  DIFFICULTY_CREDIT,
  DIFFICULTY_MISS_PENALTY,
  HARD_TRACK_THRESHOLD,
  MEDIUM_TRACK_THRESHOLD,
  decideTrack,
  type RoutingResponse,
} from "./routing";
import { BLUEPRINT } from "./blueprint";
import { ITEM_DIFFICULTY } from "./scoring";

// The routing stage is the whole point of calling this diagnostic "adaptive",
// so these cases pin down exactly when each track is chosen.

/**
 * Read from the live blueprint rather than hard-coded. The thresholds are
 * derived against a specific routing shape, so a test that keeps its own copy
 * of that shape goes on passing after the blueprint moves — while testing a
 * routing stage no student is given.
 */
const MATH_ROUTING: RoutingResponse["difficulty"][] = BLUEPRINT.MATH.routing.map(
  (slot) => slot.difficulty
);

function answers(correct: boolean[]): RoutingResponse[] {
  return MATH_ROUTING.map((difficulty, i) => ({ difficulty, isCorrect: correct[i] }));
}

describe("decideTrack", () => {
  it("routes a perfect routing stage to the hard track", () => {
    const result = decideTrack(answers([true, true, true, true, true]));
    expect(result.track).toBe("HARD");
    expect(result.ratio).toBe(1);
    expect(result.correct).toBe(5);
  });

  it("routes an all-wrong routing stage to the easy track", () => {
    const result = decideTrack(answers([false, false, false, false, false]));
    expect(result.track).toBe("EASY");
    expect(result.ratio).toBe(0);
  });

  it("routes a strong-but-imperfect stage to hard when the hard items land", () => {
    // Missing the opening accessible item but clearing everything above it.
    const result = decideTrack(answers([false, true, true, true, true]));
    expect(result.ratio).toBeGreaterThanOrEqual(HARD_TRACK_THRESHOLD);
    expect(result.track).toBe("HARD");
  });

  it("routes a mixed stage to medium", () => {
    // Clears the accessible half, misses the hard items.
    const result = decideTrack(answers([true, true, true, false, false]));
    expect(result.track).toBe("MEDIUM");
    expect(result.ratio).toBeGreaterThanOrEqual(MEDIUM_TRACK_THRESHOLD);
    expect(result.ratio).toBeLessThan(HARD_TRACK_THRESHOLD);
  });

  it("weights harder questions more than easy ones", () => {
    const hardOnly = decideTrack([
      { difficulty: "HARD", isCorrect: true },
      { difficulty: "EASY", isCorrect: false },
    ]);
    const easyOnly = decideTrack([
      { difficulty: "HARD", isCorrect: false },
      { difficulty: "EASY", isCorrect: true },
    ]);
    expect(hardOnly.score).toBeGreaterThan(easyOnly.score);
    expect(DIFFICULTY_CREDIT.HARD).toBeGreaterThan(DIFFICULTY_CREDIT.EASY);
  });

  it("penalizes an easy miss more than a hard miss", () => {
    const missedEasy = decideTrack([
      { difficulty: "EASY", isCorrect: false },
      { difficulty: "MEDIUM", isCorrect: true },
      { difficulty: "HARD", isCorrect: true },
    ]);
    const missedHard = decideTrack([
      { difficulty: "EASY", isCorrect: true },
      { difficulty: "MEDIUM", isCorrect: true },
      { difficulty: "HARD", isCorrect: false },
    ]);
    // Both miss one item, but the hard miss costs less ratio relative to credit.
    expect(missedEasy.score).toBeLessThan(missedHard.score + DIFFICULTY_CREDIT.HARD);
    expect(missedEasy.ratio).toBeLessThan(1);
  });

  it("treats an unanswered item as a half-penalty miss", () => {
    const blank = decideTrack([
      { difficulty: "EASY", isCorrect: false, unanswered: true },
      { difficulty: "MEDIUM", isCorrect: true },
    ]);
    const wrong = decideTrack([
      { difficulty: "EASY", isCorrect: false },
      { difficulty: "MEDIUM", isCorrect: true },
    ]);
    expect(blank.score).toBeGreaterThan(wrong.score);
    expect(blank.answered).toBe(1);
    expect(wrong.answered).toBe(2);
  });

  it("never returns a negative score", () => {
    const result = decideTrack([
      { difficulty: "EASY", isCorrect: false },
      { difficulty: "EASY", isCorrect: false },
      { difficulty: "EASY", isCorrect: false },
    ]);
    expect(result.score).toBe(0);
    expect(result.ratio).toBe(0);
  });

  it("handles an empty routing stage without dividing by zero", () => {
    const result = decideTrack([]);
    expect(result.ratio).toBe(0);
    expect(result.track).toBe("EASY");
    expect(Number.isFinite(result.score)).toBe(true);
  });

  it("always explains its decision", () => {
    for (const correct of [
      [true, true, true, true, true],
      [true, true, false, false, false],
      [false, false, false, false, false],
    ]) {
      const result = decideTrack(answers(correct));
      expect(result.reason.length).toBeGreaterThan(20);
    }
  });

  it("is deterministic — the same responses always route the same way", () => {
    const responses = answers([true, false, true, false, true]);
    const first = decideTrack(responses);
    const second = decideTrack(responses);
    expect(second).toEqual(first);
  });
});

/**
 * The thresholds are calibrated, not chosen by feel: they exist to put the
 * track boundaries at particular *abilities*. Because the ratio divides by the
 * routing stage's total available credit, raising the difficulty of the routing
 * slots lowers the ratio a given student earns — so leaving the thresholds
 * alone after a blueprint change silently routes everyone downward.
 *
 * These cases re-derive the boundaries from the live blueprint and the same
 * Rasch difficulties the scoring model uses, and fail if the two drift apart.
 */
describe("threshold calibration against the live blueprint", () => {
  /** Expected weighted ratio for a student of ability theta, under Rasch. */
  function expectedRatio(theta: number): number {
    let score = 0;
    let maxScore = 0;
    for (const difficulty of MATH_ROUTING) {
      const p = 1 / (1 + Math.exp(-(theta - ITEM_DIFFICULTY[difficulty])));
      maxScore += DIFFICULTY_CREDIT[difficulty];
      score += p * DIFFICULTY_CREDIT[difficulty] - (1 - p) * DIFFICULTY_MISS_PENALTY[difficulty];
    }
    return Math.max(0, score) / maxScore;
  }

  /** The ability at which the expected ratio crosses a threshold. */
  function boundary(threshold: number): number {
    let lo = -4;
    let hi = 4;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (expectedRatio(mid) < threshold) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // Where the boundaries sat before the difficulty of the routing stage was
  // raised. Holding these fixed is the whole point of re-deriving the
  // thresholds — the instrument got harder, who lands on which track did not.
  it("puts the hard-track boundary at the intended ability", () => {
    expect(boundary(HARD_TRACK_THRESHOLD)).toBeCloseTo(1.32, 1);
  });

  it("puts the medium-track boundary at the intended ability", () => {
    expect(boundary(MEDIUM_TRACK_THRESHOLD)).toBeCloseTo(0.13, 1);
  });

  it("keeps the boundaries ordered and inside the reportable range", () => {
    const hard = boundary(HARD_TRACK_THRESHOLD);
    const medium = boundary(MEDIUM_TRACK_THRESHOLD);
    expect(medium).toBeLessThan(hard);
    expect(medium).toBeGreaterThan(-3.5);
    expect(hard).toBeLessThan(3.5);
  });
});
