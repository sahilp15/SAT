"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MathText } from "@/components/MathText";
import { Highlightable } from "@/components/Highlightable";
import { DesmosPanel } from "@/components/DesmosPanel";
import {
  IconAlert,
  IconArrowRight,
  IconCalculator,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconFlag,
  IconList,
  IconSpinner,
} from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/Dialog";

// The score-predictor player.
//
// Design constraints that shaped this:
//   - Nothing about correctness is available client-side until submission.
//   - Every interaction autosaves, so a refresh or crash loses nothing.
//   - Navigation is free inside a block of five and locked across blocks —
//     revising routing answers after seeing the adaptive set would invalidate
//     the measurement.

interface ClientQuestion {
  id: string;
  index: number;
  stage: "ROUTING" | "ADAPTIVE";
  section: string;
  domain: string;
  skill: string;
  difficulty: string;
  format: string;
  stimulus: string | null;
  stem: string;
  assets: string[];
  calculatorAppropriate: boolean;
  timeRecommendationSec: number | null;
  choices: { label: string; content: string }[];
}

interface Block {
  section: string;
  stage: "ROUTING" | "ADAPTIVE";
  start: number;
  end: number;
}

interface SessionState {
  sessionId: string;
  status: string;
  currentIndex: number;
  totalQuestions: number;
  questionsPerStage: number;
  questions: ClientQuestion[];
  responses: {
    questionId: string;
    chosenAnswer: string | null;
    flagged: boolean;
    timeMs: number;
    answerChanges: number;
    visits: number;
  }[];
  blocks: Block[];
  unlockedThrough: number;
  mathTrack: string | null;
  rwTrack: string | null;
  startedAt: string;
}

interface Answer {
  chosen: string | null;
  flagged: boolean;
  changes: number;
}

type Phase = "loading" | "question" | "review" | "transition" | "confirm" | "submitting" | "error";

const SECTION_LABEL: Record<string, string> = {
  MATH: "Math",
  READING_WRITING: "Reading & Writing",
};

const TRACK_COPY: Record<string, { title: string; body: string }> = {
  HARD: {
    title: "Routing to the advanced set",
    body: "You handled the routing questions well, including the harder ones. The next five push into hard territory — that's how the estimate finds where your ceiling actually is.",
  },
  MEDIUM: {
    title: "Routing to the standard set",
    body: "Solid on the accessible questions with a few slips higher up. The next five sit at medium with one hard probe, which separates pacing problems from content gaps.",
  },
  EASY: {
    title: "Routing to the foundations set",
    body: "The routing stage suggests the fundamentals need attention first. The next five use easier and medium questions — those pin down exactly which methods are missing, which is more useful than watching you struggle with hard ones.",
  },
};

export function DiagnosticPlayer({ sessionId: initialSessionId }: { sessionId?: string }) {
  const router = useRouter();
  const [state, setState] = useState<SessionState | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [error, setError] = useState<string | null>(null);
  const [track, setTrack] = useState<string | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);

  const enterRef = useRef<number>(Date.now());
  const sessionRef = useRef<string | null>(initialSessionId ?? null);
  const startedAtRef = useRef<number>(Date.now());

  // --- Boot ---------------------------------------------------------------
  const loadState = useCallback(async (sid: string) => {
    const res = await fetch(`/api/diagnostic/state?sessionId=${encodeURIComponent(sid)}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("We couldn't load your diagnostic session.");
    const data = (await res.json()) as SessionState;
    setState(data);
    setIndex(data.currentIndex);
    setAnswers(
      Object.fromEntries(
        data.responses.map((r) => [
          r.questionId,
          { chosen: r.chosenAnswer, flagged: r.flagged, changes: r.answerChanges },
        ])
      )
    );
    startedAtRef.current = new Date(data.startedAt).getTime();
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let sid = sessionRef.current;
        if (!sid) {
          const res = await fetch("/api/diagnostic/start", { method: "POST" });
          const data = (await res.json()) as { sessionId?: string; message?: string };
          if (!res.ok || !data.sessionId) {
            throw new Error(data.message ?? "The diagnostic could not be started.");
          }
          sid = data.sessionId;
          sessionRef.current = sid;
        }
        await loadState(sid);
        if (!cancelled) {
          setPhase("question");
          enterRef.current = Date.now();
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong.");
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadState]);

  // --- Derived ------------------------------------------------------------
  const question = useMemo(
    () => state?.questions.find((q) => q.index === index) ?? null,
    [state, index]
  );
  const block = useMemo(
    () => state?.blocks.find((b) => index >= b.start && index <= b.end) ?? null,
    [state, index]
  );
  const blockQuestions = useMemo(
    () =>
      state && block
        ? state.questions.filter((q) => q.index >= block.start && q.index <= block.end)
        : [],
    [state, block]
  );
  const isLastBlock = !!(state && block && block.end >= state.totalQuestions - 1);
  const isMath = question?.section === "MATH";
  const answer = question ? answers[question.id] : undefined;

  // --- Elapsed clock (whole session, unobtrusive) --------------------------
  useEffect(() => {
    if (phase === "loading" || phase === "error" || phase === "submitting") return;
    const t = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  // --- Autosave ------------------------------------------------------------
  const persist = useCallback(
    async (q: ClientQuestion, next: Answer, nextIndex: number) => {
      const sid = sessionRef.current;
      if (!sid) return;
      const delta = Math.max(0, Date.now() - enterRef.current);
      enterRef.current = Date.now();
      try {
        await fetch("/api/diagnostic/response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sid,
            questionId: q.id,
            chosenAnswer: next.chosen,
            flagged: next.flagged,
            timeDeltaMs: delta,
            answerChanges: next.changes,
            currentIndex: nextIndex,
          }),
        });
      } catch {
        // Offline or a dropped request: the answer stays in local state and is
        // re-sent on the next navigation, so nothing is lost.
      }
    },
    []
  );

  const setAnswer = useCallback(
    (value: string | null) => {
      if (!question) return;
      setAnswers((prev) => {
        const cur = prev[question.id] ?? { chosen: null, flagged: false, changes: 0 };
        if (cur.chosen === value) return prev;
        const next: Answer = {
          ...cur,
          chosen: value,
          changes: cur.chosen !== null ? cur.changes + 1 : cur.changes,
        };
        void persist(question, next, index);
        return { ...prev, [question.id]: next };
      });
    },
    [question, index, persist]
  );

  const toggleFlag = useCallback(() => {
    if (!question) return;
    setAnswers((prev) => {
      const cur = prev[question.id] ?? { chosen: null, flagged: false, changes: 0 };
      const next = { ...cur, flagged: !cur.flagged };
      void persist(question, next, index);
      return { ...prev, [question.id]: next };
    });
  }, [question, index, persist]);

  const goTo = useCallback(
    (target: number) => {
      if (!state || !block) return;
      const clamped = Math.max(block.start, Math.min(block.end, target));
      if (question) {
        const cur = answers[question.id] ?? { chosen: null, flagged: false, changes: 0 };
        void persist(question, cur, clamped);
      }
      setIndex(clamped);
      setReviewOpen(false);
      enterRef.current = Date.now();
    },
    [state, block, question, answers, persist]
  );

  // --- Block advance / submit ---------------------------------------------
  const advance = useCallback(async () => {
    const sid = sessionRef.current;
    if (!sid || !state || !block) return;
    setBusy(true);
    setError(null);
    try {
      if (question) {
        const cur = answers[question.id] ?? { chosen: null, flagged: false, changes: 0 };
        await persist(question, cur, index);
      }
      const res = await fetch("/api/diagnostic/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        track?: string;
        nextIndex?: number;
        completed?: boolean;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "We couldn't continue the diagnostic.");

      const fresh = await loadState(sid);
      if (data.track) {
        setTrack(data.track);
        setPhase("transition");
      } else {
        setIndex(data.nextIndex ?? fresh.currentIndex);
        setPhase("question");
      }
      enterRef.current = Date.now();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }, [state, block, question, answers, index, persist, loadState]);

  const submit = useCallback(async () => {
    const sid = sessionRef.current;
    if (!sid) return;
    setPhase("submitting");
    setError(null);
    try {
      if (question) {
        const cur = answers[question.id] ?? { chosen: null, flagged: false, changes: 0 };
        await persist(question, cur, index);
      }
      const res = await fetch("/api/diagnostic/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid }),
      });
      if (!res.ok) throw new Error("We couldn't score your diagnostic.");
      router.push("/diagnostic/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("confirm");
    }
  }, [question, answers, index, persist, router]);

  // --- Guard against losing an in-progress section -------------------------
  useEffect(() => {
    if (phase === "submitting" || phase === "loading" || phase === "error") return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [phase]);

  // --- Keyboard ------------------------------------------------------------
  useEffect(() => {
    if (phase !== "question" || !question) return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const key = e.key.toUpperCase();

      if (question!.format === "MCQ") {
        const byLetter = question!.choices.find((c) => c.label === key);
        if (byLetter) {
          e.preventDefault();
          setAnswer(byLetter.label);
          return;
        }
        const numeric = Number.parseInt(e.key, 10);
        if (numeric >= 1 && numeric <= question!.choices.length) {
          e.preventDefault();
          setAnswer(question!.choices[numeric - 1].label);
          return;
        }
      }
      if (key === "F") {
        e.preventDefault();
        toggleFlag();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(index - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, question, setAnswer, toggleFlag, goTo, index]);

  // --- Render --------------------------------------------------------------
  if (phase === "loading") return <PlayerSkeleton />;

  if (phase === "error") {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-bad-weak text-bad">
          <IconAlert size={20} />
        </span>
        <h1 className="text-xl text-ink">The diagnostic couldn&apos;t start</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-3">{error}</p>
        <button
          type="button"
          className="btn btn-secondary mt-6"
          onClick={() => router.push("/diagnostic")}
        >
          Back to the score predictor
        </button>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <IconSpinner size={26} className="mx-auto text-accent" />
        <h1 className="mt-5 text-xl text-ink">Scoring your diagnostic…</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-3">
          Estimating your ability from question difficulty, analyzing every miss, and rebuilding
          your study plan. This takes a few seconds.
        </p>
      </div>
    );
  }

  if (phase === "transition" && track) {
    const copy = TRACK_COPY[track] ?? TRACK_COPY.MEDIUM;
    return (
      <div className="mx-auto max-w-xl animate-fade-up px-5 py-20">
        <p className="eyebrow">Adaptive routing</p>
        <h1 className="mt-3 text-2xl text-ink">{copy.title}</h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-3">{copy.body}</p>
        <p className="mt-4 text-[0.8125rem] leading-relaxed text-ink-3">
          You won&apos;t see whether individual answers were right until the whole diagnostic is
          submitted — that keeps the estimate honest.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-lg mt-8"
          onClick={() => {
            setTrack(null);
            setPhase("question");
            enterRef.current = Date.now();
          }}
        >
          Continue
          <IconArrowRight size={15} />
        </button>
      </div>
    );
  }

  if (phase === "confirm") {
    const unanswered = state
      ? state.questions.filter((q) => !answers[q.id]?.chosen).length +
        (state.totalQuestions - state.questions.length)
      : 0;
    const flagged = state ? state.questions.filter((q) => answers[q.id]?.flagged).length : 0;
    return (
      <div className="mx-auto max-w-xl animate-fade-up px-5 py-16">
        <p className="eyebrow">Final step</p>
        <h1 className="mt-3 text-2xl text-ink">Submit your diagnostic?</h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-3">
          Once you submit, answers are locked and your predicted score is calculated. You&apos;ll
          see every question again with a full explanation.
        </p>

        <dl className="mt-7 grid grid-cols-3 gap-3">
          <div className="card-inset p-3.5">
            <dt className="text-[0.75rem] text-ink-3">Answered</dt>
            <dd className="mt-1 font-mono text-xl font-semibold text-ink">
              {(state?.totalQuestions ?? 20) - unanswered}/{state?.totalQuestions ?? 20}
            </dd>
          </div>
          <div className="card-inset p-3.5">
            <dt className="text-[0.75rem] text-ink-3">Flagged</dt>
            <dd className="mt-1 font-mono text-xl font-semibold text-ink">{flagged}</dd>
          </div>
          <div className="card-inset p-3.5">
            <dt className="text-[0.75rem] text-ink-3">Time</dt>
            <dd className="mt-1 font-mono text-xl font-semibold text-ink">{formatTime(elapsed)}</dd>
          </div>
        </dl>

        {unanswered > 0 ? (
          <div className="mt-5 rounded-md border border-warn bg-warn-weak p-3.5">
            <p className="text-[0.8125rem] font-semibold text-ink">
              {unanswered} question{unanswered === 1 ? "" : "s"} left blank
            </p>
            <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-2">
              Blanks are scored as incorrect, but they carry less weight than a wrong answer and
              they widen your confidence range. On the real SAT there is no guessing penalty, so
              never leave one blank there.
            </p>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 text-[0.8125rem] font-medium text-bad">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-2.5">
          <button type="button" className="btn btn-primary btn-lg" onClick={submit}>
            Submit and see my score
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={() => {
              setPhase("question");
              enterRef.current = Date.now();
            }}
          >
            Keep reviewing
          </button>
        </div>
      </div>
    );
  }

  if (!state || !question || !block) return <PlayerSkeleton />;

  const answeredInBlock = blockQuestions.filter((q) => answers[q.id]?.chosen).length;
  const positionInBlock = index - block.start + 1;
  const atBlockEnd = index === block.end;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* --- Header --------------------------------------------------- */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-[0.8125rem] font-semibold leading-tight text-ink">
              {SECTION_LABEL[question.section]}
            </p>
            <p className="truncate font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
              {block.stage === "ROUTING" ? "Routing stage" : "Adaptive stage"} · {positionInBlock}/
              {blockQuestions.length}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <span
              className="hidden items-center gap-1.5 font-mono text-[0.8125rem] text-ink-3 sm:flex"
              title="Elapsed time (untimed — this is for pacing awareness only)"
            >
              <IconClock size={14} />
              {formatTime(elapsed)}
            </span>
            {isMath ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                data-active={calcOpen}
                onClick={() => setCalcOpen((o) => !o)}
                aria-pressed={calcOpen}
              >
                <IconCalculator size={15} />
                <span className="hidden sm:inline">Calculator</span>
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setReviewOpen(true)}
            >
              <IconList size={15} />
              <span className="hidden sm:inline">Review</span>
            </button>
          </div>
        </div>

        <div className="h-0.5 w-full bg-surface-2">
          <div
            className="h-full bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${((index + 1) / state.totalQuestions) * 100}%` }}
            role="progressbar"
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={state.totalQuestions}
            aria-label="Diagnostic progress"
          />
        </div>
      </header>

      {/* --- Question -------------------------------------------------- */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[0.8125rem] font-semibold text-ink">
            Question {index + 1}
            <span className="text-ink-3">/{state.totalQuestions}</span>
          </span>
          <button
            type="button"
            onClick={toggleFlag}
            aria-pressed={!!answer?.flagged}
            className={cx(
              "btn btn-sm ml-auto",
              answer?.flagged ? "border-gold bg-gold-weak text-gold" : "btn-secondary"
            )}
          >
            <IconFlag size={14} />
            {answer?.flagged ? "Flagged" : "Flag for review"}
          </button>
        </div>

        <div key={question.id} className="animate-fade-in">
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
                  "mathprose leading-relaxed text-ink",
                  isMath ? "font-math text-[1.0625rem]" : "text-[1.0625rem]"
                )}
              >
                <MathText autoMath={isMath}>{question.stem}</MathText>
              </div>
            </Highlightable>

            <div className="mt-6">
              {question.format === "MCQ" ? (
                <fieldset>
                  <legend className="sr-only">Answer choices</legend>
                  <div className="grid gap-2.5">
                    {question.choices.map((choice, i) => {
                      const selected = answer?.chosen === choice.label;
                      return (
                        <button
                          key={choice.label}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setAnswer(selected ? null : choice.label)}
                          className={cx(
                            "flex w-full items-start gap-3 rounded-md border p-3.5 text-left transition-colors duration-150",
                            selected
                              ? "border-accent bg-accent-weak"
                              : "border-line-strong bg-surface hover:border-ink-3 hover:bg-surface-2"
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cx(
                              "mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.75rem] font-bold transition-colors",
                              selected
                                ? "border-accent bg-accent text-accent-contrast"
                                : "border-line-strong text-ink-3"
                            )}
                          >
                            {choice.label}
                          </span>
                          <span
                            className={cx(
                              "min-w-0 leading-relaxed text-ink",
                              isMath && "font-math text-[1.02rem]"
                            )}
                          >
                            <span className="sr-only">Choice {choice.label}: </span>
                            <MathText autoMath={isMath}>{choice.content}</MathText>
                          </span>
                          <span className="ml-auto hidden shrink-0 self-center font-mono text-[0.625rem] text-ink-3 sm:block">
                            {i + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ) : (
                <div>
                  <label htmlFor="spr-answer" className="label">
                    Your answer
                  </label>
                  <input
                    id="spr-answer"
                    className="input max-w-[14rem] font-math text-base"
                    value={answer?.chosen ?? ""}
                    placeholder="e.g. 9 or 3/4"
                    inputMode="text"
                    autoComplete="off"
                    onChange={(e) => setAnswer(e.target.value || null)}
                  />
                  <p className="hint mt-1.5">
                    Student-produced response — type the value. Fractions and decimals are both
                    accepted.
                  </p>
                </div>
              )}
            </div>
          </article>
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-[0.8125rem] font-medium text-bad">
            {error}
          </p>
        ) : null}
      </main>

      {/* --- Footer nav ------------------------------------------------ */}
      <footer className="sticky bottom-0 border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-3 sm:px-6">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => goTo(index - 1)}
            disabled={index === block.start || busy}
          >
            <IconChevronLeft size={15} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <span className="mx-auto hidden font-mono text-[0.75rem] text-ink-3 sm:block">
            {answeredInBlock}/{blockQuestions.length} answered in this set
          </span>

          {atBlockEnd ? (
            <button
              type="button"
              className="btn btn-primary ml-auto"
              onClick={() => (isLastBlock ? setPhase("confirm") : setReviewOpen(true))}
              disabled={busy}
            >
              {busy ? <IconSpinner /> : null}
              {isLastBlock ? "Finish" : "Review this set"}
              {!busy ? <IconArrowRight size={15} /> : null}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary ml-auto"
              onClick={() => goTo(index + 1)}
              disabled={busy}
            >
              Next
              <IconChevronRight size={15} />
            </button>
          )}
        </div>
      </footer>

      {isMath ? <DesmosPanel open={calcOpen} onClose={() => setCalcOpen(false)} /> : null}

      {/* --- Review sheet ---------------------------------------------- */}
      <Dialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title={`Review this set of ${blockQuestions.length}`}
        description="Jump back to anything unanswered or flagged. Once you continue, this set is locked."
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setReviewOpen(false)}
            >
              Keep working
            </button>
            {atBlockEnd ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setReviewOpen(false);
                  if (isLastBlock) setPhase("confirm");
                  else void advance();
                }}
                disabled={busy}
              >
                {busy ? <IconSpinner /> : null}
                {isLastBlock ? "Finish diagnostic" : "Lock set and continue"}
              </button>
            ) : null}
          </>
        }
      >
        <ul className="space-y-1.5">
          {blockQuestions.map((q) => {
            const a = answers[q.id];
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => goTo(q.index)}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-md border p-2.5 text-left transition-colors",
                    q.index === index
                      ? "border-accent bg-accent-weak"
                      : "border-line hover:bg-surface-2"
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-[0.75rem] font-semibold text-ink-2">
                    {q.index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] text-ink">{q.skill}</span>
                    <span className="block truncate text-[0.75rem] text-ink-3">{q.domain}</span>
                  </span>
                  {a?.flagged ? (
                    <span className="chip bg-gold-weak text-gold">
                      <IconFlag size={11} />
                      Flagged
                    </span>
                  ) : null}
                  <span
                    className={cx(
                      "chip shrink-0",
                      a?.chosen ? "bg-good-weak text-good" : "bg-surface-2 text-ink-3"
                    )}
                  >
                    {a?.chosen ? (
                      <>
                        <IconCheck size={11} />
                        {q.format === "MCQ" ? a.chosen : "Answered"}
                      </>
                    ) : (
                      "Blank"
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Dialog>
    </div>
  );
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function PlayerSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6" aria-busy="true">
      <div className="skeleton h-4 w-32" />
      <div className="card mt-5 space-y-3 p-6">
        <div className="skeleton h-3.5 w-full" />
        <div className="skeleton h-3.5 w-11/12" />
        <div className="skeleton h-3.5 w-3/4" />
        <div className="pt-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-12 w-full" />
        ))}
      </div>
      <p className="mt-4 text-center text-[0.8125rem] text-ink-3">Preparing your diagnostic…</p>
    </div>
  );
}
