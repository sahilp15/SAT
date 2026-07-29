import { describe, expect, it } from "vitest";
import {
  MAX_HALF_WIDTH,
  MIN_HALF_WIDTH,
  SECTION_MAX,
  SECTION_MIN,
  consistencyIndex,
  estimateAbility,
  isRushed,
  responseWeight,
  scoreDiagnostic,
  scoreSection,
  thetaToScore,
  type ScoredResponse,
} from "./scoring";
import type { Difficulty, Section } from "../taxonomy";

// A representative 10-question section: the real blueprint shape of five
// routing items followed by five adaptive ones.
const SHAPE: { difficulty: Difficulty; domain: string; stage: "ROUTING" | "ADAPTIVE" }[] = [
  { difficulty: "EASY", domain: "Algebra", stage: "ROUTING" },
  { difficulty: "EASY", domain: "Advanced Math", stage: "ROUTING" },
  { difficulty: "MEDIUM", domain: "Algebra", stage: "ROUTING" },
  { difficulty: "MEDIUM", domain: "Geometry and Trigonometry", stage: "ROUTING" },
  { difficulty: "HARD", domain: "Problem-Solving and Data Analysis", stage: "ROUTING" },
  { difficulty: "HARD", domain: "Advanced Math", stage: "ADAPTIVE" },
  { difficulty: "HARD", domain: "Algebra", stage: "ADAPTIVE" },
  { difficulty: "HARD", domain: "Geometry and Trigonometry", stage: "ADAPTIVE" },
  { difficulty: "HARD", domain: "Problem-Solving and Data Analysis", stage: "ADAPTIVE" },
  { difficulty: "HARD", domain: "Advanced Math", stage: "ADAPTIVE" },
];

function build(
  section: Section,
  correct: boolean[],
  overrides: Partial<ScoredResponse> = {}
): ScoredResponse[] {
  return SHAPE.map((s, i) => ({
    questionId: `${section}-${i}`,
    section,
    stage: s.stage,
    domain: s.domain,
    skill: `${s.domain} skill ${i}`,
    subskill: null,
    difficulty: s.difficulty,
    isCorrect: correct[i] ?? false,
    chosenAnswer: "A",
    correctAnswer: correct[i] ? "A" : "B",
    timeMs: 60_000,
    recommendedSec: 95,
    answerChanges: 0,
    flagged: false,
    ...overrides,
  }));
}

const ALL = Array.from({ length: 10 }, () => true);
const NONE = Array.from({ length: 10 }, () => false);

describe("thetaToScore", () => {
  it("maps the documented anchors", () => {
    expect(thetaToScore(0)).toBe(520);
    expect(thetaToScore(3)).toBe(790);
    expect(thetaToScore(-3)).toBe(250);
  });

  it("clamps to the 200–800 section scale", () => {
    expect(thetaToScore(99)).toBe(SECTION_MAX);
    expect(thetaToScore(-99)).toBe(SECTION_MIN);
  });

  it("always reports a multiple of 10, like the real exam", () => {
    for (let t = -3; t <= 3; t += 0.13) {
      expect(thetaToScore(t) % 10).toBe(0);
    }
  });
});

describe("estimateAbility", () => {
  it("returns the prior when there is no evidence", () => {
    const { theta, se } = estimateAbility([]);
    expect(theta).toBe(0);
    expect(se).toBeGreaterThan(1);
  });

  it("estimates higher ability for a perfect run than a failed one", () => {
    const strong = estimateAbility(build("MATH", ALL));
    const weak = estimateAbility(build("MATH", NONE));
    expect(strong.theta).toBeGreaterThan(weak.theta);
  });

  it("keeps a perfect run finite thanks to the prior", () => {
    const { theta } = estimateAbility(build("MATH", ALL));
    expect(Number.isFinite(theta)).toBe(true);
    expect(theta).toBeLessThan(3.5);
  });

  it("rewards clearing hard items more than clearing easy ones", () => {
    const hardsRight = build("MATH", [false, false, true, true, true, true, true, true, true, true]);
    const easiesRight = build("MATH", [true, true, true, true, false, false, false, false, false, false]);
    expect(estimateAbility(hardsRight).theta).toBeGreaterThan(estimateAbility(easiesRight).theta);
  });
});

describe("responseWeight", () => {
  it("down-weights an unanswered item", () => {
    const [base] = build("MATH", ALL);
    expect(responseWeight({ ...base, chosenAnswer: null })).toBeLessThan(responseWeight(base));
  });

  it("down-weights a suspiciously fast correct answer", () => {
    const [base] = build("MATH", ALL);
    const rushed = { ...base, timeMs: 5_000 };
    expect(isRushed(rushed)).toBe(true);
    expect(responseWeight(rushed)).toBeLessThan(responseWeight(base));
  });

  it("slightly up-weights targeted adaptive items", () => {
    const [routing] = build("MATH", ALL);
    expect(responseWeight({ ...routing, stage: "ADAPTIVE" })).toBeGreaterThan(
      responseWeight({ ...routing, stage: "ROUTING" })
    );
  });
});

describe("consistencyIndex", () => {
  it("is 1 when performance decreases with difficulty", () => {
    const responses = build("MATH", [true, true, true, true, false, false, false, false, false, false]);
    expect(consistencyIndex(responses)).toBe(1);
  });

  it("drops when easy items are missed but hard ones are correct", () => {
    const responses = build("MATH", [false, false, false, false, true, true, true, true, true, true]);
    expect(consistencyIndex(responses)).toBeLessThan(1);
  });
});

describe("scoreSection", () => {
  it("keeps the score inside 200–800 in both extremes", () => {
    const perfect = scoreSection("MATH", build("MATH", ALL), "HARD");
    const failed = scoreSection("MATH", build("MATH", NONE), "EASY");
    for (const s of [perfect, failed]) {
      expect(s.score).toBeGreaterThanOrEqual(SECTION_MIN);
      expect(s.score).toBeLessThanOrEqual(SECTION_MAX);
      expect(s.low).toBeGreaterThanOrEqual(SECTION_MIN);
      expect(s.high).toBeLessThanOrEqual(SECTION_MAX);
    }
    expect(perfect.score).toBeGreaterThan(failed.score);
  });

  it("orders low <= score <= high", () => {
    const s = scoreSection("MATH", build("MATH", [true, true, false, true, false, true, false, false, true, false]), "MEDIUM");
    expect(s.low).toBeLessThanOrEqual(s.score);
    expect(s.score).toBeLessThanOrEqual(s.high);
  });

  it("never claims more precision than the floor allows", () => {
    const s = scoreSection("MATH", build("MATH", ALL), "HARD");
    // The floor only applies away from the scale ends, where clamping bites.
    const half = s.high - s.score;
    expect(half).toBeLessThanOrEqual(MAX_HALF_WIDTH);
    expect(MIN_HALF_WIDTH).toBeGreaterThan(0);
  });

  it("widens the range when questions are left blank", () => {
    const answered = scoreSection("MATH", build("MATH", [true, true, true, false, false, false, false, false, false, false]), "MEDIUM");
    const blanks = scoreSection(
      "MATH",
      build("MATH", [true, true, true, false, false, false, false, false, false, false]).map((r, i) =>
        i >= 3 ? { ...r, chosenAnswer: null } : r
      ),
      "MEDIUM"
    );
    expect(blanks.high - blanks.low).toBeGreaterThan(answered.high - answered.low);
  });

  it("reports routing and adaptive accuracy separately", () => {
    const s = scoreSection(
      "MATH",
      build("MATH", [true, true, true, true, true, false, false, false, false, false]),
      "HARD"
    );
    expect(s.routingAccuracy).toBe(1);
    expect(s.adaptiveAccuracy).toBe(0);
  });
});

describe("scoreDiagnostic", () => {
  const responses = [...build("MATH", ALL), ...build("READING_WRITING", NONE)];

  it("produces a total inside 400–1600 that equals the section sum", () => {
    const result = scoreDiagnostic(responses);
    expect(result.total).toBe(result.math.score + result.rw.score);
    expect(result.total).toBeGreaterThanOrEqual(400);
    expect(result.total).toBeLessThanOrEqual(1600);
  });

  it("orders totalLow <= total <= totalHigh", () => {
    const result = scoreDiagnostic(responses);
    expect(result.totalLow).toBeLessThanOrEqual(result.total);
    expect(result.total).toBeLessThanOrEqual(result.totalHigh);
  });

  it("scores the sections independently", () => {
    const result = scoreDiagnostic(responses);
    expect(result.math.score).toBeGreaterThan(result.rw.score);
  });

  it("reports LOW confidence when most questions were left blank", () => {
    const mostlyBlank = responses.map((r, i) => (i > 4 ? { ...r, chosenAnswer: null } : r));
    expect(scoreDiagnostic(mostlyBlank).confidence).toBe("LOW");
  });

  it("never reports HIGH confidence from a rushed, inconsistent run", () => {
    const rushed = responses.map((r) => ({ ...r, timeMs: 4_000 }));
    expect(scoreDiagnostic(rushed).confidence).not.toBe("HIGH");
  });

  it("always attaches a plain-language confidence note", () => {
    expect(scoreDiagnostic(responses).confidenceNote.length).toBeGreaterThan(30);
  });

  it("computes accuracy across both sections", () => {
    const result = scoreDiagnostic(responses);
    expect(Math.round(result.accuracyPct)).toBe(50);
  });

  it("counts careless drag only when harder items were cleared", () => {
    const carelessRun = build("MATH", [false, false, true, true, true, true, true, true, true, true]);
    const noHardCleared = build("MATH", [false, false, false, false, false, false, false, false, false, false]);
    expect(scoreDiagnostic(carelessRun).breakdown.carelessDragPoints).toBeGreaterThan(0);
    expect(scoreDiagnostic(noHardCleared).breakdown.carelessDragPoints).toBe(0);
  });

  it("summarizes every content domain that was sampled", () => {
    const { breakdown } = scoreDiagnostic(build("MATH", ALL));
    const domains = new Set(breakdown.domains.map((d) => d.domain));
    expect(domains.size).toBe(4);
    expect(breakdown.difficulties.length).toBeGreaterThan(0);
    expect(breakdown.timeline).toHaveLength(10);
  });

  it("flags blanks, rushing, and answer changes", () => {
    const messy = build("MATH", NONE).map((r, i) => ({
      ...r,
      chosenAnswer: i === 0 ? null : "A",
      timeMs: i === 1 ? 3_000 : 300_000,
      answerChanges: i === 2 ? 3 : 0,
    }));
    const kinds = new Set(scoreDiagnostic(messy).breakdown.flags.map((f) => f.kind));
    expect(kinds.has("UNANSWERED")).toBe(true);
    expect(kinds.has("RUSHED")).toBe(true);
    expect(kinds.has("SLOW")).toBe(true);
    expect(kinds.has("CHANGED_ANSWER")).toBe(true);
  });

  it("is deterministic", () => {
    expect(scoreDiagnostic(responses)).toEqual(scoreDiagnostic(responses));
  });

  it("handles an empty diagnostic without throwing", () => {
    const result = scoreDiagnostic([]);
    expect(result.total).toBeGreaterThanOrEqual(400);
    expect(result.confidence).toBe("LOW");
  });
});
