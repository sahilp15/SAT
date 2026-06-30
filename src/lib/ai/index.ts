// Server-side AI facade. High-level functions used by API routes.
// Gracefully degrades when no key is configured: callers get a clear
// `configured: false` result and the app falls back to non-AI behavior.

import "server-only";
import { OpenAiProvider } from "./openai";
import type { AiProvider, ErrorLogReviewResult } from "./types";
import {
  errorLogReviewMessages,
  studyPlanMessages,
  type ErrorLogContext,
  type StudyPlanContext,
} from "./prompts";

export function isAiConfigured(): boolean {
  return (
    process.env.AI_ENABLED !== "false" &&
    !!process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY.trim().length > 0
  );
}

function getProvider(): AiProvider | null {
  if (!isAiConfigured()) return null;
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  return new OpenAiProvider(process.env.OPENAI_API_KEY!.trim(), model);
}

export interface AiResult<T> {
  configured: boolean;
  data?: T;
  error?: string;
}

/**
 * Reviews the QUALITY of an error-log reflection. Returns NEEDS_REVISION with
 * targeted feedback for weak reflections; never auto-approves vague ones.
 */
export async function reviewErrorLog(
  ctx: ErrorLogContext
): Promise<AiResult<ErrorLogReviewResult & { model: string }>> {
  const provider = getProvider();
  if (!provider) return { configured: false };
  try {
    const result = await provider.completeJSON<ErrorLogReviewResult>(
      errorLogReviewMessages(ctx),
      { temperature: 0.2 }
    );
    // Defensive clamp + verdict sanity.
    const clamp = (n: number) => Math.max(0, Math.min(5, Math.round(n)));
    const scores = {
      specificity: clamp(result.rubricScores?.specificity ?? 0),
      accuracy: clamp(result.rubricScores?.accuracy ?? 0),
      understanding: clamp(result.rubricScores?.understanding ?? 0),
    };
    const passes =
      scores.specificity >= 3 && scores.accuracy >= 3 && scores.understanding >= 3;
    const verdict =
      result.verdict === "APPROVED" && passes ? "APPROVED" : "NEEDS_REVISION";
    return {
      configured: true,
      data: {
        verdict,
        feedback: result.feedback ?? "",
        rubricScores: scores,
        model: provider.model,
      },
    };
  } catch (e) {
    return { configured: true, error: (e as Error).message };
  }
}

export interface GeneratedStudyPlan {
  summary: string;
  phase: string;
  weeklyTasks: { title: string; description?: string; section?: string | null }[];
  dailyTasks: { title: string; description?: string }[];
  model: string;
}

export async function generateStudyPlan(
  ctx: StudyPlanContext
): Promise<AiResult<GeneratedStudyPlan>> {
  const provider = getProvider();
  if (!provider) return { configured: false };
  try {
    const data = await provider.completeJSON<Omit<GeneratedStudyPlan, "model">>(
      studyPlanMessages(ctx),
      { temperature: 0.4 }
    );
    return { configured: true, data: { ...data, model: provider.model } };
  } catch (e) {
    return { configured: true, error: (e as Error).message };
  }
}
