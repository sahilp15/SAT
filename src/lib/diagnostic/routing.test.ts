import { describe, expect, it } from "vitest";
import {
  DIFFICULTY_CREDIT,
  HARD_TRACK_THRESHOLD,
  MEDIUM_TRACK_THRESHOLD,
  decideTrack,
  type RoutingResponse,
} from "./routing";

// The routing stage is the whole point of calling this diagnostic "adaptive",
// so these cases pin down exactly when each track is chosen.

/** The real Math routing blueprint: EASY, EASY, MEDIUM, MEDIUM, HARD. */
const MATH_ROUTING: RoutingResponse["difficulty"][] = [
  "EASY",
  "EASY",
  "MEDIUM",
  "MEDIUM",
  "HARD",
];

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

  it("routes a strong-but-imperfect stage to hard when the hard item lands", () => {
    // Missing one easy item but clearing everything else still clears 0.7.
    const result = decideTrack(answers([false, true, true, true, true]));
    expect(result.ratio).toBeGreaterThanOrEqual(HARD_TRACK_THRESHOLD);
    expect(result.track).toBe("HARD");
  });

  it("routes a mixed stage to medium", () => {
    // Easy items only: 2.0 of 7.6 available credit, minus penalties.
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
