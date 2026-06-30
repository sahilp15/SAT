"use client";

import { useState } from "react";
import { QuestionRunner, type RunnerConfig } from "./QuestionRunner";

interface Props {
  section: "MATH" | "READING_WRITING";
  taxonomy: Record<string, string[]>;
  // Initial config (e.g. deep-linked regression mode).
  initial?: Partial<RunnerConfig>;
}

const DIFFICULTIES = [
  { value: "", label: "Any difficulty" },
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

export function PracticeLauncher({ section, taxonomy, initial }: Props) {
  const isMath = section === "MATH";
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState(initial?.mode ?? "practice");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "");
  const [skill, setSkill] = useState(initial?.skill ?? "");
  const [calculator, setCalculator] = useState<string>(initial?.calculator ?? "");
  const [regression, setRegression] = useState<boolean>(initial?.regression ?? false);
  const [timed, setTimed] = useState<boolean>(initial?.timed ?? false);

  const modes = [
    { value: "practice", label: "Untimed practice" },
    { value: "missed", label: "Missed questions only" },
    { value: "srs", label: "Spaced repetition (due)" },
    { value: "mixed", label: "Mixed / adaptive" },
  ];

  function start() {
    setStarted(true);
  }

  if (started) {
    const config: RunnerConfig = {
      section,
      mode,
      difficulty: difficulty || undefined,
      skill: skill || undefined,
      calculator: (calculator as RunnerConfig["calculator"]) || undefined,
      regression: regression || undefined,
      timed,
      timerSecs: section === "MATH" ? 95 : 75,
    };
    return (
      <div className="space-y-4">
        <button className="btn-ghost -ml-2" onClick={() => setStarted(false)}>
          ← Change settings
        </button>
        <QuestionRunner config={config} />
      </div>
    );
  }

  return (
    <div className="card space-y-5">
      <div>
        <div className="label mb-2">Mode</div>
        <div className="flex flex-wrap gap-2">
          {modes.map((m) => (
            <OptionButton
              key={m.value}
              active={mode === m.value}
              onClick={() => setMode(m.value)}
              label={m.label}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="timed"
          type="checkbox"
          checked={timed}
          onChange={(e) => setTimed(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="timed" className="text-sm text-slate-700">
          Timed ({section === "MATH" ? "95" : "75"}s per question)
        </label>
      </div>

      {isMath ? (
        <div>
          <div className="label mb-2">Calculator focus</div>
          <div className="flex flex-wrap gap-2">
            <OptionButton active={calculator === ""} onClick={() => setCalculator("")} label="Any" />
            <OptionButton
              active={calculator === "desmos"}
              onClick={() => setCalculator("desmos")}
              label="Desmos-friendly"
            />
            <OptionButton
              active={calculator === "non-desmos"}
              onClick={() => setCalculator("non-desmos")}
              label="Non-Desmos"
            />
            <OptionButton
              active={regression}
              onClick={() => setRegression((r) => !r)}
              label="Regression only"
            />
          </div>
        </div>
      ) : null}

      <div>
        <div className="label mb-2">Difficulty</div>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <OptionButton
              key={d.value}
              active={difficulty === d.value}
              onClick={() => setDifficulty(d.value)}
              label={d.label}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="label mb-1">Topic</div>
        <select className="input" value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="">Any topic</option>
          {Object.entries(taxonomy).map(([domain, skills]) => (
            <optgroup key={domain} label={domain}>
              {skills.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <button className="btn-primary w-full" onClick={start}>
        Start practicing
      </button>
    </div>
  );
}

function OptionButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-brand-500 bg-brand-50 text-brand-700"
          : "border-slate-300 text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}
