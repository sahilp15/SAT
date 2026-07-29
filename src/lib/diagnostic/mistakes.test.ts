import { describe, expect, it } from "vitest";
import { analyzeMistake, classifyMistake, trimToSentences, type MistakeSignals } from "./mistakes";

const base: MistakeSignals = {
  section: "MATH",
  domain: "Algebra",
  skill: "Linear equations in one variable",
  subskill: "Variables on both sides",
  difficulty: "MEDIUM",
  format: "MCQ",
  chosenAnswer: "B",
  correctAnswer: "C",
  timeMs: 90_000,
  recommendedSec: 95,
  answerChanges: 0,
  flagged: false,
  priorSkillAccuracy: null,
  priorSkillAttempts: 0,
};

describe("classifyMistake", () => {
  it("calls a blank answer a guess with high confidence", () => {
    const { category, confidence } = classifyMistake({ ...base, chosenAnswer: null });
    expect(category).toBe("GUESSED");
    expect(confidence).toBeGreaterThan(0.8);
  });

  it("calls a very fast wrong answer on an easy item careless", () => {
    expect(classifyMistake({ ...base, difficulty: "EASY", timeMs: 5_000 }).category).toBe(
      "CARELESS"
    );
  });

  it("calls a repeated miss on the same skill a concept gap", () => {
    const { category, confidence } = classifyMistake({
      ...base,
      priorSkillAccuracy: 0.2,
      priorSkillAttempts: 5,
    });
    expect(category).toBe("CONCEPT_GAP");
    expect(confidence).toBeGreaterThan(0.7);
  });

  it("calls a one-off miss on a strong skill careless", () => {
    expect(
      classifyMistake({ ...base, priorSkillAccuracy: 0.9, priorSkillAttempts: 8 }).category
    ).toBe("CARELESS");
  });

  it("uses answer-change behavior to detect elimination trouble", () => {
    expect(classifyMistake({ ...base, answerChanges: 3 }).category).toBe("ELIMINATION");
  });

  it("blames the clock for a slow miss late in a section", () => {
    expect(
      classifyMistake({ ...base, timeMs: 300_000, nearSectionEnd: true }).category
    ).toBe("TIME_PRESSURE");
  });

  it("distinguishes grammar from vocabulary in Reading & Writing", () => {
    const rw = { ...base, section: "READING_WRITING" as const, domain: "Standard English Conventions" };
    expect(classifyMistake({ ...rw, skill: "Boundaries" }).category).toBe("GRAMMAR_RULE");
    expect(
      classifyMistake({ ...rw, domain: "Craft and Structure", skill: "Words in Context" }).category
    ).toBe("VOCAB_CONTEXT");
    expect(
      classifyMistake({
        ...rw,
        domain: "Information and Ideas",
        skill: "Command of Evidence",
      }).category
    ).toBe("EVIDENCE_SELECTION");
  });

  it("blames setup rather than arithmetic when a word problem takes too long", () => {
    expect(
      classifyMistake({
        ...base,
        skill: "Systems of two linear equations in two variables",
        timeMs: 300_000,
      }).category
    ).toBe("INCORRECT_SETUP");
  });

  it("always returns a category and a bounded confidence", () => {
    const variants: Partial<MistakeSignals>[] = [
      {},
      { difficulty: "EASY" },
      { difficulty: "HARD" },
      { format: "SPR" },
      { section: "READING_WRITING", domain: "Expression of Ideas", skill: "Transitions" },
      { timeMs: 0 },
    ];
    for (const v of variants) {
      const { category, confidence } = classifyMistake({ ...base, ...v });
      expect(category).toBeTruthy();
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    }
  });
});

describe("analyzeMistake", () => {
  it("produces every field the review UI needs", () => {
    const analysis = analyzeMistake(base, "Choice C is correct because 2(x - 4) = 30.");
    expect(analysis.testing).toContain("Linear equations in one variable");
    expect(analysis.whyWrong).toContain("You chose B");
    expect(analysis.whyWrong).toContain("correct answer is C");
    expect(analysis.whyCorrect).toContain("Choice C is correct");
    expect(analysis.lesson.length).toBeGreaterThan(20);
    expect(analysis.nextStep.length).toBeGreaterThan(10);
    expect(analysis.similar.length).toBeGreaterThan(0);
  });

  it("names the subskill when one is known", () => {
    expect(analyzeMistake(base, null).testing).toContain("variables on both sides");
  });

  it("cites timing evidence when the answer was rushed", () => {
    const analysis = analyzeMistake({ ...base, timeMs: 6_000 }, null);
    expect(analysis.whyWrong).toContain("too fast");
  });

  it("cites history when the skill has failed before", () => {
    const analysis = analyzeMistake(
      { ...base, priorSkillAccuracy: 0.25, priorSkillAttempts: 4 },
      null
    );
    expect(analysis.whyWrong).toContain("isn't the first miss");
  });

  it("explains the no-penalty rule on a blank", () => {
    const analysis = analyzeMistake({ ...base, chosenAnswer: null }, null);
    expect(analysis.whyWrong).toContain("no penalty for guessing");
  });

  it("works with no official explanation available", () => {
    const analysis = analyzeMistake(base, null);
    expect(analysis.whyCorrect).toContain("C");
    expect(analysis.whyCorrect.length).toBeGreaterThan(20);
  });

  it("suggests concrete practice targets", () => {
    const analysis = analyzeMistake(
      {
        ...base,
        section: "READING_WRITING",
        domain: "Standard English Conventions",
        skill: "Boundaries",
        subskill: "Sentence boundaries and run-ons",
      },
      null
    );
    expect(analysis.similar).toContain("Sentence boundaries and run-ons");
    expect(analysis.similar.length).toBeLessThanOrEqual(4);
  });
});

describe("trimToSentences", () => {
  it("keeps only the requested number of sentences", () => {
    const text = "One. Two. Three. Four. Five.";
    expect(trimToSentences(text, 2)).toBe("One. Two.");
  });

  it("returns something usable for text with no sentence breaks", () => {
    const text = "x".repeat(600);
    expect(trimToSentences(text, 3).length).toBeLessThanOrEqual(600);
  });
});
