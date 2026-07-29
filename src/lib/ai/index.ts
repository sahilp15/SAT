// Server-side AI facade.
//
// Every function returns an AiResult and never throws, so callers can always
// fall back to the app's offline behavior. The API key is confined to
// ./config.ts and ./client.ts and never crosses this boundary.

import "server-only";
import { callStructured, type AiResult } from "./client";
import {
  dailyCoachingMessages,
  errorLogReviewMessages,
  mistakeAnalysisMessages,
  skillDiagnosisMessages,
  studyPlanAdjustmentMessages,
  tutorMessages,
  type CoachingContext,
  type ErrorLogContext,
  type MistakeContext,
  type PlanAdjustmentContext,
  type SkillDiagnosisContext,
  type TutorContext,
} from "./prompts";
import {
  dailyCoachingSchema,
  errorLogReviewSchema,
  explanationSchema,
  mistakeAnalysisSchema,
  skillDiagnosisSchema,
  studyPlanAdjustmentSchema,
  tutorReplySchema,
  type AiDailyCoaching,
  type AiErrorLogReview,
  type AiMistakeAnalysis,
  type AiSkillDiagnosis,
  type AiStudyPlanAdjustment,
  type AiTutorReply,
} from "./schemas";

export { isAiConfigured, getAiModelLabel } from "./config";
export { getAiUsageSnapshot, clearAiCache, type AiResult } from "./client";
export type { TutorMode } from "./prompts";
export { TUTOR_MODES } from "./prompts";

/**
 * Review the quality of an error-log reflection. The rubric gate is re-applied
 * here so an over-generous model can't approve a weak reflection.
 */
export async function reviewErrorLog(
  ctx: ErrorLogContext
): Promise<AiResult<AiErrorLogReview>> {
  const result = await callStructured({
    schema: errorLogReviewSchema,
    schemaName: "error_log_review",
    messages: errorLogReviewMessages(ctx),
    temperature: 0.2,
    maxOutputTokens: 400,
  });
  if (!result.ok) return result;

  const s = result.data.rubricScores;
  const passes = s.specificity >= 3 && s.accuracy >= 3 && s.understanding >= 3;
  return {
    ...result,
    data: {
      ...result.data,
      verdict: result.data.verdict === "APPROVED" && passes ? "APPROVED" : "NEEDS_REVISION",
    },
  };
}

/** Richer mistake analysis. The heuristic version is always available first. */
export async function analyzeMistakeWithAi(
  ctx: MistakeContext,
  cacheKey?: string
): Promise<AiResult<AiMistakeAnalysis>> {
  return callStructured({
    schema: mistakeAnalysisSchema,
    schemaName: "mistake_analysis",
    messages: mistakeAnalysisMessages(ctx),
    temperature: 0.25,
    maxOutputTokens: 700,
    cacheKey,
  });
}

export async function tutorRespond(ctx: TutorContext): Promise<AiResult<AiTutorReply>> {
  return callStructured({
    schema: tutorReplySchema,
    schemaName: "tutor_reply",
    messages: tutorMessages(ctx),
    temperature: ctx.mode === "SIMILAR" ? 0.6 : 0.35,
    maxOutputTokens: ctx.mode === "SIMILAR" ? 1200 : 900,
  });
}

export async function dailyCoaching(
  ctx: CoachingContext,
  cacheKey?: string
): Promise<AiResult<AiDailyCoaching>> {
  return callStructured({
    schema: dailyCoachingSchema,
    schemaName: "daily_coaching",
    messages: dailyCoachingMessages(ctx),
    temperature: 0.5,
    maxOutputTokens: 350,
    cacheKey,
  });
}

export async function diagnoseSkill(
  ctx: SkillDiagnosisContext,
  cacheKey?: string
): Promise<AiResult<AiSkillDiagnosis>> {
  return callStructured({
    schema: skillDiagnosisSchema,
    schemaName: "skill_diagnosis",
    messages: skillDiagnosisMessages(ctx),
    temperature: 0.3,
    maxOutputTokens: 600,
    cacheKey,
  });
}

export async function suggestPlanAdjustments(
  ctx: PlanAdjustmentContext,
  cacheKey?: string
): Promise<AiResult<AiStudyPlanAdjustment>> {
  return callStructured({
    schema: studyPlanAdjustmentSchema,
    schemaName: "study_plan_adjustment",
    messages: studyPlanAdjustmentMessages(ctx),
    temperature: 0.35,
    maxOutputTokens: 600,
    cacheKey,
  });
}

export { explanationSchema };
export type {
  ErrorLogContext,
  MistakeContext,
  TutorContext,
  CoachingContext,
  SkillDiagnosisContext,
  PlanAdjustmentContext,
};
