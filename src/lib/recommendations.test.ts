import { describe, expect, it } from "vitest";
import { buildRecommendation, rankRecommendations, type RecommendationInput } from "./recommendations";

const base: RecommendationInput = {
  section: "MATH",
  domain: "Algebra",
  skill: "Linear equations in two variables",
  mastery: 0.4,
  attempts: 6,
  signal: "CONCEPT_GAP",
};

describe("buildRecommendation", () => {
  it("names a specific skill rather than a section", () => {
    const r = buildRecommendation(base, 1600);
    expect(r.skill).toBe(base.skill);
    expect(r.reason).toContain("40%");
    expect(r.reason.length).toBeGreaterThan(40);
  });

  it("sets a target mastery above the current one when there's a gap", () => {
    const r = buildRecommendation(base, 1600);
    expect(r.targetMastery).toBeGreaterThan(r.currentMastery);
  });

  it("sizes bigger sets for bigger gaps", () => {
    const wide = buildRecommendation({ ...base, mastery: 0.1 }, 1600);
    const narrow = buildRecommendation({ ...base, mastery: 0.8 }, 1600);
    expect(wide.recommendedQuestions).toBeGreaterThan(narrow.recommendedQuestions);
    expect(wide.estimatedMinutes).toBeGreaterThan(narrow.estimatedMinutes);
  });

  it("picks a difficulty that matches the kind of problem", () => {
    expect(buildRecommendation({ ...base, signal: "CONCEPT_GAP" }, 1600).recommendedDifficulty).toBe("EASY");
    expect(buildRecommendation({ ...base, signal: "HARD_ONLY" }, 1600).recommendedDifficulty).toBe("HARD");
    expect(buildRecommendation({ ...base, signal: "CARELESS" }, 1600).recommendedDifficulty).toBe("MIXED");
  });

  it("prescribes a short set for careless slips rather than volume", () => {
    const careless = buildRecommendation({ ...base, mastery: 0.7, signal: "CARELESS" }, 1600);
    const gap = buildRecommendation({ ...base, mastery: 0.7, signal: "CONCEPT_GAP" }, 1600);
    expect(careless.recommendedQuestions).toBeLessThanOrEqual(gap.recommendedQuestions);
  });

  it("ranks a conceptual gap above an equally weak but improving skill", () => {
    const gap = buildRecommendation({ ...base, signal: "CONCEPT_GAP" }, 1600);
    const improving = buildRecommendation({ ...base, signal: "IMPROVING" }, 1600);
    expect(gap.impactScore).toBeGreaterThan(improving.impactScore);
  });

  it("barely prioritizes an already-strong skill", () => {
    const strong = buildRecommendation({ ...base, mastery: 0.95, signal: "STRONG" }, 1600);
    expect(strong.impactScore).toBeLessThan(0.01);
    expect(strong.priorityLabel).toBe("LOW");
  });

  it("boosts skills the student named or missed on the diagnostic", () => {
    const plain = buildRecommendation(base, 1600);
    const flagged = buildRecommendation(
      { ...base, selfReported: true, missedOnDiagnostic: true },
      1600
    );
    expect(flagged.impactScore).toBeGreaterThan(plain.impactScore);
    expect(flagged.reason).toContain("diagnostic");
  });

  it("weights heavier content domains higher", () => {
    const algebra = buildRecommendation(base, 1600);
    const geometry = buildRecommendation(
      { ...base, domain: "Geometry and Trigonometry", skill: "Circles" },
      1600
    );
    expect(algebra.impactScore).toBeGreaterThan(geometry.impactScore);
  });

  it("handles a never-practiced skill", () => {
    const r = buildRecommendation({ ...base, attempts: 0, mastery: 0, signal: "UNTESTED" }, 1600);
    expect(r.reason).toContain("haven't answered");
    expect(r.recommendedQuestions).toBeGreaterThan(0);
  });
});

describe("rankRecommendations", () => {
  const inputs: RecommendationInput[] = [
    { ...base, skill: "Strong skill", mastery: 0.95, signal: "STRONG" },
    { ...base, skill: "Big algebra gap", mastery: 0.2, signal: "CONCEPT_GAP" },
    {
      ...base,
      skill: "Minor geometry gap",
      domain: "Geometry and Trigonometry",
      mastery: 0.6,
      signal: "CARELESS",
    },
    { ...base, skill: "Hard-only advanced", domain: "Advanced Math", mastery: 0.65, signal: "HARD_ONLY" },
  ];

  it("assigns 1-based priorities in impact order", () => {
    const ranked = rankRecommendations(inputs, 1600);
    expect(ranked[0].priority).toBe(1);
    expect(ranked[0].skill).toBe("Big algebra gap");
    for (let i = 1; i < ranked.length; i += 1) {
      expect(ranked[i].impactScore).toBeLessThanOrEqual(ranked[i - 1].impactScore);
      expect(ranked[i].priority).toBe(i + 1);
    }
  });

  it("respects the limit", () => {
    expect(rankRecommendations(inputs, 1600, 2)).toHaveLength(2);
  });

  it("returns an empty list for no input rather than throwing", () => {
    expect(rankRecommendations([], 1600)).toEqual([]);
  });

  it("is deterministic", () => {
    expect(rankRecommendations(inputs, 1600)).toEqual(rankRecommendations(inputs, 1600));
  });

  it("raises every target when the student aims higher", () => {
    const at1600 = rankRecommendations(inputs, 1600);
    const at1200 = rankRecommendations(inputs, 1200);
    expect(at1600[0].targetMastery).toBeGreaterThan(at1200[0].targetMastery);
  });
});
