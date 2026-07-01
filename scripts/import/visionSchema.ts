// Zod schema for the vision model's output. Every page's transcription is
// validated against this before it touches the database, so a malformed or
// hallucinated response fails loudly instead of corrupting the question bank.

import { z } from "zod";

export const visionChoiceSchema = z.object({
  label: z.string().min(1),
  content: z.string(),
  isCorrect: z.boolean().default(false),
  rationaleWrong: z.string().nullish(),
});

export const visionQuestionSchema = z.object({
  // The official "Question ID" hex if visible on the page (used for idempotent
  // upserts and to upgrade text-imported rows in place). Null if not shown.
  externalId: z.string().nullish(),
  section: z.enum(["MATH", "READING_WRITING"]).default("MATH"),
  domain: z.string().default("Uncategorized"),
  skill: z.string().default("Uncategorized"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  format: z.enum(["MCQ", "SPR"]).default("MCQ"),
  // Passage / data setup. Tables should be markdown pipe tables; figures should
  // be described in words prefixed with "[Figure: ...]".
  stimulus: z.string().nullish(),
  stem: z.string().min(1),
  choices: z.array(visionChoiceSchema).default([]),
  correctAnswer: z.string(),
  explanation: z.string().nullish(),
  isRegression: z.boolean().default(false),
  // True ONLY if the page indicates the item is from an official Bluebook /
  // practice test (those are reserved for diagnostics, excluded from practice).
  isBluebook: z.boolean().default(false),
  // True if a graph/diagram is present (its visual can't be fully captured as
  // text, so we flag it for a quick human check).
  hasFigure: z.boolean().default(false),
  // The model can self-flag anything it wasn't confident transcribing.
  needsReview: z.boolean().default(false),
});

export const visionPageSchema = z.object({
  questions: z.array(visionQuestionSchema).default([]),
});

export type VisionQuestion = z.infer<typeof visionQuestionSchema>;
export type VisionPage = z.infer<typeof visionPageSchema>;
