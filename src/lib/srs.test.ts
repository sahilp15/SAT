import { describe, it, expect } from "vitest";
import {
  computeNextReview,
  nextDueDate,
  initialSrsState,
  isDue,
  addDays,
  INTERVAL_LADDER_DAYS,
  MAX_INTERVAL_INDEX,
} from "./srs";

const now = new Date("2026-06-30T12:00:00Z");

describe("computeNextReview", () => {
  it("advances one rung on a confident correct answer", () => {
    const out = computeNextReview({
      ...initialSrsState(),
      result: "CORRECT",
      confidence: "CONFIDENT",
    });
    expect(out.intervalIndex).toBe(1);
    expect(out.intervalDays).toBe(INTERVAL_LADDER_DAYS[1]);
    expect(out.requiresErrorLog).toBe(false);
    expect(out.active).toBe(true);
  });

  it("holds at the same rung on a correct-but-unsure answer", () => {
    const out = computeNextReview({
      intervalIndex: 2,
      consecutiveCorrect: 1,
      lapses: 0,
      active: true,
      result: "CORRECT",
      confidence: "UNSURE",
    });
    expect(out.intervalIndex).toBe(2);
    expect(out.consecutiveCorrect).toBe(2);
  });

  it("does not accelerate on a lucky guess", () => {
    const out = computeNextReview({
      intervalIndex: 3,
      consecutiveCorrect: 0,
      lapses: 0,
      active: true,
      result: "CORRECT",
      confidence: "GUESS",
    });
    expect(out.intervalIndex).toBe(3);
  });

  it("shortens the interval and forces an error log on a miss", () => {
    const out = computeNextReview({
      intervalIndex: 4,
      consecutiveCorrect: 3,
      lapses: 0,
      active: true,
      result: "INCORRECT",
    });
    expect(out.intervalIndex).toBe(2); // stepped back two rungs
    expect(out.consecutiveCorrect).toBe(0);
    expect(out.lapses).toBe(1);
    expect(out.requiresErrorLog).toBe(true);
  });

  it("floors the interval index at 0 on repeated misses", () => {
    const out = computeNextReview({
      intervalIndex: 1,
      consecutiveCorrect: 0,
      lapses: 2,
      active: true,
      result: "INCORRECT",
    });
    expect(out.intervalIndex).toBe(0);
    expect(out.lapses).toBe(3);
  });

  it("graduates an item answered confidently at the top rung", () => {
    const out = computeNextReview({
      intervalIndex: MAX_INTERVAL_INDEX,
      consecutiveCorrect: 5,
      lapses: 0,
      active: true,
      result: "CORRECT",
      confidence: "CONFIDENT",
    });
    expect(out.graduated).toBe(true);
    expect(out.active).toBe(false);
  });
});

describe("nextDueDate", () => {
  it("keeps a rung-0 item due immediately (same session)", () => {
    const out = computeNextReview({
      ...initialSrsState(),
      result: "CORRECT",
      confidence: "UNSURE",
    });
    const due = nextDueDate(now, out);
    expect(due.getTime()).toBe(now.getTime());
    expect(isDue(due, now)).toBe(true);
  });

  it("schedules a future due date for higher rungs", () => {
    const out = computeNextReview({
      ...initialSrsState(),
      result: "CORRECT",
      confidence: "CONFIDENT",
    });
    const due = nextDueDate(now, out);
    expect(due.getTime()).toBe(addDays(now, 1).getTime());
    expect(isDue(due, now)).toBe(false);
  });
});
