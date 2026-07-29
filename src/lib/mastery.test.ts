import { describe, expect, it } from "vitest";
import {
  MIN_ATTEMPTS_FOR_SIGNAL,
  classifySignal,
  computeMastery,
  parseRecent,
  targetMasteryFor,
  type AttemptRecord,
} from "./mastery";

const rec = (c: boolean, d: AttemptRecord["d"] = "MEDIUM", t = 60_000, r = 90): AttemptRecord => ({
  c,
  d,
  t,
  r,
});

describe("computeMastery", () => {
  it("returns 0 with no history", () => {
    expect(computeMastery([])).toBe(0);
  });

  it("stays inside 0..1", () => {
    for (const history of [
      Array.from({ length: 20 }, () => rec(true, "HARD")),
      Array.from({ length: 20 }, () => rec(false, "EASY")),
    ]) {
      const m = computeMastery(history);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThanOrEqual(1);
    }
  });

  it("rates consistent success above consistent failure", () => {
    const strong = computeMastery(Array.from({ length: 6 }, () => rec(true)));
    const weak = computeMastery(Array.from({ length: 6 }, () => rec(false)));
    expect(strong).toBeGreaterThan(weak);
    expect(strong).toBeGreaterThan(0.7);
    expect(weak).toBeLessThan(0.3);
  });

  it("values a hard success above an easy one", () => {
    const hard = computeMastery([rec(true, "HARD"), rec(true, "HARD"), rec(true, "HARD")]);
    const easy = computeMastery([rec(true, "EASY"), rec(true, "EASY"), rec(true, "EASY")]);
    expect(hard).toBeGreaterThan(easy);
  });

  it("shrinks thin evidence toward the middle", () => {
    const oneRight = computeMastery([rec(true)]);
    const manyRight = computeMastery(Array.from({ length: 10 }, () => rec(true)));
    expect(oneRight).toBeLessThan(manyRight);
  });

  it("weights recent attempts more heavily", () => {
    const improving = computeMastery([
      rec(false),
      rec(false),
      rec(false),
      rec(true),
      rec(true),
      rec(true),
    ]);
    const declining = computeMastery([
      rec(true),
      rec(true),
      rec(true),
      rec(false),
      rec(false),
      rec(false),
    ]);
    expect(improving).toBeGreaterThan(declining);
  });

  it("is deterministic", () => {
    const history = [rec(true, "HARD"), rec(false, "EASY"), rec(true, "MEDIUM")];
    expect(computeMastery(history)).toBe(computeMastery(history));
  });
});

describe("classifySignal", () => {
  it("reports UNTESTED below the evidence threshold", () => {
    const records = Array.from({ length: MIN_ATTEMPTS_FOR_SIGNAL - 1 }, () => rec(true));
    expect(classifySignal({ records, mastery: 0.9, prevMastery: 0.9 })).toBe("UNTESTED");
  });

  it("reports STRONG for high, stable mastery", () => {
    const records = Array.from({ length: 6 }, () => rec(true, "HARD"));
    expect(classifySignal({ records, mastery: 0.9, prevMastery: 0.89 })).toBe("STRONG");
  });

  it("reports IMPROVING when mastery jumped", () => {
    const records = Array.from({ length: 5 }, () => rec(true));
    expect(classifySignal({ records, mastery: 0.7, prevMastery: 0.55 })).toBe("IMPROVING");
  });

  it("reports HARD_ONLY when only the hard items fail", () => {
    const records = [
      rec(true, "EASY"),
      rec(true, "EASY"),
      rec(true, "MEDIUM"),
      rec(true, "MEDIUM"),
      rec(false, "HARD"),
      rec(false, "HARD"),
    ];
    expect(classifySignal({ records, mastery: 0.6, prevMastery: 0.6 })).toBe("HARD_ONLY");
  });

  it("reports TIMING when answers are right but slow", () => {
    const slow = Array.from({ length: 5 }, () => rec(true, "MEDIUM", 200_000, 90));
    expect(classifySignal({ records: slow, mastery: 0.7, prevMastery: 0.7 })).toBe("TIMING");
  });

  it("reports CARELESS when misses cluster on easy items", () => {
    const records = [
      rec(false, "EASY"),
      rec(false, "EASY"),
      rec(true, "EASY"),
      rec(true, "HARD"),
      rec(true, "HARD"),
    ];
    expect(classifySignal({ records, mastery: 0.6, prevMastery: 0.6 })).toBe("CARELESS");
  });

  it("reports CONCEPT_GAP for low mastery spread across difficulties", () => {
    const records = [
      rec(false, "EASY"),
      rec(false, "MEDIUM"),
      rec(false, "HARD"),
      rec(false, "MEDIUM"),
    ];
    expect(classifySignal({ records, mastery: 0.2, prevMastery: 0.2 })).toBe("CONCEPT_GAP");
  });
});

describe("targetMasteryFor", () => {
  it("scales with the target score", () => {
    expect(targetMasteryFor(1600)).toBeGreaterThan(targetMasteryFor(1400));
    expect(targetMasteryFor(1400)).toBeGreaterThan(targetMasteryFor(1200));
  });

  it("stays a valid probability", () => {
    for (const target of [null, 400, 1000, 1600]) {
      const m = targetMasteryFor(target);
      expect(m).toBeGreaterThan(0);
      expect(m).toBeLessThanOrEqual(1);
    }
  });
});

describe("parseRecent", () => {
  it("survives null, garbage, and wrong shapes", () => {
    expect(parseRecent(null)).toEqual([]);
    expect(parseRecent("not json")).toEqual([]);
    expect(parseRecent('{"not":"an array"}')).toEqual([]);
    expect(parseRecent('[{"nope":1}]')).toEqual([]);
  });

  it("round-trips valid records", () => {
    const records = [rec(true, "HARD"), rec(false, "EASY")];
    expect(parseRecent(JSON.stringify(records))).toEqual(records);
  });
});
