// Hardened server-side OpenAI client.
//
// Everything the rest of the app needs from OpenAI goes through callStructured():
// one function that guarantees a validated, typed result or a clean failure.
// Nothing here throws at the caller — a failure is a value, so every feature can
// fall back to its offline behavior instead of breaking.
//
// What this adds on top of the raw SDK:
//   - hard request timeout (AbortController)
//   - bounded retries with exponential backoff, honoring Retry-After on 429
//   - per-minute and per-day request ceilings (cost control)
//   - an in-memory response cache keyed by caller-supplied cache keys
//   - zod validation of every response before it is returned
//   - error sanitizing, so an API key can never reach a log or an API response

import "server-only";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { getAiConfig } from "./config";

export type AiFailureReason =
  | "NOT_CONFIGURED"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "INVALID_RESPONSE"
  | "BUDGET_EXCEEDED"
  | "API_ERROR";

export type AiResult<T> =
  | { ok: true; data: T; cached: boolean; model: string }
  | { ok: false; reason: AiFailureReason; message: string };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StructuredCallOptions<T> {
  schema: z.ZodType<T>;
  /** Used as the JSON-schema name sent to the API; must be a bare identifier. */
  schemaName: string;
  messages: ChatMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  /** When set, identical calls reuse the cached result for the configured TTL. */
  cacheKey?: string;
}

// --- Rate limiting + cost control (per process) -----------------------------

interface UsageWindow {
  minuteStart: number;
  minuteCount: number;
  dayStart: number;
  dayCount: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
}

const usage: UsageWindow = {
  minuteStart: 0,
  minuteCount: 0,
  dayStart: 0,
  dayCount: 0,
  totalPromptTokens: 0,
  totalCompletionTokens: 0,
};

function checkAndCountRequest(maxPerMinute: number, maxPerDay: number): AiFailureReason | null {
  const now = Date.now();
  if (now - usage.minuteStart >= 60_000) {
    usage.minuteStart = now;
    usage.minuteCount = 0;
  }
  if (now - usage.dayStart >= 86_400_000) {
    usage.dayStart = now;
    usage.dayCount = 0;
  }
  if (usage.dayCount >= maxPerDay) return "BUDGET_EXCEEDED";
  if (usage.minuteCount >= maxPerMinute) return "RATE_LIMITED";
  usage.minuteCount += 1;
  usage.dayCount += 1;
  return null;
}

/** Token/request counters for the settings page. Contains no secrets. */
export function getAiUsageSnapshot() {
  return {
    requestsThisMinute: usage.minuteCount,
    requestsToday: usage.dayCount,
    promptTokens: usage.totalPromptTokens,
    completionTokens: usage.totalCompletionTokens,
  };
}

// --- Response cache ---------------------------------------------------------

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 200;

function cacheGet<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  // Refresh insertion order so the map behaves like an LRU.
  cache.delete(key);
  cache.set(key, hit);
  return hit.value as T;
}

function cacheSet(key: string, value: unknown, ttlMs: number) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function clearAiCache() {
  cache.clear();
}

// --- Error sanitizing -------------------------------------------------------

/**
 * Strip anything that looks like a credential out of an error message. The SDK
 * does not echo keys today, but this is the last line of defense before a
 * message reaches a log or an HTTP response.
 */
export function sanitizeErrorMessage(input: unknown): string {
  const raw = input instanceof Error ? input.message : String(input);
  return raw
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-***")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer ***")
    .slice(0, 300);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number | undefined): boolean {
  return status === 408 || status === 409 || status === 429 || (status !== undefined && status >= 500);
}

let clientSingleton: { key: string; client: OpenAI } | null = null;

function getClient(apiKey: string): OpenAI {
  if (clientSingleton?.key === apiKey) return clientSingleton.client;
  // maxRetries 0: retries are handled here so backoff and budgets stay in one place.
  const client = new OpenAI({ apiKey, maxRetries: 0 });
  clientSingleton = { key: apiKey, client };
  return client;
}

/**
 * Make one structured-output call. Returns a validated `T` or a typed failure.
 * Never throws.
 */
export async function callStructured<T>(opts: StructuredCallOptions<T>): Promise<AiResult<T>> {
  const cfg = getAiConfig();
  if (!cfg) {
    return { ok: false, reason: "NOT_CONFIGURED", message: "No OpenAI key is configured." };
  }

  if (opts.cacheKey) {
    const hit = cacheGet<T>(opts.cacheKey);
    if (hit !== undefined) return { ok: true, data: hit, cached: true, model: cfg.model };
  }

  const limited = checkAndCountRequest(cfg.maxRequestsPerMinute, cfg.maxRequestsPerDay);
  if (limited) {
    return {
      ok: false,
      reason: limited,
      message:
        limited === "BUDGET_EXCEEDED"
          ? "Daily AI request limit reached. Everything else keeps working; the limit resets in 24 hours."
          : "Too many AI requests in the last minute. Try again shortly.",
    };
  }

  const client = getClient(cfg.apiKey);
  let lastMessage = "The AI service did not respond.";
  let lastReason: AiFailureReason = "API_ERROR";

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
    try {
      const completion = await client.chat.completions.create(
        {
          model: cfg.model,
          temperature: opts.temperature ?? 0.2,
          max_tokens: Math.min(opts.maxOutputTokens ?? cfg.maxOutputTokens, cfg.maxOutputTokens),
          messages: opts.messages,
          response_format: zodResponseFormat(opts.schema, opts.schemaName),
        },
        { signal: controller.signal }
      );

      usage.totalPromptTokens += completion.usage?.prompt_tokens ?? 0;
      usage.totalCompletionTokens += completion.usage?.completion_tokens ?? 0;

      const choice = completion.choices[0];
      if (choice?.finish_reason === "length") {
        lastReason = "INVALID_RESPONSE";
        lastMessage = "The AI response was cut off before it was complete.";
        continue;
      }
      const content = choice?.message?.content;
      if (!content) {
        lastReason = "INVALID_RESPONSE";
        lastMessage = "The AI returned an empty response.";
        continue;
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(content);
      } catch {
        lastReason = "INVALID_RESPONSE";
        lastMessage = "The AI response was not valid JSON.";
        continue;
      }

      const validated = opts.schema.safeParse(parsedJson);
      if (!validated.success) {
        lastReason = "INVALID_RESPONSE";
        lastMessage = `The AI response did not match the expected shape (${validated.error.issues[0]?.path.join(".") || "unknown field"}).`;
        continue;
      }

      if (opts.cacheKey) cacheSet(opts.cacheKey, validated.data, cfg.cacheTtlMs);
      return { ok: true, data: validated.data, cached: false, model: cfg.model };
    } catch (err) {
      if (controller.signal.aborted) {
        lastReason = "TIMEOUT";
        lastMessage = `The AI request timed out after ${Math.round(cfg.timeoutMs / 1000)}s.`;
      } else if (err instanceof OpenAI.APIError) {
        lastReason = err.status === 429 ? "RATE_LIMITED" : "API_ERROR";
        lastMessage = sanitizeErrorMessage(err);
        if (!isRetryableStatus(err.status)) break;
        // Respect a server-provided Retry-After when present.
        const retryAfter = Number(err.headers?.["retry-after"]);
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
          await sleep(Math.min(retryAfter * 1000, 5_000));
        }
      } else {
        lastReason = "API_ERROR";
        lastMessage = sanitizeErrorMessage(err);
      }
    } finally {
      clearTimeout(timer);
    }

    if (attempt < cfg.maxRetries) {
      await sleep(Math.min(400 * Math.pow(2, attempt), 4_000));
    }
  }

  return { ok: false, reason: lastReason, message: lastMessage };
}
