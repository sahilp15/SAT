"use client";

import { useState } from "react";
import Link from "next/link";
import { MathText } from "@/components/MathText";
import {
  IconAlert,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconSparkle,
  IconSpinner,
  IconXCircle,
} from "@/components/ui/icons";
import { Badge, DifficultyBadge, cx } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { mistakeLabel } from "@/lib/taxonomy";

// One missed question, with the full "why did I get this wrong" write-up.
// The heuristic diagnosis is always present; the AI deep-dive is an optional
// upgrade that never blocks anything.

export interface MissedQuestion {
  attemptId: string;
  questionId: string;
  section: string;
  domain: string;
  skill: string;
  subskill: string | null;
  difficulty: string;
  format: string;
  stem: string;
  stimulus: string | null;
  choices: { label: string; content: string; isCorrect: boolean }[];
  correctAnswer: string;
  chosenAnswer: string;
  explanation: string | null;
  timeMs: number;
  recommendedSec: number;
  answerChanges: number;
  flagged: boolean;
  resolved: boolean;
  note: string | null;
  createdAt: string;
  mode: string;
  diagnosis: {
    category: string;
    confidence: number;
    testing: string;
    whyWrong: string;
    whyCorrect: string;
    lesson: string;
    nextStep: string;
    similar: string[];
    source: string;
    userFeedback: string | null;
  } | null;
}

export function MissedQuestionCard({
  item,
  defaultOpen = false,
  showQuestion = true,
}: {
  item: MissedQuestion;
  defaultOpen?: boolean;
  showQuestion?: boolean;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(defaultOpen);
  const [diagnosis, setDiagnosis] = useState(item.diagnosis);
  const [resolved, setResolved] = useState(item.resolved);
  const [note, setNote] = useState(item.note ?? "");
  const [noteOpen, setNoteOpen] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [feedback, setFeedback] = useState(item.diagnosis?.userFeedback ?? null);

  const isMath = item.section === "MATH";
  const seconds = Math.round(item.timeMs / 1000);
  const pace =
    seconds === 0
      ? null
      : seconds < item.recommendedSec * 0.25
        ? "fast"
        : seconds > item.recommendedSec * 2
          ? "slow"
          : "ok";

  async function patch(body: Record<string, unknown>) {
    const res = await fetch("/api/errors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId: item.attemptId, ...body }),
    });
    if (!res.ok) throw new Error("Save failed");
  }

  async function toggleResolved() {
    const next = !resolved;
    setResolved(next);
    try {
      await patch({ resolved: next });
      toast.success(next ? "Marked as understood" : "Moved back to unresolved");
    } catch {
      setResolved(!next);
      toast.error("Couldn't save that", "Check that the app is still running.");
    }
  }

  async function saveNote() {
    setSavingNote(true);
    try {
      await patch({ note: note.trim() || null });
      setNoteOpen(false);
      toast.success("Note saved");
    } catch {
      toast.error("Couldn't save your note");
    } finally {
      setSavingNote(false);
    }
  }

  async function rateDiagnosis(value: "ACCURATE" | "INACCURATE") {
    setFeedback(value);
    try {
      await patch({ diagnosisFeedback: value });
      toast.success(
        value === "ACCURATE" ? "Thanks — that helps" : "Noted — we'll weigh this differently"
      );
    } catch {
      setFeedback(null);
    }
  }

  async function runAiAnalysis() {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/ai/mistake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: item.attemptId }),
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        toast.info(
          "AI analysis unavailable",
          typeof data.message === "string" ? data.message : "Your local diagnosis is still here."
        );
        return;
      }
      setDiagnosis({
        category: String(data.category),
        confidence: Number(data.confidence),
        testing: String(data.testing),
        whyWrong: String(data.whyWrong),
        whyCorrect: String(data.whyCorrect),
        lesson: String(data.lesson),
        nextStep: String(data.nextStep),
        similar: Array.isArray(data.similar) ? (data.similar as string[]) : [],
        source: "ai",
        userFeedback: null,
      });
      setFeedback(null);
      toast.success("Analysis updated");
    } catch {
      toast.error("AI analysis failed", "Your local diagnosis is unchanged.");
    } finally {
      setLoadingAi(false);
    }
  }

  return (
    <article
      className={cx(
        "card overflow-hidden",
        resolved && "opacity-70 transition-opacity hover:opacity-100"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-surface-2"
      >
        <span
          className={cx(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            resolved ? "bg-good-weak text-good" : "bg-bad-weak text-bad"
          )}
          aria-hidden="true"
        >
          {resolved ? <IconCheck size={14} /> : <IconXCircle size={15} />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[0.875rem] font-semibold text-ink">{item.skill}</span>
            <DifficultyBadge difficulty={item.difficulty} />
            {item.mode === "diagnostic" ? <Badge tone="accent">Diagnostic</Badge> : null}
            {item.flagged ? <Badge tone="gold">Flagged</Badge> : null}
            {resolved ? <Badge tone="good">Understood</Badge> : null}
          </span>
          <span className="mt-1 block truncate text-[0.8125rem] text-ink-3">
            {item.domain}
            {item.subskill ? ` · ${item.subskill}` : ""}
          </span>
          {diagnosis ? (
            <span className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge tone="warn">{mistakeLabel(diagnosis.category)}</Badge>
              {pace === "fast" ? (
                <span className="inline-flex items-center gap-1 text-[0.75rem] text-ink-3">
                  <IconClock size={11} /> {seconds}s — very fast
                </span>
              ) : pace === "slow" ? (
                <span className="inline-flex items-center gap-1 text-[0.75rem] text-ink-3">
                  <IconClock size={11} /> {seconds}s — over budget
                </span>
              ) : null}
            </span>
          ) : null}
        </span>

        <IconChevronDown
          size={16}
          className={cx(
            "mt-1 shrink-0 text-ink-3 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <div className="animate-fade-in border-t border-line px-4 pb-4 pt-4">
          {showQuestion ? (
            <div className="mb-5">
              {item.stimulus ? (
                <div className="passage mb-3 rounded-md border border-line bg-surface-2 p-3.5 text-[0.9375rem]">
                  <MathText>{item.stimulus}</MathText>
                </div>
              ) : null}
              <div
                className={cx(
                  "mathprose text-[0.9375rem] leading-relaxed text-ink",
                  isMath && "font-math"
                )}
              >
                <MathText autoMath={isMath}>{item.stem}</MathText>
              </div>

              <ul className="mt-3.5 grid gap-1.5">
                {item.choices.map((choice) => {
                  const chosen = item.chosenAnswer === choice.label;
                  return (
                    <li
                      key={choice.label}
                      className={cx(
                        "flex items-start gap-2.5 rounded-md border p-2.5 text-[0.875rem]",
                        choice.isCorrect
                          ? "border-good bg-good-weak"
                          : chosen
                            ? "border-bad bg-bad-weak"
                            : "border-line"
                      )}
                    >
                      <span className="font-mono text-[0.75rem] font-bold text-ink-2">
                        {choice.label}
                      </span>
                      <span className={cx("min-w-0 flex-1 text-ink", isMath && "font-math")}>
                        <MathText autoMath={isMath}>{choice.content}</MathText>
                      </span>
                      {choice.isCorrect ? (
                        <Badge tone="good">Correct</Badge>
                      ) : chosen ? (
                        <Badge tone="bad">You chose</Badge>
                      ) : null}
                    </li>
                  );
                })}
                {item.format === "SPR" ? (
                  <li className="flex flex-wrap items-center gap-3 rounded-md border border-line p-2.5 text-[0.875rem]">
                    <span className="text-ink-3">You entered</span>
                    <code className="rounded bg-bad-weak px-1.5 py-0.5 font-mono text-bad">
                      {item.chosenAnswer || "(blank)"}
                    </code>
                    <span className="text-ink-3">Accepted</span>
                    <code className="rounded bg-good-weak px-1.5 py-0.5 font-mono text-good">
                      {item.correctAnswer}
                    </code>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {diagnosis ? (
            <div className="rounded-md border border-line bg-surface-2 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="eyebrow">Why you missed it</span>
                <Badge tone={diagnosis.source === "ai" ? "accent" : "neutral"}>
                  {diagnosis.source === "ai" ? "AI analysis" : "Local analysis"}
                </Badge>
                <span className="text-[0.6875rem] text-ink-3">
                  {Math.round(diagnosis.confidence * 100)}% confidence
                </span>
              </div>

              <dl className="space-y-3 text-[0.8125rem] leading-relaxed">
                <Field label="What it tests" value={diagnosis.testing} />
                <Field label="Why your answer failed" value={diagnosis.whyWrong} />
                <Field label="Why the correct answer works" value={diagnosis.whyCorrect} isMath={isMath} />
                <Field label="The lesson" value={diagnosis.lesson} />
                <Field label="Next step" value={diagnosis.nextStep} />
              </dl>

              {diagnosis.similar.length ? (
                <div className="mt-3.5">
                  <p className="eyebrow mb-1.5">Practice these next</p>
                  <div className="flex flex-wrap gap-1.5">
                    {diagnosis.similar.map((s) => (
                      <Link
                        key={s}
                        href={`/practice/session?skill=${encodeURIComponent(item.skill)}&section=${item.section}&count=10`}
                        className="chip bg-accent-weak text-accent transition-colors hover:bg-accent hover:text-accent-contrast"
                      >
                        {s}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3.5">
                <span className="text-[0.75rem] text-ink-3">Was this diagnosis right?</span>
                <button
                  type="button"
                  onClick={() => rateDiagnosis("ACCURATE")}
                  aria-pressed={feedback === "ACCURATE"}
                  className={cx(
                    "btn btn-sm",
                    feedback === "ACCURATE" ? "border-good bg-good-weak text-good" : "btn-secondary"
                  )}
                >
                  Accurate
                </button>
                <button
                  type="button"
                  onClick={() => rateDiagnosis("INACCURATE")}
                  aria-pressed={feedback === "INACCURATE"}
                  className={cx(
                    "btn btn-sm",
                    feedback === "INACCURATE" ? "border-bad bg-bad-weak text-bad" : "btn-secondary"
                  )}
                >
                  Not quite
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-line bg-surface-2 p-4 text-[0.8125rem] text-ink-3">
              No mistake analysis was recorded for this attempt.
            </div>
          )}

          {item.explanation ? (
            <details className="mt-3 rounded-md border border-line p-3">
              <summary className="cursor-pointer text-[0.8125rem] font-semibold text-ink-2">
                Full official explanation
              </summary>
              <div className="mathprose mt-2.5 text-[0.8125rem] leading-relaxed text-ink-2">
                <MathText autoMath={isMath}>{item.explanation}</MathText>
              </div>
            </details>
          ) : null}

          {noteOpen ? (
            <div className="mt-3">
              <label htmlFor={`note-${item.attemptId}`} className="label">
                Your note
              </label>
              <textarea
                id={`note-${item.attemptId}`}
                className="input"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What would have gotten you there? Write it in your own words."
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={saveNote}
                  disabled={savingNote}
                >
                  {savingNote ? <IconSpinner size={13} /> : null}
                  Save note
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setNoteOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : note ? (
            <div className="mt-3 rounded-md border border-line bg-surface p-3">
              <p className="eyebrow mb-1">Your note</p>
              <p className="whitespace-pre-wrap text-[0.8125rem] leading-relaxed text-ink-2">
                {note}
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={toggleResolved}>
              <IconCheck size={14} />
              {resolved ? "Mark unresolved" : "I understand this now"}
            </button>
            <Link
              href={`/practice/session?skill=${encodeURIComponent(item.skill)}&section=${item.section}&count=10`}
              className="btn btn-secondary btn-sm"
            >
              Practice this skill
            </Link>
            <Link
              href={`/tutor?attemptId=${item.attemptId}&mode=EXPLAIN_MISTAKE`}
              className="btn btn-secondary btn-sm"
            >
              <IconSparkle size={14} />
              Ask the tutor
            </Link>
            {!noteOpen ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setNoteOpen(true)}
              >
                {note ? "Edit note" : "Add a note"}
              </button>
            ) : null}
            {diagnosis?.source !== "ai" ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm ml-auto"
                onClick={runAiAnalysis}
                disabled={loadingAi}
              >
                {loadingAi ? <IconSpinner size={13} /> : <IconAlert size={13} />}
                Deeper AI analysis
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function Field({
  label,
  value,
  isMath = false,
}: {
  label: string;
  value: string;
  isMath?: boolean;
}) {
  return (
    <div>
      <dt className="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3">
        {label}
      </dt>
      <dd className="mt-0.5 text-ink-2">
        {isMath ? <MathText autoMath>{value}</MathText> : value}
      </dd>
    </div>
  );
}
