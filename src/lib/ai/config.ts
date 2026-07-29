// AI configuration, read from the server environment only.
//
// SECURITY: OPENAI_API_KEY is read here and nowhere else in the app. This module
// is server-only, is never imported from a client component, and the key value
// is never returned from any function — callers can ask *whether* AI is
// configured, never *what the key is*.

import "server-only";

export interface AiConfig {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxRetries: number;
  maxOutputTokens: number;
  /** Cap on requests per rolling minute, per process. */
  maxRequestsPerMinute: number;
  /** Cap on total requests per day, per process — a hard cost ceiling. */
  maxRequestsPerDay: number;
  cacheTtlMs: number;
}

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** True when the server has a usable key and AI has not been switched off. */
export function isAiConfigured(): boolean {
  if (process.env.AI_ENABLED === "false") return false;
  const key = process.env.OPENAI_API_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

export function getAiConfig(): AiConfig | null {
  if (!isAiConfigured()) return null;
  return {
    apiKey: (process.env.OPENAI_API_KEY as string).trim(),
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    timeoutMs: intFromEnv("OPENAI_TIMEOUT_MS", 20_000),
    maxRetries: intFromEnv("OPENAI_MAX_RETRIES", 2),
    maxOutputTokens: intFromEnv("OPENAI_MAX_OUTPUT_TOKENS", 900),
    maxRequestsPerMinute: intFromEnv("OPENAI_MAX_REQUESTS_PER_MINUTE", 20),
    maxRequestsPerDay: intFromEnv("OPENAI_MAX_REQUESTS_PER_DAY", 400),
    cacheTtlMs: intFromEnv("OPENAI_CACHE_TTL_MS", 60 * 60 * 1000),
  };
}

/** Model name only — safe to show in the UI. Never exposes the key. */
export function getAiModelLabel(): string | null {
  const cfg = getAiConfig();
  return cfg ? cfg.model : null;
}
