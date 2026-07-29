import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  dailyCoachingSchema,
  errorLogReviewSchema,
  mistakeAnalysisSchema,
  practiceRecommendationSchema,
  skillDiagnosisSchema,
  studyPlanAdjustmentSchema,
  tutorReplySchema,
} from "./schemas";
import { callStructured, sanitizeErrorMessage, clearAiCache } from "./client";
import { isAiConfigured } from "./config";
import { offlineTutorReply } from "../tutorFallback";
import type { TutorMode, TutorProfile } from "./prompts";

// Two things matter here: a malformed AI response must never reach the database
// or the UI, and every feature must keep working when the API doesn't.

describe("structured-output validation", () => {
  it("accepts a well-formed mistake analysis", () => {
    const result = mistakeAnalysisSchema.safeParse({
      category: "CONCEPT_GAP",
      confidence: 0.8,
      testing: "Algebra: linear equations in two variables.",
      whyWrong: "You solved for x when the question asked for the value of 2x, a classic near-miss.",
      whyCorrect: "Substituting back gives 2x = 30, which matches choice C exactly.",
      lesson: "Read the final clause of the prompt again before selecting an answer.",
      nextStep: "Do a focused set on linear equations at medium difficulty.",
      similar: ["Linear equations in one variable"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invented mistake category", () => {
    const result = mistakeAnalysisSchema.safeParse({
      category: "VIBES",
      confidence: 0.8,
      testing: "Algebra: linear equations.",
      whyWrong: "A".repeat(30),
      whyCorrect: "B".repeat(30),
      lesson: "C".repeat(30),
      nextStep: "D".repeat(20),
      similar: ["something"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range confidence", () => {
    const result = mistakeAnalysisSchema.safeParse({
      category: "CARELESS",
      confidence: 7,
      testing: "Algebra.",
      whyWrong: "A".repeat(30),
      whyCorrect: "B".repeat(30),
      lesson: "C".repeat(30),
      nextStep: "D".repeat(20),
      similar: ["x"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a truncated or empty write-up", () => {
    expect(
      mistakeAnalysisSchema.safeParse({
        category: "CARELESS",
        confidence: 0.5,
        testing: "ok",
        whyWrong: "",
        whyCorrect: "",
        lesson: "",
        nextStep: "",
        similar: [],
      }).success
    ).toBe(false);
  });

  it("clamps error-log rubric scores to 0..5", () => {
    expect(
      errorLogReviewSchema.safeParse({
        verdict: "APPROVED",
        feedback: "F".repeat(40),
        rubricScores: { specificity: 9, accuracy: 4, understanding: 4 },
      }).success
    ).toBe(false);
  });

  it("requires exactly four choices on a generated question", () => {
    const withThree = tutorReplySchema.safeParse({
      reply: "Here is a practice question.",
      generatedQuestion: {
        stem: "What is the value of x?",
        choices: [
          { label: "A", content: "1" },
          { label: "B", content: "2" },
          { label: "C", content: "3" },
        ],
        correctAnswer: "A",
        explanation: "E".repeat(40),
        skill: "Linear equations",
        difficulty: "EASY",
      },
      followUps: [],
    });
    expect(withThree.success).toBe(false);
  });

  it("accepts a tutor reply with no generated question", () => {
    const result = tutorReplySchema.safeParse({
      reply: "Try isolating the variable first.",
      generatedQuestion: null,
      followUps: ["Explain my mistake"],
    });
    expect(result.success).toBe(true);
  });

  it("bounds the recommendation, diagnosis, plan, and coaching shapes", () => {
    expect(practiceRecommendationSchema.safeParse({ recommendations: [] }).success).toBe(false);
    expect(
      skillDiagnosisSchema.safeParse({
        skill: "Circles",
        diagnosis: "D".repeat(40),
        rootCause: "NOT_A_CAUSE",
        drills: ["one"],
      }).success
    ).toBe(false);
    expect(
      studyPlanAdjustmentSchema.safeParse({
        headline: "Shift toward algebra",
        rationale: "R".repeat(40),
        adjustments: [],
      }).success
    ).toBe(true);
    expect(
      dailyCoachingSchema.safeParse({
        greeting: "Morning",
        focus: "F".repeat(20),
        encouragement: "E".repeat(20),
        watchOut: "W".repeat(20),
      }).success
    ).toBe(true);
  });
});

describe("credential safety", () => {
  it("never echoes an API key in an error message", () => {
    const message = sanitizeErrorMessage(
      new Error("401 Incorrect API key provided: sk-proj-abcd1234efgh5678 (request id x)")
    );
    expect(message).not.toContain("abcd1234efgh5678");
    expect(message).toContain("sk-***");
  });

  it("strips bearer tokens", () => {
    expect(sanitizeErrorMessage("Authorization: Bearer abc.def.ghi failed")).toContain("Bearer ***");
  });

  it("bounds the message length so nothing large leaks", () => {
    expect(sanitizeErrorMessage("x".repeat(5000)).length).toBeLessThanOrEqual(300);
  });
});

describe("behavior when the OpenAI API is unavailable", () => {
  const saved = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    clearAiCache();
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (saved === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = saved;
  });

  it("reports that AI is not configured rather than throwing", async () => {
    expect(isAiConfigured()).toBe(false);
    const result = await callStructured({
      schema: dailyCoachingSchema,
      schemaName: "daily_coaching",
      messages: [{ role: "user", content: "hi" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("NOT_CONFIGURED");
      expect(result.message).not.toContain("sk-");
    }
  });

  it("honors the AI_ENABLED kill switch even with a key present", () => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    process.env.AI_ENABLED = "false";
    expect(isAiConfigured()).toBe(false);
    delete process.env.AI_ENABLED;
    expect(isAiConfigured()).toBe(true);
  });
});

describe("offline tutor fallback", () => {
  const profile: TutorProfile = {
    daysUntilTest: 24,
    targetScore: 1600,
    predictedTotal: 1380,
    predictedMath: 700,
    predictedRw: 680,
    minutesPerDay: 60,
    weakestSkills: [{ skill: "Circles", mastery: 0.3, signal: "CONCEPT_GAP" }],
    strongestSkills: [{ skill: "Transitions", mastery: 0.9 }],
    recentMistakes: [{ skill: "Circles", category: "CONCEPT_GAP", difficulty: "HARD" }],
    questionsAnswered: 120,
    accuracy: 0.72,
    todayPlan: "Targeted skill work — Focused set: Circles",
    avgSecondsPerQuestion: 80,
  };

  const MODES: TutorMode[] = [
    "TEACH",
    "HINT",
    "CHECK",
    "SIMILAR",
    "EXPLAIN_MISTAKE",
    "QUIZ",
    "PLAN",
  ];

  it("returns a usable reply in every mode with no AI", () => {
    for (const mode of MODES) {
      const reply = offlineTutorReply(mode, profile, null);
      expect(reply.reply.length).toBeGreaterThan(40);
      expect(reply.generatedQuestion).toBeNull();
    }
  });

  it("says plainly why AI is unavailable", () => {
    expect(offlineTutorReply("PLAN", profile, null, "BUDGET_EXCEEDED").reply).toContain("budget");
    expect(offlineTutorReply("PLAN", profile, null, "TIMEOUT").reply).toContain("timed out");
    expect(offlineTutorReply("PLAN", profile, null, "NOT_CONFIGURED").reply).toContain(
      "OPENAI_API_KEY"
    );
  });

  it("refuses to fabricate a question offline", () => {
    const reply = offlineTutorReply("SIMILAR", profile, null);
    expect(reply.generatedQuestion).toBeNull();
    expect(reply.reply).toContain("won't fabricate");
  });

  it("falls back to the official explanation when one exists", () => {
    const reply = offlineTutorReply("EXPLAIN_MISTAKE", profile, {
      stem: "What is x?",
      choices: [{ label: "A", content: "1" }],
      correctAnswer: "A",
      officialExplanation: "Choice A is correct because the slope is 3.",
      chosenAnswer: "B",
      section: "MATH",
      domain: "Algebra",
      skill: "Linear functions",
      difficulty: "MEDIUM",
    });
    expect(reply.reply).toContain("the slope is 3");
  });

  it("uses the student's own data to plan the day", () => {
    const reply = offlineTutorReply("PLAN", profile, null);
    expect(reply.reply).toContain("Circles");
    expect(reply.reply).toContain("24 days");
  });
});
