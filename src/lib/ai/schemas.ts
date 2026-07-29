// Structured-output schemas.
//
// Every AI call in this app returns JSON matching one of these zod schemas. The
// schema is sent to the model as a strict JSON Schema (via the OpenAI SDK's zod
// helper) AND re-validated on the way back, so a malformed or hallucinated shape
// is rejected before it can be stored or rendered.
//
// Note on `.nullable()` over `.optional()`: OpenAI structured outputs require
// every property to be required, so optional fields are modelled as nullable.

import { z } from "zod";
import { MISTAKE_TYPES } from "../taxonomy";

const mistakeCategories = MISTAKE_TYPES.map((m) => m.value) as [string, ...string[]];

export const mistakeAnalysisSchema = z.object({
  category: z.enum(mistakeCategories),
  confidence: z.number().min(0).max(1),
  testing: z.string().min(10).max(400),
  whyWrong: z.string().min(20).max(900),
  whyCorrect: z.string().min(20).max(900),
  lesson: z.string().min(20).max(600),
  nextStep: z.string().min(10).max(400),
  similar: z.array(z.string().min(3).max(120)).min(1).max(5),
});
export type AiMistakeAnalysis = z.infer<typeof mistakeAnalysisSchema>;

export const errorLogReviewSchema = z.object({
  verdict: z.enum(["APPROVED", "NEEDS_REVISION"]),
  feedback: z.string().min(20).max(900),
  rubricScores: z.object({
    specificity: z.number().int().min(0).max(5),
    accuracy: z.number().int().min(0).max(5),
    understanding: z.number().int().min(0).max(5),
  }),
});
export type AiErrorLogReview = z.infer<typeof errorLogReviewSchema>;

export const explanationSchema = z.object({
  summary: z.string().min(20).max(600),
  steps: z.array(z.string().min(5).max(400)).min(1).max(8),
  whyDistractorsFail: z
    .array(z.object({ label: z.string().max(4), reason: z.string().min(10).max(400) }))
    .max(4),
  takeaway: z.string().min(10).max(400),
});
export type AiExplanation = z.infer<typeof explanationSchema>;

export const practiceRecommendationSchema = z.object({
  recommendations: z
    .array(
      z.object({
        skill: z.string().min(3).max(120),
        subskill: z.string().max(120).nullable(),
        priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
        reason: z.string().min(20).max(500),
        recommendedQuestions: z.number().int().min(4).max(30),
        recommendedDifficulty: z.enum(["EASY", "MEDIUM", "HARD", "MIXED"]),
      })
    )
    .min(1)
    .max(8),
});
export type AiPracticeRecommendations = z.infer<typeof practiceRecommendationSchema>;

export const studyPlanAdjustmentSchema = z.object({
  headline: z.string().min(10).max(160),
  rationale: z.string().min(20).max(700),
  adjustments: z
    .array(
      z.object({
        area: z.string().min(3).max(120),
        change: z.string().min(10).max(300),
      })
    )
    .max(5),
});
export type AiStudyPlanAdjustment = z.infer<typeof studyPlanAdjustmentSchema>;

export const skillDiagnosisSchema = z.object({
  skill: z.string().min(3).max(120),
  diagnosis: z.string().min(20).max(700),
  rootCause: z.enum([
    "CONCEPT_GAP",
    "PROCEDURAL_SLIP",
    "TIMING",
    "READING_COMPREHENSION",
    "TEST_STRATEGY",
  ]),
  drills: z.array(z.string().min(5).max(200)).min(1).max(5),
});
export type AiSkillDiagnosis = z.infer<typeof skillDiagnosisSchema>;

export const dailyCoachingSchema = z.object({
  greeting: z.string().min(5).max(160),
  focus: z.string().min(10).max(300),
  encouragement: z.string().min(10).max(300),
  watchOut: z.string().min(10).max(300),
});
export type AiDailyCoaching = z.infer<typeof dailyCoachingSchema>;

export const tutorReplySchema = z.object({
  reply: z.string().min(1).max(4000),
  /** Present only in "generate a similar question" mode. */
  generatedQuestion: z
    .object({
      stem: z.string().min(10).max(1500),
      choices: z.array(z.object({ label: z.string().max(2), content: z.string().min(1).max(400) })).length(4),
      correctAnswer: z.string().max(2),
      explanation: z.string().min(20).max(1200),
      skill: z.string().max(120),
      difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    })
    .nullable(),
  /** Short suggested follow-ups the UI renders as chips. */
  followUps: z.array(z.string().min(3).max(90)).max(3),
});
export type AiTutorReply = z.infer<typeof tutorReplySchema>;
