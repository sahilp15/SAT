"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MathText } from "./MathText";
import { DIFFICULTIES } from "@/lib/taxonomy";

interface Choice {
  label: string;
  content: string;
  isCorrect: boolean;
  rationaleWrong: string | null;
}
export interface ReviewQuestion {
  id: string;
  externalId: string | null;
  section: string;
  domain: string;
  skill: string;
  difficulty: string;
  format: string;
  stimulus: string | null;
  stem: string;
  correctAnswer: string;
  explanation: string | null;
  isBluebook: boolean;
  importNotes: string | null;
  importConfidence: number;
  choices: Choice[];
}

export function ImportReview({ questions }: { questions: ReviewQuestion[] }) {
  const router = useRouter();
  const [list, setList] = useState(questions);
  const [selectedId, setSelectedId] = useState(questions[0]?.id ?? null);
  const selected = list.find((q) => q.id === selectedId) ?? null;

  function updateSelected(patch: Partial<ReviewQuestion>) {
    setList((l) => l.map((q) => (q.id === selectedId ? { ...q, ...patch } : q)));
  }
  function updateChoice(idx: number, patch: Partial<Choice>) {
    if (!selected) return;
    const choices = selected.choices.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    updateSelected({ choices });
  }

  async function save(markOk: boolean) {
    if (!selected) return;
    const body = {
      stem: selected.stem,
      stimulus: selected.stimulus,
      correctAnswer: selected.correctAnswer,
      explanation: selected.explanation,
      difficulty: selected.difficulty,
      domain: selected.domain,
      skill: selected.skill,
      isBluebook: selected.isBluebook,
      reviewStatus: markOk ? "OK" : "NEEDS_REVIEW",
      choices: selected.choices,
    };
    await fetch(`/api/admin/questions/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (markOk) {
      const remaining = list.filter((q) => q.id !== selected.id);
      setList(remaining);
      setSelectedId(remaining[0]?.id ?? null);
    }
    router.refresh();
  }

  if (list.length === 0) {
    return (
      <div className="card text-center">
        <div className="text-lg font-semibold text-slate-800">No questions need review 🎉</div>
        <p className="mt-2 text-sm text-slate-500">
          Everything imported cleanly (or you&apos;ve reviewed it all). Run{" "}
          <code>npm run import</code> after adding more files to data/uploads.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
      {/* List */}
      <div className="card max-h-[70vh] overflow-y-auto p-2">
        {list.map((q) => (
          <button
            key={q.id}
            onClick={() => setSelectedId(q.id)}
            className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm ${
              q.id === selectedId ? "bg-brand-50 text-brand-800" : "hover:bg-slate-100"
            }`}
          >
            <div className="font-medium">
              {q.section === "MATH" ? "Math" : "R&W"} · {q.skill}
            </div>
            <div className="truncate text-xs text-slate-500">{q.stem.slice(0, 50)}</div>
          </button>
        ))}
      </div>

      {/* Editor */}
      {selected ? (
        <div className="space-y-4">
          <div className="card bg-amber-50/40">
            <div className="text-xs font-medium text-amber-800">
              Why flagged: {selected.importNotes ?? "low confidence"} · confidence{" "}
              {Math.round(selected.importConfidence * 100)}%
            </div>
          </div>

          <div className="card space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Difficulty</label>
                <select
                  className="input"
                  value={selected.difficulty}
                  onChange={(e) => updateSelected({ difficulty: e.target.value })}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Domain</label>
                <input
                  className="input"
                  value={selected.domain}
                  onChange={(e) => updateSelected({ domain: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Skill</label>
                <input
                  className="input"
                  value={selected.skill}
                  onChange={(e) => updateSelected({ skill: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Stimulus / passage (use $...$ for math)</label>
              <textarea
                className="input"
                rows={3}
                value={selected.stimulus ?? ""}
                onChange={(e) => updateSelected({ stimulus: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Question stem</label>
              <textarea
                className="input"
                rows={2}
                value={selected.stem}
                onChange={(e) => updateSelected({ stem: e.target.value })}
              />
            </div>

            {/* Live preview */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Live preview
              </div>
              {selected.stimulus ? (
                <div className="mt-2 text-sm leading-relaxed text-slate-700">
                  <MathText>{selected.stimulus}</MathText>
                </div>
              ) : null}
              <div className="mt-2 text-slate-900">
                <MathText>{selected.stem}</MathText>
              </div>
            </div>
          </div>

          {/* Choices */}
          {selected.format === "MCQ" ? (
            <div className="card space-y-3">
              <div className="font-medium text-slate-800">Answer choices</div>
              {selected.choices.map((c, idx) => (
                <div key={c.label} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border text-sm font-semibold">
                      {c.label}
                    </span>
                    <input
                      className="input mt-0 flex-1"
                      value={c.content}
                      placeholder="Choice content ($...$ for math)"
                      onChange={(e) => updateChoice(idx, { content: e.target.value })}
                    />
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="radio"
                        name="correct"
                        checked={c.isCorrect}
                        onChange={() => {
                          updateSelected({
                            correctAnswer: c.label,
                            choices: selected.choices.map((cc) => ({
                              ...cc,
                              isCorrect: cc.label === c.label,
                            })),
                          });
                        }}
                      />
                      correct
                    </label>
                  </div>
                  <div className="mt-1 text-sm">
                    <MathText>{c.content || "—"}</MathText>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <label className="label">Correct answer (SPR — comma-separate accepted forms)</label>
              <input
                className="input max-w-sm"
                value={selected.correctAnswer}
                onChange={(e) => updateSelected({ correctAnswer: e.target.value })}
              />
            </div>
          )}

          <div className="card space-y-3">
            <div>
              <label className="label">Explanation</label>
              <textarea
                className="input"
                rows={4}
                value={selected.explanation ?? ""}
                onChange={(e) => updateSelected({ explanation: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={selected.isBluebook}
                onChange={(e) => updateSelected({ isBluebook: e.target.checked })}
              />
              This is from an official Bluebook practice test (exclude from normal practice)
            </label>
          </div>

          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => save(false)}>
              Save (keep flagged)
            </button>
            <button className="btn-primary" onClick={() => save(true)}>
              Save &amp; mark reviewed
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
