"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MathText } from "@/components/MathText";
import {
  IconAlert,
  IconArrowRight,
  IconSparkle,
  IconSpinner,
} from "@/components/ui/icons";
import { Badge, cx } from "@/components/ui/primitives";
import { TUTOR_MODES, type TutorMode } from "@/lib/ai/prompts";

// The tutor surface. Modes are explicit rather than inferred from the message,
// because "give me a hint" and "teach me this" need genuinely different
// behavior and guessing wrong is worse than asking.

export interface TutorMessageView {
  id: string;
  role: "user" | "assistant";
  mode: string | null;
  content: string;
  createdAt: string;
  generatedQuestion?: GeneratedQuestion | null;
}

interface GeneratedQuestion {
  stem: string;
  choices: { label: string; content: string }[];
  correctAnswer: string;
  explanation: string;
  skill: string;
  difficulty: string;
}

export interface TutorQuestionSummary {
  id: string;
  skill: string;
  domain: string;
  section: string;
  difficulty: string;
  stem: string;
  chosenAnswer: string | null;
  correctAnswer: string;
  wasCorrect: boolean | null;
}

const MODE_PLACEHOLDERS: Record<TutorMode, string> = {
  TEACH: "What concept should I build up from scratch?",
  HINT: "Where are you stuck? I'll give one nudge, not the answer.",
  CHECK: "Walk me through your reasoning and I'll find the first wrong step.",
  SIMILAR: "Which skill should the new practice question test?",
  EXPLAIN_MISTAKE: "Ask about the question you missed.",
  QUIZ: "Which skill should I quiz you on?",
  PLAN: "How much time do you have today?",
};

export function TutorChat({
  initialMessages,
  initialMode,
  question,
  aiEnabled,
  suggestions,
}: {
  initialMessages: TutorMessageView[];
  initialMode: TutorMode;
  question: TutorQuestionSummary | null;
  aiEnabled: boolean;
  suggestions: string[];
}) {
  const [messages, setMessages] = useState<TutorMessageView[]>(initialMessages);
  const [mode, setMode] = useState<TutorMode>(initialMode);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const send = useCallback(
    async (text: string, sendMode: TutorMode = mode) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setBusy(true);
      setError(null);
      setFollowUps([]);
      setInput("");

      const optimistic: TutorMessageView = {
        id: `local-${Date.now()}`,
        role: "user",
        mode: sendMode,
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      setMessages((m) => [...m, optimistic]);

      try {
        const res = await fetch("/api/ai/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: sendMode,
            message: trimmed,
            questionId: question?.id ?? null,
          }),
        });
        const data = (await res.json()) as {
          reply?: string;
          generatedQuestion?: GeneratedQuestion | null;
          followUps?: string[];
          source?: string;
          message?: string;
        };
        if (!res.ok || !data.reply) {
          throw new Error(data.message ?? "The tutor didn't respond.");
        }
        setMessages((m) => [
          ...m,
          {
            id: `reply-${Date.now()}`,
            role: "assistant",
            mode: sendMode,
            content: data.reply as string,
            createdAt: new Date().toISOString(),
            generatedQuestion: data.generatedQuestion ?? null,
          },
        ]);
        setFollowUps(data.followUps ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [busy, mode, question?.id]
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_18rem]">
      <div className="flex min-h-[60vh] flex-col">
        {question ? (
          <div className="card mb-4 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">In scope</Badge>
              <Badge>{question.skill}</Badge>
              <Badge>{question.difficulty.toLowerCase()}</Badge>
              {question.wasCorrect === false ? <Badge tone="bad">You missed this</Badge> : null}
            </div>
            <p className="mt-2.5 line-clamp-3 text-[0.8125rem] leading-relaxed text-ink-2">
              {question.stem}
            </p>
            {question.chosenAnswer ? (
              <p className="mt-2 font-mono text-[0.75rem] text-ink-3">
                You chose {question.chosenAnswer} · correct answer {question.correctAnswer}
              </p>
            ) : null}
          </div>
        ) : null}

        {!aiEnabled ? (
          <div className="mb-4 rounded-md border border-warn bg-warn-weak p-3.5">
            <p className="flex items-center gap-2 text-[0.8125rem] font-semibold text-ink">
              <IconAlert size={14} />
              AI coaching is off
            </p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-2">
              Add an <code className="font-mono">OPENAI_API_KEY</code> to your{" "}
              <code className="font-mono">.env</code> to turn it on. The tutor still answers using
              your own data and the official explanations stored with each question.
            </p>
          </div>
        ) : null}

        <div className="flex-1 space-y-4">
          {messages.length === 0 ? (
            <div className="card p-6 text-center">
              <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent-weak text-accent">
                <IconSparkle size={18} />
              </span>
              <h2 className="text-[0.9375rem] font-semibold text-ink">
                Ask about anything you&apos;re working on
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-[0.8125rem] leading-relaxed text-ink-3">
                The tutor can see your diagnostic results, skill mastery, recent mistakes, study
                plan, and test date — so it doesn&apos;t need you to explain your situation first.
              </p>
              {suggestions.length ? (
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="option"
                      onClick={() => void send(s)}
                      disabled={busy}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}

          {busy ? (
            <div className="flex items-center gap-2 text-[0.8125rem] text-ink-3">
              <IconSpinner size={14} />
              Thinking…
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-[0.8125rem] font-medium text-bad">
              {error}
            </p>
          ) : null}

          {followUps.length ? (
            <div className="flex flex-wrap gap-2">
              {followUps.map((f) => (
                <button
                  key={f}
                  type="button"
                  className="option"
                  onClick={() => void send(f)}
                  disabled={busy}
                >
                  {f}
                  <IconArrowRight size={12} />
                </button>
              ))}
            </div>
          ) : null}

          <div ref={endRef} />
        </div>

        <div className="sticky bottom-0 mt-4 border-t border-line bg-paper pt-3">
          <label htmlFor="tutor-input" className="sr-only">
            Message the tutor
          </label>
          <div className="flex items-end gap-2">
            <textarea
              id="tutor-input"
              ref={inputRef}
              rows={2}
              className="input resize-none"
              placeholder={MODE_PLACEHOLDERS[mode]}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy}
            />
            <button
              type="button"
              className="btn btn-primary btn-lg shrink-0"
              onClick={() => void send(input)}
              disabled={busy || !input.trim()}
            >
              {busy ? <IconSpinner /> : <IconArrowRight size={15} />}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <p className="hint mt-1.5">
            Enter to send, Shift+Enter for a new line. Generated questions are written by the model
            in the SAT&apos;s style — they are not official College Board questions.
          </p>
        </div>
      </div>

      <aside className="order-first lg:order-last">
        <div className="card p-4 lg:sticky lg:top-20">
          <p className="eyebrow mb-2.5">Tutor mode</p>
          <div className="flex flex-wrap gap-2 lg:flex-col">
            {TUTOR_MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                className="option w-full flex-col items-start gap-0.5 py-2 text-left"
                aria-pressed={mode === m.value}
                onClick={() => setMode(m.value)}
              >
                <span className="font-semibold">{m.label}</span>
                <span className="text-[0.6875rem] font-normal text-ink-3">{m.blurb}</span>
              </button>
            ))}
          </div>
          <p className="hint mt-3 border-t border-line pt-3">
            The mode changes what the tutor is allowed to do. In hint mode it will not give you the
            answer, however you ask.
          </p>
        </div>
      </aside>
    </div>
  );
}

function MessageBubble({ message }: { message: TutorMessageView }) {
  const isUser = message.role === "user";
  const modeLabel = TUTOR_MODES.find((m) => m.value === message.mode)?.label;

  return (
    <div className={cx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[46rem] rounded-lg border p-4",
          isUser ? "border-accent bg-accent-weak" : "border-line bg-surface"
        )}
      >
        {!isUser && modeLabel ? (
          <p className="eyebrow mb-2 flex items-center gap-1.5">
            <IconSparkle size={11} />
            {modeLabel}
          </p>
        ) : null}
        <div className="mathprose whitespace-pre-wrap text-[0.875rem] leading-relaxed text-ink">
          <MathText autoMath>{message.content}</MathText>
        </div>

        {message.generatedQuestion ? (
          <GeneratedQuestionCard question={message.generatedQuestion} />
        ) : null}
      </div>
    </div>
  );
}

function GeneratedQuestionCard({ question }: { question: GeneratedQuestion }) {
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className="mt-4 rounded-md border border-line bg-surface-2 p-4">
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <Badge tone="warn">AI-generated practice</Badge>
        <Badge>{question.skill}</Badge>
        <Badge>{question.difficulty.toLowerCase()}</Badge>
      </div>
      <p className="hint mb-3">
        Written by the model in the SAT&apos;s style. Not an official College Board question — your
        real practice sets use validated bank items.
      </p>

      <div className="mathprose text-[0.875rem] leading-relaxed text-ink">
        <MathText autoMath>{question.stem}</MathText>
      </div>

      <div className="mt-3 grid gap-1.5">
        {question.choices.map((c) => {
          const isCorrect = c.label === question.correctAnswer;
          const chosen = picked === c.label;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => {
                setPicked(c.label);
                setRevealed(true);
              }}
              className={cx(
                "flex items-start gap-2.5 rounded-md border p-2.5 text-left text-[0.875rem] transition-colors",
                revealed && isCorrect
                  ? "border-good bg-good-weak"
                  : revealed && chosen
                    ? "border-bad bg-bad-weak"
                    : "border-line bg-surface hover:border-ink-3"
              )}
            >
              <span className="font-mono text-[0.75rem] font-bold text-ink-2">{c.label}</span>
              <span className="min-w-0 flex-1 text-ink">
                <MathText autoMath>{c.content}</MathText>
              </span>
            </button>
          );
        })}
      </div>

      {revealed ? (
        <div className="mathprose mt-3 rounded-md border border-line bg-surface p-3 text-[0.8125rem] leading-relaxed text-ink-2">
          <MathText autoMath>{question.explanation}</MathText>
        </div>
      ) : null}

      <div className="mt-3">
        <Link href="/practice" className="text-[0.8125rem] font-medium text-accent hover:underline">
          Practice this skill with real bank questions →
        </Link>
      </div>
    </div>
  );
}
