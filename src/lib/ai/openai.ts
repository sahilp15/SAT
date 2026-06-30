// OpenAI implementation of the AiProvider interface.
// IMPORTANT: this module is server-only. It reads OPENAI_API_KEY from the
// environment and must never be imported into a client component. The key is
// never sent to the browser.

import "server-only";
import OpenAI from "openai";
import type { AiProvider, ChatMessage } from "./types";

export class OpenAiProvider implements AiProvider {
  readonly name = "openai";
  readonly model: string;
  private client: OpenAI;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async complete(
    messages: ChatMessage[],
    opts: { temperature?: number } = {}
  ): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      temperature: opts.temperature ?? 0.3,
      messages,
    });
    return res.choices[0]?.message?.content?.trim() ?? "";
  }

  async completeJSON<T>(
    messages: ChatMessage[],
    opts: { temperature?: number } = {}
  ): Promise<T> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      temperature: opts.temperature ?? 0.2,
      response_format: { type: "json_object" },
      messages,
    });
    const content = res.choices[0]?.message?.content ?? "{}";
    return JSON.parse(content) as T;
  }
}
