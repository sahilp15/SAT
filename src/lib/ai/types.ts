// Provider-agnostic AI interface. Swapping OpenAI for another provider later
// means implementing this one interface — callers never import a vendor SDK.

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiProvider {
  readonly name: string;
  readonly model: string;
  /** Returns the assistant's text completion for a chat. */
  complete(messages: ChatMessage[], opts?: { temperature?: number }): Promise<string>;
  /** Returns parsed JSON of type T (provider is asked to respond with JSON). */
  completeJSON<T>(messages: ChatMessage[], opts?: { temperature?: number }): Promise<T>;
}

export interface ErrorLogReviewResult {
  verdict: "APPROVED" | "NEEDS_REVISION";
  feedback: string;
  rubricScores: {
    specificity: number; // 0..5
    accuracy: number; // 0..5
    understanding: number; // 0..5
  };
}
