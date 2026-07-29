import { describe, expect, it } from "vitest";
import {
  MAX_DOMAIN_MULTIPLIER,
  MAX_HALF_WIDTH,
  MIN_DOMAIN_MULTIPLIER,
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
  blueprintWeights,
  type ScoredResponse,
} from "./scoring";
import { BLUEPRINT, SECTION_ORDER } from "./blueprint";
import type { DiagnosticTrack } from "./form";
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
    expect(thetaToScore(1)).toBe(640);
    expect(thetaToScore(-1)).toBe(400);
  });

  it("puts both ends of the scale inside reach of a 10-item estimate", () => {
    // The prior caps a flawless run at theta ~2.35, so the slope has to clear
    // 800 by then or the top of the scale is decoration.
    expect(thetaToScore(2.35)).toBe(800);
    expect(thetaToScore(-2.35)).toBe(240);
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

// ---------------------------------------------------------------------------
// Reachability of the scale
// ---------------------------------------------------------------------------
//
// These build responses from the *live* blueprint rather than a hand-written
// shape, so if the blueprint changes in a way that puts 1600 out of reach, this
// fails instead of quietly capping every student below their target.

/** A full 20-item response set on a given track, with a correctness rule. */
function fromBlueprint(
  track: DiagnosticTrack,
  isCorrect: (indexInSection: number, difficulty: Difficulty) => boolean
): ScoredResponse[] {
  const out: ScoredResponse[] = [];
  for (const section of SECTION_ORDER) {
    const bp = BLUEPRINT[section];
    const slots = [
      ...bp.routing.map((s) => ({ ...s, stage: "ROUTING" as const })),
      ...bp.tracks[track].map((s) => ({ ...s, stage: "ADAPTIVE" as const })),
    ];
    slots.forEach((slot, i) => {
      out.push({
        questionId: `${section}-${i}`,
        section,
        stage: slot.stage,
        domain: slot.domain,
        skill: `${slot.domain} skill`,
        subskill: null,
        difficulty: slot.difficulty,
        isCorrect: isCorrect(i, slot.difficulty),
        chosenAnswer: "A",
        correctAnswer: "A",
        timeMs: 60_000,
        recommendedSec: 90,
        answerChanges: 0,
        flagged: false,
      });
    });
  }
  return out;
}

const BOTH_HARD = { MATH: "HARD", READING_WRITING: "HARD" } as const;

describe("the reportable range is actually reachable", () => {
  it("gives a flawless diagnostic on the hardest track a perfect 1600", () => {
    const score = scoreDiagnostic(fromBlueprint("HARD", () => true), BOTH_HARD);
    expect(score.math.score).toBe(800);
    expect(score.rw.score).toBe(800);
    expect(score.total).toBe(1600);
  });

  it("lets a flawless diagnostic reach the top of every section range too", () => {
    const score = scoreDiagnostic(fromBlueprint("HARD", () => true), BOTH_HARD);
    expect(score.math.high).toBe(800);
    expect(score.rw.high).toBe(800);
    expect(score.totalHigh).toBe(1600);
  });

  it("does not claim certainty just because the estimate sits at the ceiling", () => {
    // Clamping low and high to 800 must not collapse the interval to a point.
    const score = scoreDiagnostic(fromBlueprint("HARD", () => true), BOTH_HARD);
    expect(score.math.low).toBeLessThan(800);
    expect(score.totalLow).toBeLessThan(1600);
    expect(score.math.halfWidth).toBeGreaterThanOrEqual(MIN_HALF_WIDTH);
  });

  it("reaches the bottom of the scale when nothing is right", () => {
    const score = scoreDiagnostic(fromBlueprint("EASY", () => false), {
      MATH: "EASY",
      READING_WRITING: "EASY",
    });
    expect(score.math.score).toBeLessThan(300);
    expect(score.total).toBeLessThan(600);
    expect(score.totalLow).toBeGreaterThanOrEqual(400);
  });

  it("costs real points for each miss instead of bunching everyone together", () => {
    const at = (misses: number) =>
      scoreDiagnostic(
        fromBlueprint("HARD", (i) => i < 10 - misses),
        BOTH_HARD
      ).total;
    const perfect = at(0);
    const oneEach = at(1);
    const twoEach = at(2);
    expect(perfect).toBeGreaterThan(oneEach);
    expect(oneEach).toBeGreaterThan(twoEach);
    // A single miss per section should move the number meaningfully — not by
    // ten points, and not off a cliff.
    expect(perfect - oneEach).toBeGreaterThanOrEqual(40);
    expect(perfect - oneEach).toBeLessThanOrEqual(200);
  });

  it("ranks the three tracks in order for an otherwise flawless run", () => {
    const totalFor = (track: DiagnosticTrack) =>
      scoreDiagnostic(fromBlueprint(track, () => true), {
        MATH: track,
        READING_WRITING: track,
      }).total;
    expect(totalFor("HARD")).toBeGreaterThan(totalFor("MEDIUM"));
    expect(totalFor("MEDIUM")).toBeGreaterThan(totalFor("EASY"));
  });
});

describe("blueprint correction", () => {
  it("leaves a section alone when it is already in blueprint proportion", () => {
    const even = build("MATH", ALL).map((r, i) => ({
      ...r,
      // One domain, so there is nothing to re-proportion.
      domain: "Algebra",
      skill: `Algebra ${i}`,
    }));
    expect(blueprintWeights(even).size).toBe(0);
  });

  it("compares each domain's share against the blueprint, not against the others", () => {
    // SHAPE samples Geometry at 2/10 = 20% against a 15% blueprint share, and
    // Algebra at 3/10 = 30% against 35% — so the *less* frequent domain is the
    // over-sampled one here. Sampling more of a domain than a real test does is
    // what earns a down-weight; being frequent is not.
    const weights = blueprintWeights(build("MATH", ALL));
    expect(weights.get("Geometry and Trigonometry")!).toBeLessThan(1);
    expect(weights.get("Algebra")!).toBeGreaterThan(1);
  });

  it("keeps the correction bounded so one item cannot carry a section", () => {
    // A domain sampled once against a 35% blueprint share would otherwise get a
    // 3.5x multiplier; BLUEPRINT_BLEND holds the whole correction to a nudge.
    const lopsided = build("MATH", ALL).map((r, i) => ({
      ...r,
      domain: i === 0 ? "Algebra" : "Geometry and Trigonometry",
    }));
    for (const multiplier of blueprintWeights(lopsided).values()) {
      expect(multiplier).toBeGreaterThanOrEqual(MIN_DOMAIN_MULTIPLIER);
      expect(multiplier).toBeLessThanOrEqual(MAX_DOMAIN_MULTIPLIER);
    }
  });

  it("does not change how much evidence there is, only where it came from", () => {
    // The correction redistributes weight; the standard error must not move as
    // a side effect, or a lopsided form would look more or less certain than it
    // is.
    const responses = build("MATH", [true, true, false, true, false, true, false, true, true, false]);
    const withCorrection = estimateAbility(responses);
    const without = estimateAbility(responses, { blueprintCorrection: false });
    expect(withCorrection.se).toBeCloseTo(without.se, 2);
  });

  it("does not drag a strong performance toward the middle", () => {
    // The old implementation averaged separately-shrunk per-domain estimates,
    // which applied the prior once per domain and biased both ends inward.
    const perfect = fromBlueprint("HARD", () => true).filter((r) => r.section === "MATH");
    const corrected = estimateAbility(perfect).theta;
    const pooled = estimateAbility(perfect, { blueprintCorrection: false }).theta;
    expect(Math.abs(corrected - pooled)).toBeLessThan(0.25);
  });
});
