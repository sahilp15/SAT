// Shared request validation.
//
// Every mutating API route parses its body through one of these schemas, so
// malformed or hostile input is rejected at the edge with a consistent shape
// instead of reaching Prisma.

import { z } from "zod";
import { DIFFICULTIES } from "./taxonomy";
import { FORM_COUNT } from "./diagnostic/blueprint";

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const STUDY_TIMES = ["MORNING", "AFTERNOON", "EVENING", "NIGHT"] as const;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format.")
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00`).getTime()), "That isn't a real date.");

export const onboardingSchema = z.object({
  grade: z.number().int().min(6).max(12).nullable().optional(),
  satDateId: z.string().max(40).nullable().optional(),
  testDate: isoDate.nullable().optional(),
  targetScore: z.number().int().min(400).max(1600).nullable().optional(),

  priorTestType: z.enum(["SAT", "PSAT", "PRACTICE", "NONE"]).nullable().optional(),
  lastTotalScore: z.number().int().min(400).max(1600).nullable().optional(),
  lastMathScore: z.number().int().min(200).max(800).nullable().optional(),
  lastRwScore: z.number().int().min(200).max(800).nullable().optional(),

  strongerSection: z.enum(["MATH", "READING_WRITING", "BALANCED"]).nullable().optional(),
  weakerSection: z.enum(["MATH", "READING_WRITING", "BALANCED"]).nullable().optional(),
  strugglingTopics: z.array(z.string().min(1).max(120)).max(20).optional(),

  daysPerWeek: z.number().int().min(1).max(7).nullable().optional(),
  minutesPerDay: z.number().int().min(10).max(600).nullable().optional(),
  availableDays: z.array(z.enum(DAY_NAMES)).max(7).optional(),
  preferredStudyTimes: z.array(z.enum(STUDY_TIMES)).max(4).optional(),

  studyStyle: z.enum(["STRUCTURED", "FLEXIBLE", "BOTH"]).nullable().optional(),
  wantsReminders: z.boolean().optional(),
  dailyGoalQuestions: z.number().int().min(0).max(200).optional(),
  planIntensity: z.enum(["AGGRESSIVE", "BALANCED", "LIGHT"]).optional(),
  diagnosticChoice: z.enum(["TAKE_NOW", "LATER"]).nullable().optional(),
  onboardingStep: z.number().int().min(0).max(20).optional(),
  complete: z.boolean().optional(),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const attemptSchema = z.object({
  questionId: z.string().min(1).max(64),
  chosenAnswer: z.string().max(200),
  mode: z.string().max(24).optional(),
  confidence: z.enum(["GUESS", "UNSURE", "CONFIDENT"]).nullable().optional(),
  timeMs: z.number().int().nonnegative().max(3_600_000).optional(),
  isReview: z.boolean().optional(),
  flagged: z.boolean().optional(),
  answerChanges: z.number().int().min(0).max(50).optional(),
});

export const diagnosticResponseSchema = z.object({
  sessionId: z.string().min(1).max(64),
  questionId: z.string().min(1).max(64),
  chosenAnswer: z.string().max(200).nullable(),
  flagged: z.boolean(),
  timeDeltaMs: z.number().int().min(0).max(3_600_000),
  answerChanges: z.number().int().min(0).max(50),
  currentIndex: z.number().int().min(0).max(100),
});

export const sessionIdSchema = z.object({ sessionId: z.string().min(1).max(64) });

export const diagnosticStartSchema = z.object({
  /** Which of the interchangeable diagnostic forms to open. */
  formId: z.number().int().min(1).max(FORM_COUNT).optional(),
});

export const practiceSetSchema = z.object({
  section: z.enum(["MATH", "READING_WRITING"]).optional(),
  skill: z.string().max(160).optional(),
  domain: z.string().max(160).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  count: z.number().int().min(1).max(40).default(10),
});

export const errorEntrySchema = z.object({
  attemptId: z.string().min(1).max(64),
  note: z.string().max(2000).nullable().optional(),
  resolved: z.boolean().optional(),
  diagnosisFeedback: z.enum(["ACCURATE", "INACCURATE"]).nullable().optional(),
});

export const tutorSchema = z.object({
  mode: z.enum(["TEACH", "HINT", "CHECK", "SIMILAR", "EXPLAIN_MISTAKE", "QUIZ", "PLAN"]),
  message: z.string().min(1).max(4000),
  questionId: z.string().max(64).nullable().optional(),
  attemptId: z.string().max(64).nullable().optional(),
  threadKey: z.string().max(80).optional(),
});

export const planDaySchema = z.object({
  dayId: z.string().min(1).max(64),
  completed: z.boolean(),
});

export const recommendationSchema = z.object({
  id: z.string().min(1).max(64),
  status: z.enum(["ACTIVE", "DONE", "DISMISSED"]),
});

export const settingsSchema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  defaultTimerSecs: z.number().int().min(15).max(600).optional(),
  aiEnabled: z.boolean().optional(),
  satDateId: z.string().max(40).nullable().optional(),
  testDate: isoDate.nullable().optional(),
  targetScore: z.number().int().min(400).max(1600).nullable().optional(),
  dailyGoalQuestions: z.number().int().min(0).max(200).optional(),
  wantsReminders: z.boolean().optional(),
});

/** Consistent 400 payload for every route. */
export function validationError(error: z.ZodError) {
  return {
    error: "invalid_request",
    message: error.issues[0]?.message ?? "The request was not valid.",
    fields: error.flatten().fieldErrors,
  };
}
