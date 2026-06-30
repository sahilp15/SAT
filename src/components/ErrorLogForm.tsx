"use client";

import { useState } from "react";
import { MISTAKE_TYPES, CONFIDENCE_AFTER } from "@/lib/taxonomy";
import { MathText } from "./MathText";

// Blocking error-log form. Rendered after a wrong answer; the parent does not
// let the student advance until onApproved fires. There is intentionally no
// "skip" — learning from the miss is the whole point.

interface Props {
  attemptId: string;
  chosenAnswer: string;
  correctAnswer: string;
  explanation: string | null;
  onApproved: () => void;
}

const empty = {
  whyChose: "",
  whyWrong: "",
  whyCorrectRight: "",
  mistakeType: "",
  whatDifferent: "",
  confidenceAfter: "MEDIUM",
};

export function ErrorLogForm({
  attemptId,
  chosenAnswer,
  correctAnswer,
  explanation,
  onApproved,
}: Props) {
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [needsRevision, setNeedsRevision] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    setFieldErrors({});
    try {
      const res = await fetch("/api/error-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, ...form }),
      });
      const data = await res.json();
      if (res.status === 400 && data.fields) {
        setFieldErrors(data.fields);
        setFeedback("Please complete every field thoughtfully before continuing.");
        return;
      }
      if (data.status === "APPROVED") {
        onApproved();
        return;
      }
      // NEEDS_REVISION
      setNeedsRevision(true);
      setFeedback(data.feedback ?? "Your reflection needs more detail. Please revise and resubmit.");
    } catch {
      setFeedback("Something went wrong saving your error log. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Defined as a plain render helper (NOT a nested component) so the textareas
  // keep focus across keystrokes.
  const field = (
    name: keyof typeof form,
    label: string,
    placeholder: string,
    rows = 2
  ) => (
    <div>
      <label className="label">{label}</label>
      <textarea
        className="input"
        rows={rows}
        placeholder={placeholder}
        value={form[name]}
        onChange={(e) => set(name, e.target.value)}
      />
      {fieldErrors[name]?.length ? (
        <p className="mt-1 text-xs text-rose-600">{fieldErrors[name][0]}</p>
      ) : null}
    </div>
  );

  return (
    <div className="card border-amber-300 bg-amber-50/40">
      <div className="mb-3 flex items-center gap-2">
        <span className="chip bg-amber-200 text-amber-800">Required error log</span>
        <span className="text-sm text-slate-600">
          You chose <b>{chosenAnswer}</b>; correct answer is <b>{correctAnswer}</b>.
        </span>
      </div>

      {explanation ? (
        <details className="mb-4 rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <summary className="cursor-pointer font-medium text-slate-700">
            Official explanation
          </summary>
          <div className="mt-2 leading-relaxed text-slate-700">
            <MathText>{explanation}</MathText>
          </div>
        </details>
      ) : null}

      <form onSubmit={submit} className="space-y-3">
        {field(
          "whyChose",
          "Why did you choose your answer?",
          "Be honest and specific about your reasoning in the moment."
        )}
        {field(
          "whyWrong",
          "Why was your answer wrong?",
          "What was the actual flaw in your reasoning?"
        )}
        {field(
          "whyCorrectRight",
          "Why is the correct answer right?",
          "Explain it in your own words — don't just copy the explanation."
        )}
        <div>
          <label className="label">What type of mistake was this?</label>
          <select
            className="input"
            value={form.mistakeType}
            onChange={(e) => set("mistakeType", e.target.value)}
          >
            <option value="">Select…</option>
            {MISTAKE_TYPES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {fieldErrors.mistakeType?.length ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.mistakeType[0]}</p>
          ) : null}
        </div>
        {field(
          "whatDifferent",
          "What will you do differently next time?",
          "A concrete, repeatable strategy — not just 'be more careful'."
        )}
        <div>
          <label className="label">How well do you understand it now?</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {CONFIDENCE_AFTER.map((c) => (
              <button
                type="button"
                key={c.value}
                onClick={() => set("confidenceAfter", c.value)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  form.confidenceAfter === c.value
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-300 bg-white text-slate-600"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {feedback ? (
          <div
            className={`rounded-lg border p-3 text-sm ${
              needsRevision
                ? "border-amber-300 bg-amber-100 text-amber-900"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            <div className="font-semibold">
              {needsRevision ? "Let's sharpen this reflection" : "Heads up"}
            </div>
            <p className="mt-1 leading-relaxed">{feedback}</p>
          </div>
        ) : null}

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? "Reviewing…" : needsRevision ? "Resubmit revised log" : "Submit error log"}
        </button>
      </form>
    </div>
  );
}
