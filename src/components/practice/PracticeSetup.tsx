"use client";

import { useState } from "react";
import { PracticeRunner, type RunnerConfig } from "./PracticeRunner";
import { IconChevronLeft, IconPlay } from "@/components/ui/icons";

// Filter builder for open-ended practice. Once started it hands off to the
// runner in streaming mode and offers a way back to change filters.

const MODES = [
  { value: "practice", label: "Untimed practice", hint: "Work at your own pace." },
  { value: "timed", label: "Timed", hint: "A per-question clock, like the real section." },
  { value: "missed", label: "Missed questions", hint: "Only things you've gotten wrong." },
  { value: "srs", label: "Due for review", hint: "Your spaced-repetition queue." },
];

const DIFFICULTIES = [
  { value: "", label: "Any" },
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

export function PracticeSetup({
  section,
  taxonomy,
  initial,
}: {
  section: "MATH" | "READING_WRITING";
  taxonomy: Record<string, string[]>;
  initial?: Partial<RunnerConfig>;
}) {
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState(initial?.mode ?? "practice");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "");
  const [skill, setSkill] = useState(initial?.skill ?? "");
  const [calculator, setCalculator] = useState<string>(initial?.calculator ?? "");
  const [regression, setRegression] = useState(initial?.regression ?? false);

  const isMath = section === "MATH";
  const timed = mode === "timed";

  if (started) {
    const config: RunnerConfig = {
      section,
      mode: timed ? "timed" : mode,
      difficulty: difficulty || undefined,
      skill: skill || undefined,
      calculator: (calculator as RunnerConfig["calculator"]) || undefined,
      regression: regression || undefined,
      timed,
      timerSecs: isMath ? 95 : 71,
    };
    return (
      <div className="space-y-4">
        <button type="button" className="btn btn-ghost -ml-2" onClick={() => setStarted(false)}>
          <IconChevronLeft size={15} />
          Change filters
        </button>
        <PracticeRunner config={config} onExit={() => setStarted(false)} />
      </div>
    );
  }

  return (
    <div className="card space-y-6 p-5">
      <fieldset>
        <legend className="label">Mode</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              className="option flex-col items-start gap-0.5 py-2.5 text-left"
              aria-pressed={mode === m.value}
              onClick={() => setMode(m.value)}
            >
              <span className="font-semibold">{m.label}</span>
              <span className="text-[0.75rem] font-normal text-ink-3">{m.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Difficulty</legend>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              className="option"
              aria-pressed={difficulty === d.value}
              onClick={() => setDifficulty(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </fieldset>

      {isMath ? (
        <fieldset>
          <legend className="label">Calculator focus</legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="option"
              aria-pressed={calculator === "" && !regression}
              onClick={() => {
                setCalculator("");
                setRegression(false);
              }}
            >
              Any
            </button>
            <button
              type="button"
              className="option"
              aria-pressed={calculator === "desmos"}
              onClick={() => setCalculator("desmos")}
            >
              Desmos-friendly
            </button>
            <button
              type="button"
              className="option"
              aria-pressed={calculator === "non-desmos"}
              onClick={() => setCalculator("non-desmos")}
            >
              By hand
            </button>
            <button
              type="button"
              className="option"
              aria-pressed={regression}
              onClick={() => setRegression((r) => !r)}
            >
              Regression only
            </button>
          </div>
        </fieldset>
      ) : null}

      <div>
        <label htmlFor="skill" className="label">
          Topic
        </label>
        <select
          id="skill"
          className="input"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        >
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

      <button type="button" className="btn btn-primary btn-lg w-full" onClick={() => setStarted(true)}>
        <IconPlay size={14} />
        Start practicing
      </button>
    </div>
  );
}
