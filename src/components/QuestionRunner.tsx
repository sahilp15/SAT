"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MathText } from "./MathText";
import { ErrorLogForm } from "./ErrorLogForm";
import { DesmosPanel } from "./DesmosPanel";
import { DesmosSolution } from "./DesmosSolution";
import { Highlightable } from "./Highlightable";
import { DifficultyChip, Chip } from "./ui";
import { CONFIDENCE_LEVELS } from "@/lib/taxonomy";

interface ClientQuestion {
  id: string;
  section: string;
  domain: string;
  skill: string;
  difficulty: string;
  format: string;
  stimulus: string | null;
  stem: string;
  assets: string[];
  requiresCalculator: boolean;
  desmosRelevant: boolean;
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
  section?: "MATH" | "READING_WRITING";
  mode?: string;
  difficulty?: string;
  skill?: string;
  domain?: string;
  calculator?: "desmos" | "non-desmos";
  regression?: boolean;
  timed?: boolean;
  timerSecs?: number;
  showDesmos?: boolean;
}

export function QuestionRunner({ config }: { config: RunnerConfig }) {
  const [question, setQuestion] = useState<ClientQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [exhausted, setExhausted] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [confidence, setConfidence] = useState<string>("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [errorLogApproved, setErrorLogApproved] = useState(false);
  const [stats, setStats] = useState({ answered: 0, correct: 0 });
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const startRef = useRef<number>(Date.now());

  const isReviewMode = config.mode === "srs" || config.mode === "missed";
  const isMath = (question?.section ?? config.section) === "MATH";

  const buildQuery = useCallback(() => {
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

  const loadNext = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setSelected("");
    setConfidence("");
    setErrorLogApproved(false);
    try {
      const res = await fetch(`/api/questions/next?${buildQuery()}`, { cache: "no-store" });
      const data = await res.json();
      if (!data.question) {
        setExhausted(true);
        setQuestion(null);
      } else {
        setQuestion(data.question);
        startRef.current = Date.now();
        if (config.timed) setSecondsLeft(config.timerSecs ?? 75);
      }
    } finally {
      setLoading(false);
    }
  }, [buildQuery, config.timed, config.timerSecs]);

  useEffect(() => {
    loadNext();
  }, [loadNext]);

  // Per-question countdown for timed mode.
  useEffect(() => {
    if (!config.timed || result || !question || secondsLeft === null) return;
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [config.timed, secondsLeft, result, question]);

  const submitAnswer = useCallback(async () => {
    if (!question || (!selected && question.format === "MCQ")) return;
    const res = await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: question.id,
        chosenAnswer: selected,
        mode: config.mode ?? "practice",
        confidence: confidence || null,
        timeMs: Date.now() - startRef.current,
        isReview: isReviewMode,
      }),
    });
    const data: GradeResult = await res.json();
    setResult(data);
    setStats((s) => ({ answered: s.answered + 1, correct: s.correct + (data.isCorrect ? 1 : 0) }));
  }, [question, selected, config.mode, confidence, isReviewMode]);

  const canAdvance = result && (!result.requiresErrorLog || errorLogApproved);

  // Keyboard: A–D select, Enter submit / next.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!question) return;
      if (!result && question.format === "MCQ") {
        const k = e.key.toUpperCase();
        if (["A", "B", "C", "D", "E"].includes(k) && question.choices.some((c) => c.label === k)) {
          setSelected(k);
          return;
        }
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (!result) submitAnswer();
        else if (canAdvance) loadNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, result, canAdvance, submitAnswer, loadNext]);

  if (loading) {
    return (
      <div className="card flex items-center gap-3" style={{ color: "var(--ink-faint)" }}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Loading question…
      </div>
    );
  }

  if (exhausted || !question) {
    return (
      <div className="card text-center">
        <div className="text-lg font-semibold" style={{ color: "var(--ink)" }}>
          {config.mode === "srs"
            ? "Nothing due for review right now 🎉"
            : "You've worked through the available questions here."}
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-faint)" }}>
          {stats.answered > 0
            ? `This session: ${stats.correct}/${stats.answered} correct.`
            : "Try a different topic, difficulty, or mode."}
        </p>
      </div>
    );
  }

  const passage = question.stimulus;
  const hasPassage = !!passage && !isMath;

  // ---- Sub-renders -------------------------------------------------------
  const metaBar = (
    <div
      className="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-sm"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <DifficultyChip difficulty={question.difficulty} />
      <Chip>{question.domain}</Chip>
      <Chip className="hidden sm:inline-flex">{question.skill}</Chip>
      {isReviewMode ? (
        <span className="chip" style={{ background: "var(--accent-weak)", color: "var(--accent)" }}>
          Review
        </span>
      ) : null}
      <div className="ml-auto flex items-center gap-3" style={{ color: "var(--ink-faint)" }}>
        {config.timed && secondsLeft !== null ? (
          <span className={secondsLeft <= 10 ? "font-semibold" : ""} style={secondsLeft <= 10 ? { color: "var(--bad)" } : undefined}>
            ⏱ {secondsLeft}s
          </span>
        ) : null}
        <span className="tabular-nums">
          {stats.correct}/{stats.answered} this session
        </span>
        {isMath ? (
          <button
            type="button"
            className="toolbtn"
            data-active={calcOpen}
            onClick={() => setCalcOpen((o) => !o)}
          >
            📊 Calculator
          </button>
        ) : null}
      </div>
    </div>
  );

  const choicesBlock =
    question.format === "MCQ" ? (
      <div className="grid gap-2.5">
        {question.choices.map((c) => {
          const graded = result?.choices.find((rc) => rc.label === c.label);
          const isChosen = selected === c.label;
          let borderColor = "var(--border-strong)";
          let background = "var(--surface)";
          let ring = "";
          if (result) {
            if (graded?.isCorrect) {
              borderColor = "var(--good)";
              background = "var(--good-weak)";
            } else if (isChosen) {
              borderColor = "var(--bad)";
              background = "var(--bad-weak)";
            } else {
              background = "var(--surface)";
            }
          } else if (isChosen) {
            borderColor = "var(--accent)";
            background = "var(--accent-weak)";
            ring = "0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent)";
          }
          return (
            <button
              key={c.label}
              type="button"
              disabled={!!result}
              onClick={() => setSelected(c.label)}
              className="flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all disabled:cursor-default"
              style={{ borderColor, background, boxShadow: ring, opacity: result && !graded?.isCorrect && !isChosen ? 0.6 : 1 }}
            >
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold"
                style={{
                  borderColor: isChosen && !result ? "var(--accent)" : "var(--border-strong)",
                  color: isChosen && !result ? "var(--accent)" : "var(--ink-soft)",
                }}
              >
                {c.label}
              </span>
              <span className={`leading-relaxed ${isMath ? "font-math text-[1.02rem]" : ""}`} style={{ color: "var(--ink)" }}>
                <MathText autoMath={isMath}>{c.content}</MathText>
              </span>
            </button>
          );
        })}
      </div>
    ) : (
      <div>
        <label className="label">Your answer</label>
        <input
          className="input max-w-xs font-math text-base"
          value={selected}
          disabled={!!result}
          placeholder="e.g. 3 or 18/11"
          onChange={(e) => setSelected(e.target.value)}
        />
        <p className="mt-1 text-xs" style={{ color: "var(--ink-faint)" }}>
          Student-produced response — type the value (fractions and decimals accepted).
        </p>
      </div>
    );

  const stemBlock = (
    <div className={`${isMath ? "font-math text-[1.08rem]" : "text-[1.05rem]"} mathprose leading-relaxed`} style={{ color: "var(--ink)" }}>
      <MathText autoMath={isMath}>{question.stem}</MathText>
    </div>
  );

  const confidenceBlock = !result ? (
    <div>
      <div className="label">How confident are you? (optional)</div>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {CONFIDENCE_LEVELS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setConfidence(c.value)}
            className="rounded-lg border px-3 py-1.5 text-sm transition-colors"
            style={
              confidence === c.value
                ? { borderColor: "var(--accent)", background: "var(--accent-weak)", color: "var(--accent)" }
                : { borderColor: "var(--border-strong)", color: "var(--ink-soft)" }
            }
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  ) : null;

  const questionColumn = (
    <div className="space-y-4">
      {question.assets.map((src) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="question figure" className="max-h-96 rounded-lg border" style={{ borderColor: "var(--border)" }} />
      ))}
      {hasPassage ? (
        stemBlock
      ) : isMath ? (
        stemBlock
      ) : (
        <Highlightable className="annotatable" resetKey={question.id}>
          {stemBlock}
        </Highlightable>
      )}
      {choicesBlock}
      {confidenceBlock}
      {!result ? (
        <div className="flex items-center gap-3">
          <button
            className="btn-primary"
            onClick={submitAnswer}
            disabled={!selected && question.format === "MCQ"}
          >
            Submit answer
          </button>
          <span className="text-xs" style={{ color: "var(--ink-faint)" }}>
            or press <kbd className="rounded border px-1" style={{ borderColor: "var(--border-strong)" }}>Enter</kbd>
          </span>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-4">
      {metaBar}

      {hasPassage ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>
              Passage
            </div>
            <Highlightable className="annotatable" resetKey={question.id}>
              <div className="passage">
                <MathText>{passage!}</MathText>
              </div>
            </Highlightable>
          </div>
          <div className="card">
            <Highlightable className="annotatable" resetKey={`stem-${question.id}`}>
              {stemBlock}
            </Highlightable>
            <div className="mt-4">{choicesBlock}</div>
            <div className="mt-4">{confidenceBlock}</div>
            {!result ? (
              <div className="mt-5 flex items-center gap-3">
                <button className="btn-primary" onClick={submitAnswer} disabled={!selected && question.format === "MCQ"}>
                  Submit answer
                </button>
                <span className="text-xs" style={{ color: "var(--ink-faint)" }}>
                  or press <kbd className="rounded border px-1" style={{ borderColor: "var(--border-strong)" }}>Enter</kbd>
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="card">{questionColumn}</div>
      )}

      {/* Result */}
      {result ? (
        <div className="space-y-4 animate-fade-in">
          {result.isCorrect ? (
            <div className="card" style={{ borderColor: "var(--good)", background: "var(--good-weak)" }}>
              <div className="font-semibold" style={{ color: "var(--good)" }}>
                Correct! Nicely done. ✅
              </div>
              <div className="mt-3">
                {isMath ? (
                  <DesmosSolution explanation={result.explanation} stem={question.stem} />
                ) : result.explanation ? (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium" style={{ color: "var(--ink-soft)" }}>
                      View explanation
                    </summary>
                    <div className="mt-2 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
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
                onApproved={() => setErrorLogApproved(true)}
                isMath={isMath}
              />
              {isMath ? (
                <div className="card">
                  <div className="mb-2 text-sm font-semibold" style={{ color: "var(--ink)" }}>
                    Solve it graphically
                  </div>
                  <DesmosSolution explanation={result.explanation} stem={question.stem} showExplanation={false} />
                </div>
              ) : null}
            </>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--ink-faint)" }}>
              {result.requiresErrorLog && !errorLogApproved
                ? "Complete your error log to continue."
                : "Ready for the next one."}
            </span>
            <button className="btn-primary" onClick={loadNext} disabled={!canAdvance}>
              Next question →
            </button>
          </div>
        </div>
      ) : null}

      {/* Floating Desmos calculator — available on every Math question. */}
      {isMath ? <DesmosPanel open={calcOpen} onClose={() => setCalcOpen(false)} /> : null}
    </div>
  );
}
