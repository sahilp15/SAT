"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MathText } from "@/components/MathText";
import { Highlightable } from "@/components/Highlightable";
import { DesmosPanel } from "@/components/DesmosPanel";
import { DesmosSolution } from "@/components/DesmosSolution";
import { ErrorLogForm } from "@/components/practice/ErrorLogForm";
import {
  IconArrowRight,
  IconCalculator,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconFlag,
  IconSparkle,
  IconSpinner,
  IconXCircle,
} from "@/components/ui/icons";
import { Badge, DifficultyBadge, EmptyState, ProgressBar, cx } from "@/components/ui/primitives";
import { CONFIDENCE_LEVELS } from "@/lib/taxonomy";

// The practice runner. Two modes share one implementation:
//   - "stream": pull the next matching question from the bank each time
//     (topic practice, spaced repetition, missed-question review)
//   - "set": work through a fixed list, e.g. the 12 questions a recommendation
//     asked for, with real progress and an end-of-set summary
//
// A wrong answer opens the error log and blocks advancing until it's written —
// that gate is the whole point of the app, so it stays.

export interface ClientQuestion {
  id: string;
  section: string;
  domain: string;
  skill: string;
  subskill: string | null;
  difficulty: string;
  format: string;
  stimulus: string | null;
  stem: string;
  assets: string[];
  requiresCalculator: boolean;
  desmosRelevant: boolean;
  calculatorAppropriate: boolean;
  timeRecommendationSec: number | null;
  isRegression: boolean;
  choices: { label: string; content: string }[];
}

interface GradeResult {
  attemptId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string | null;
  requiresErrorLog: boolean;
  choices: { label: string; content: string; isCorrect: boolean; rationaleWrong: string | null }[];
}

export interface RunnerConfig {
  mode?: string;
  section?: "MATH" | "READING_WRITING";
  difficulty?: string;
  skill?: string;
  domain?: string;
  calculator?: "desmos" | "non-desmos";
  regression?: boolean;
  timed?: boolean;
  timerSecs?: number;
}

export function PracticeRunner({
  config,
  questions,
  title,
  onExit,
}: {
  config: RunnerConfig;
  /** Fixed set. When omitted the runner streams questions from the bank. */
  questions?: ClientQuestion[];
  title?: string;
  onExit?: () => void;
}) {
  const isSet = Array.isArray(questions);
  const [index, setIndex] = useState(0);
  const [streamed, setStreamed] = useState<ClientQuestion | null>(null);
  const [loading, setLoading] = useState(!isSet);
  const [exhausted, setExhausted] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [changes, setChanges] = useState(0);
  const [flagged, setFlagged] = useState(false);
  const [confidence, setConfidence] = useState<string>("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [logDone, setLogDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [stats, setStats] = useState({ answered: 0, correct: 0 });

  const startedRef = useRef<number>(Date.now());

  const question = isSet ? (questions[index] ?? null) : streamed;
  const isReviewMode = config.mode === "srs" || config.mode === "missed";
  const isMath = (question?.section ?? config.section) === "MATH";
  const finished = isSet && index >= questions.length;

  // --- Streaming mode ------------------------------------------------------
  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (config.section) p.set("section", config.section);
    if (config.mode) p.set("mode", config.mode);
    if (config.difficulty) p.set("difficulty", config.difficulty);
    if (config.skill) p.set("skill", config.skill);
    if (config.domain) p.set("domain", config.domain);
    if (config.calculator) p.set("calculator", config.calculator);
    if (config.regression) p.set("regression", "true");
    return p.toString();
  }, [config]);

  const resetQuestionState = useCallback(() => {
    setResult(null);
    setSelected("");
    setChanges(0);
    setFlagged(false);
    setConfidence("");
    setLogDone(false);
    setError(null);
    startedRef.current = Date.now();
    if (config.timed) setSecondsLeft(config.timerSecs ?? 75);
  }, [config.timed, config.timerSecs]);

  const loadNext = useCallback(async () => {
    if (isSet) return;
    setLoading(true);
    resetQuestionState();
    try {
      const res = await fetch(`/api/questions/next?${query}`, { cache: "no-store" });
      const data = (await res.json()) as { question: ClientQuestion | null };
      if (!data.question) {
        setExhausted(true);
        setStreamed(null);
      } else {
        setStreamed(data.question);
        startedRef.current = Date.now();
      }
    } catch {
      setError("We couldn't load the next question. Check that the app is still running.");
    } finally {
      setLoading(false);
    }
  }, [isSet, query, resetQuestionState]);

  useEffect(() => {
    if (!isSet) void loadNext();
  }, [isSet, loadNext]);

  useEffect(() => {
    if (isSet) resetQuestionState();
    // Re-arms per question in a fixed set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isSet]);

  // --- Timed mode ----------------------------------------------------------
  useEffect(() => {
    if (!config.timed || result || !question || secondsLeft === null || secondsLeft <= 0) return;
    const t = window.setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [config.timed, secondsLeft, result, question]);

  // --- Answering -----------------------------------------------------------
  const choose = useCallback(
    (value: string) => {
      if (result) return;
      setSelected((prev) => {
        if (prev && prev !== value) setChanges((c) => c + 1);
        return value;
      });
    },
    [result]
  );

  const submitAnswer = useCallback(async () => {
    if (!question || submitting || result) return;
    if (!selected && question.format === "MCQ") return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          chosenAnswer: selected,
          mode: config.mode ?? "practice",
          confidence: confidence || null,
          timeMs: Date.now() - startedRef.current,
          isReview: isReviewMode,
          flagged,
          answerChanges: changes,
        }),
      });
      if (!res.ok) throw new Error("grade failed");
      const data = (await res.json()) as GradeResult;
      setResult(data);
      setStats((s) => ({
        answered: s.answered + 1,
        correct: s.correct + (data.isCorrect ? 1 : 0),
      }));
    } catch {
      setError("We couldn't record that answer. Try again — your progress so far is saved.");
    } finally {
      setSubmitting(false);
    }
  }, [question, selected, submitting, result, config.mode, confidence, isReviewMode, flagged, changes]);

  const canAdvance = !!result && (!result.requiresErrorLog || logDone);

  const advance = useCallback(() => {
    if (!canAdvance) return;
    if (isSet) setIndex((i) => i + 1);
    else void loadNext();
  }, [canAdvance, isSet, loadNext]);

  // --- Keyboard ------------------------------------------------------------
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (!question) return;

      if (!result && question.format === "MCQ") {
        const upper = e.key.toUpperCase();
        if (question.choices.some((c) => c.label === upper)) {
          e.preventDefault();
          choose(upper);
          return;
        }
        const n = Number.parseInt(e.key, 10);
        if (n >= 1 && n <= question.choices.length) {
          e.preventDefault();
          choose(question.choices[n - 1].label);
          return;
        }
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (!result) void submitAnswer();
        else advance();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, result, choose, submitAnswer, advance]);

  // --- Render --------------------------------------------------------------
  if (finished) {
    const pct = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;
    return (
      <div className="card p-8 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-good-weak text-good">
          <IconCheckCircle size={24} />
        </span>
        <h2 className="text-xl text-ink">Set complete</h2>
        <p className="mt-2 font-mono text-3xl font-semibold text-ink">
          {stats.correct}/{stats.answered}
        </p>
        <p className="mt-1 text-[0.8125rem] text-ink-3">{pct}% on this set</p>
        <p className="mx-auto mt-4 max-w-md text-[0.8125rem] leading-relaxed text-ink-3">
          Your mastery estimate and recommendations have been updated. Anything you missed is in
          your error log and will resurface for spaced review.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Link href="/practice" className="btn btn-primary">
            Another set
          </Link>
          <Link href="/errors" className="btn btn-secondary">
            Review what I missed
          </Link>
          <Link href="/dashboard" className="btn btn-ghost">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <RunnerSkeleton />;

  if (exhausted || !question) {
    return (
      <EmptyState
        icon={<IconCheck size={18} />}
        title={
          config.mode === "srs"
            ? "Nothing due for review right now"
            : "You've worked through everything matching these filters"
        }
        body={
          stats.answered > 0
            ? `This session: ${stats.correct}/${stats.answered} correct.`
            : "Try a different topic, difficulty, or mode."
        }
        action={
          onExit ? (
            <button type="button" className="btn btn-secondary" onClick={onExit}>
              Change filters
            </button>
          ) : (
            <Link href="/practice" className="btn btn-secondary">
              Back to practice
            </Link>
          )
        }
      />
    );
  }

  const graded = result?.choices ?? [];

  return (
    <div className="space-y-4">
      {/* --- Meta bar ---------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface px-3.5 py-2.5">
        <DifficultyBadge difficulty={question.difficulty} />
        <Badge>{question.domain}</Badge>
        <Badge className="hidden sm:inline-flex">{question.skill}</Badge>
        {isReviewMode ? <Badge tone="accent">Review</Badge> : null}

        <div className="ml-auto flex items-center gap-2">
          {config.timed && secondsLeft !== null ? (
            <span
              className={cx(
                "inline-flex items-center gap-1 font-mono text-[0.8125rem]",
                secondsLeft <= 10 ? "font-semibold text-bad" : "text-ink-3"
              )}
            >
              <IconClock size={13} />
              {secondsLeft}s
            </span>
          ) : null}
          <span className="font-mono text-[0.8125rem] text-ink-3">
            {stats.correct}/{stats.answered}
          </span>
          {!result ? (
            <button
              type="button"
              onClick={() => setFlagged((f) => !f)}
              aria-pressed={flagged}
              className={cx(
                "btn btn-sm",
                flagged ? "border-gold bg-gold-weak text-gold" : "btn-ghost"
              )}
            >
              <IconFlag size={13} />
              <span className="hidden sm:inline">{flagged ? "Flagged" : "Flag"}</span>
            </button>
          ) : null}
          {isMath ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setCalcOpen((o) => !o)}
              aria-pressed={calcOpen}
            >
              <IconCalculator size={14} />
              <span className="hidden sm:inline">Calculator</span>
            </button>
          ) : null}
        </div>
      </div>

      {isSet ? (
        <div>
          <div className="mb-1.5 flex items-center justify-between font-mono text-[0.75rem] text-ink-3">
            <span>{title ?? "Practice set"}</span>
            <span>
              {index + 1} / {questions.length}
            </span>
          </div>
          <ProgressBar value={index} max={questions.length} label="Set progress" />
        </div>
      ) : null}

      {/* --- Question ---------------------------------------------------- */}
      <article className="card p-5 sm:p-6">
        {question.assets.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element -- local asset, unknown intrinsic size
          <img
            key={src}
            src={src}
            alt="Figure accompanying this question"
            className="mb-4 max-h-96 rounded-md border border-line"
          />
        ))}

        {question.stimulus ? (
          <Highlightable className="annotatable mb-5" resetKey={question.id}>
            <div className="passage">
              <MathText>{question.stimulus}</MathText>
            </div>
          </Highlightable>
        ) : null}

        <Highlightable className="annotatable" resetKey={`stem-${question.id}`}>
          <div
            className={cx(
              "mathprose text-[1.0625rem] leading-relaxed text-ink",
              isMath && "font-math"
            )}
          >
            <MathText autoMath={isMath}>{question.stem}</MathText>
          </div>
        </Highlightable>

        <div className="mt-6">
          {question.format === "MCQ" ? (
            <fieldset disabled={!!result}>
              <legend className="sr-only">Answer choices</legend>
              <div className="grid gap-2.5">
                {question.choices.map((choice) => {
                  const g = graded.find((c) => c.label === choice.label);
                  const chosen = selected === choice.label;
                  const state = !result
                    ? chosen
                      ? "selected"
                      : "idle"
                    : g?.isCorrect
                      ? "correct"
                      : chosen
                        ? "wrong"
                        : "muted";
                  return (
                    <button
                      key={choice.label}
                      type="button"
                      role="radio"
                      aria-checked={chosen}
                      onClick={() => choose(choice.label)}
                      className={cx(
                        "flex w-full items-start gap-3 rounded-md border p-3.5 text-left transition-colors duration-150",
                        state === "selected" && "border-accent bg-accent-weak",
                        state === "idle" &&
                          "border-line-strong bg-surface hover:border-ink-3 hover:bg-surface-2",
                        state === "correct" && "border-good bg-good-weak",
                        state === "wrong" && "border-bad bg-bad-weak",
                        state === "muted" && "border-line opacity-60"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cx(
                          "mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.75rem] font-bold",
                          state === "selected" && "border-accent bg-accent text-accent-contrast",
                          state === "correct" && "border-good bg-good text-white",
                          state === "wrong" && "border-bad bg-bad text-white",
                          (state === "idle" || state === "muted") &&
                            "border-line-strong text-ink-3"
                        )}
                      >
                        {choice.label}
                      </span>
                      <span className={cx("min-w-0 flex-1 leading-relaxed text-ink", isMath && "font-math")}>
                        <MathText autoMath={isMath}>{choice.content}</MathText>
                        {result && g && !g.isCorrect && chosen && g.rationaleWrong ? (
                          <span className="mt-1.5 block text-[0.8125rem] text-bad">
                            {g.rationaleWrong}
                          </span>
                        ) : null}
                      </span>
                      {state === "correct" ? (
                        <IconCheckCircle size={17} className="mt-0.5 shrink-0 text-good" />
                      ) : state === "wrong" ? (
                        <IconXCircle size={17} className="mt-0.5 shrink-0 text-bad" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : (
            <div>
              <label htmlFor="spr" className="label">
                Your answer
              </label>
              <input
                id="spr"
                className="input max-w-[14rem] font-math text-base"
                value={selected}
                disabled={!!result}
                placeholder="e.g. 9 or 3/4"
                autoComplete="off"
                onChange={(e) => choose(e.target.value)}
              />
              <p className="hint mt-1.5">
                Student-produced response — fractions and decimals are both accepted.
              </p>
              {result ? (
                <p className="mt-2 text-[0.8125rem]">
                  Accepted answer:{" "}
                  <code className="rounded bg-good-weak px-1.5 py-0.5 font-mono text-good">
                    {result.correctAnswer}
                  </code>
                </p>
              ) : null}
            </div>
          )}
        </div>

        {!result ? (
          <>
            <div className="mt-6">
              <span className="label">How confident are you? (optional)</span>
              <div className="flex flex-wrap gap-2">
                {CONFIDENCE_LEVELS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className="option"
                    aria-pressed={confidence === c.value}
                    onClick={() => setConfidence(confidence === c.value ? "" : c.value)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="hint mt-1.5">
                Confidence changes how spaced repetition schedules this question.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={submitAnswer}
                disabled={submitting || (!selected && question.format === "MCQ")}
              >
                {submitting ? <IconSpinner /> : null}
                Submit answer
              </button>
              <span className="hidden text-[0.75rem] text-ink-3 sm:inline">
                or press{" "}
                <kbd className="rounded border border-line px-1 font-mono text-[0.6875rem]">
                  Enter
                </kbd>
              </span>
            </div>
          </>
        ) : null}
      </article>

      {error ? (
        <p role="alert" className="text-[0.8125rem] font-medium text-bad">
          {error}
        </p>
      ) : null}

      {/* --- Result ------------------------------------------------------ */}
      {result ? (
        <div className="space-y-4 animate-fade-up">
          {result.isCorrect ? (
            <div className="card border-good bg-good-weak p-5">
              <div className="flex items-center gap-2 font-semibold text-good">
                <IconCheckCircle size={17} />
                Correct
              </div>
              <div className="mt-3">
                {isMath ? (
                  <DesmosSolution explanation={result.explanation} stem={question.stem} />
                ) : result.explanation ? (
                  <details className="text-[0.8125rem]">
                    <summary className="cursor-pointer font-semibold text-ink-2">
                      View the official explanation
                    </summary>
                    <div className="mathprose mt-2 leading-relaxed text-ink-2">
                      <MathText>{result.explanation}</MathText>
                    </div>
                  </details>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <ErrorLogForm
                attemptId={result.attemptId}
                chosenAnswer={selected || "(blank)"}
                correctAnswer={result.correctAnswer}
                explanation={result.explanation}
                isMath={isMath}
                onApproved={() => setLogDone(true)}
              />
              {isMath ? (
                <div className="card p-5">
                  <p className="eyebrow mb-2">Solve it graphically</p>
                  <DesmosSolution
                    explanation={result.explanation}
                    stem={question.stem}
                    showExplanation={false}
                  />
                </div>
              ) : null}
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[0.8125rem] text-ink-3">
              {result.requiresErrorLog && !logDone
                ? "Complete your error log to continue."
                : "Ready for the next one."}
            </span>
            <div className="flex gap-2">
              <Link
                href={`/tutor?attemptId=${result.attemptId}&mode=${result.isCorrect ? "TEACH" : "EXPLAIN_MISTAKE"}`}
                className="btn btn-secondary"
              >
                <IconSparkle size={14} />
                Ask the tutor
              </Link>
              <button
                type="button"
                className="btn btn-primary"
                onClick={advance}
                disabled={!canAdvance}
              >
                Next question
                <IconArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isMath ? <DesmosPanel open={calcOpen} onClose={() => setCalcOpen(false)} /> : null}
    </div>
  );
}

function RunnerSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="skeleton h-10 w-full rounded-md" />
      <div className="card space-y-3 p-6">
        <div className="skeleton h-3.5 w-full" />
        <div className="skeleton h-3.5 w-11/12" />
        <div className="skeleton h-3.5 w-2/3" />
        <div className="pt-3" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
