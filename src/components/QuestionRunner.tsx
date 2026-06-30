"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MathText } from "./MathText";
import { ErrorLogForm } from "./ErrorLogForm";
import { DesmosPanel } from "./DesmosPanel";
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
  const startRef = useRef<number>(Date.now());

  const isReviewMode = config.mode === "srs" || config.mode === "missed";

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

  async function submitAnswer() {
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
  }

  const canAdvance = result && (!result.requiresErrorLog || errorLogApproved);

  if (loading) return <div className="card text-slate-500">Loading question…</div>;

  if (exhausted || !question) {
    return (
      <div className="card text-center">
        <div className="text-lg font-semibold text-slate-800">
          {config.mode === "srs"
            ? "Nothing due for review right now 🎉"
            : "You've worked through the available questions here."}
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {stats.answered > 0
            ? `This session: ${stats.correct}/${stats.answered} correct.`
            : "Try a different topic, difficulty, or import more questions."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Meta bar */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <DifficultyChip difficulty={question.difficulty} />
        <Chip>{question.domain}</Chip>
        <Chip>{question.skill}</Chip>
        {isReviewMode ? <Chip className="!bg-brand-100 !text-brand-700">Review</Chip> : null}
        <div className="ml-auto flex items-center gap-3 text-slate-500">
          {config.timed && secondsLeft !== null ? (
            <span className={secondsLeft <= 10 ? "font-semibold text-rose-600" : ""}>
              ⏱ {secondsLeft}s
            </span>
          ) : null}
          <span>
            {stats.correct}/{stats.answered} this session
          </span>
        </div>
      </div>

      {/* Stimulus / passage */}
      {question.stimulus ? (
        <div className="card leading-relaxed text-slate-800">
          <MathText>{question.stimulus}</MathText>
        </div>
      ) : null}

      {/* Figures */}
      {question.assets.map((src) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="question figure" className="max-h-96 rounded-lg border" />
      ))}

      {/* Stem */}
      <div className="card">
        <div className="text-lg leading-relaxed text-slate-900">
          <MathText>{question.stem}</MathText>
        </div>

        {/* Choices or SPR input */}
        {question.format === "MCQ" ? (
          <div className="mt-4 space-y-2">
            {question.choices.map((c) => {
              const graded = result?.choices.find((rc) => rc.label === c.label);
              const isChosen = selected === c.label;
              let style = "border-slate-300 hover:border-brand-400 hover:bg-brand-50/40";
              if (result) {
                if (graded?.isCorrect) style = "border-emerald-500 bg-emerald-50";
                else if (isChosen) style = "border-rose-500 bg-rose-50";
                else style = "border-slate-200 opacity-70";
              } else if (isChosen) {
                style = "border-brand-500 bg-brand-50";
              }
              return (
                <button
                  key={c.label}
                  type="button"
                  disabled={!!result}
                  onClick={() => setSelected(c.label)}
                  className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${style}`}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-400 text-sm font-semibold">
                    {c.label}
                  </span>
                  <span className="leading-relaxed">
                    <MathText>{c.content}</MathText>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4">
            <label className="label">Your answer</label>
            <input
              className="input max-w-xs"
              value={selected}
              disabled={!!result}
              placeholder="e.g. 3 or 18/11"
              onChange={(e) => setSelected(e.target.value)}
            />
          </div>
        )}

        {/* Confidence (pre-answer) */}
        {!result ? (
          <div className="mt-4">
            <div className="label">How confident are you? (optional)</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {CONFIDENCE_LEVELS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setConfidence(c.value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    confidence === c.value
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-300 text-slate-600"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {(config.showDesmos ?? question.desmosRelevant) ? <DesmosPanel /> : null}

        {!result ? (
          <button
            className="btn-primary mt-5"
            onClick={submitAnswer}
            disabled={!selected && question.format === "MCQ"}
          >
            Submit answer
          </button>
        ) : null}
      </div>

      {/* Result */}
      {result ? (
        <div className="space-y-4">
          {result.isCorrect ? (
            <div className="card border-emerald-300 bg-emerald-50/50">
              <div className="font-semibold text-emerald-700">Correct! Nicely done. ✅</div>
              {result.explanation ? (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer font-medium text-slate-700">
                    View explanation
                  </summary>
                  <div className="mt-2 leading-relaxed text-slate-700">
                    <MathText>{result.explanation}</MathText>
                  </div>
                </details>
              ) : null}
            </div>
          ) : (
            <ErrorLogForm
              attemptId={result.attemptId}
              chosenAnswer={selected || "(blank)"}
              correctAnswer={result.correctAnswer}
              explanation={result.explanation}
              onApproved={() => setErrorLogApproved(true)}
            />
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
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
    </div>
  );
}
