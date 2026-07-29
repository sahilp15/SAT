"use client";

import { useState } from "react";
import { MathText } from "@/components/MathText";
import { IconAlert, IconSpinner } from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";
import { MISTAKE_TYPES, CONFIDENCE_AFTER } from "@/lib/taxonomy";

// Blocking error-log form, shown after a wrong answer. The parent won't let the
// student advance until onApproved fires. There is deliberately no skip button:
// writing down why you missed it is the mechanism, not a formality.

interface Props {
  attemptId: string;
  chosenAnswer: string;
  correctAnswer: string;
  explanation: string | null;
  onApproved: () => void;
  isMath?: boolean;
}

const EMPTY = {
  whyChose: "",
  whyWrong: "",
  whyCorrectRight: "",
  mistakeType: "",
  whatDifferent: "",
  confidenceAfter: "MEDIUM",
};

const FIELDS: {
  name: keyof typeof EMPTY;
  label: string;
  placeholder: string;
}[] = [
  {
    name: "whyChose",
    label: "Why did you choose your answer?",
    placeholder: "Be honest about your reasoning in the moment, not what you know now.",
  },
  {
    name: "whyWrong",
    label: "Why was your answer wrong?",
    placeholder: "Name the actual flaw — which step went wrong, and why.",
  },
  {
    name: "whyCorrectRight",
    label: "Why is the correct answer right?",
    placeholder: "In your own words. Copying the explanation doesn't build recall.",
  },
  {
    name: "whatDifferent",
    label: "What will you do differently next time?",
    placeholder: "A concrete, repeatable move — not 'be more careful'.",
  },
];

export function ErrorLogForm({
  attemptId,
  chosenAnswer,
  correctAnswer,
  explanation,
  onApproved,
  isMath = false,
}: Props) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [needsRevision, setNeedsRevision] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const set = (key: keyof typeof EMPTY, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

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
      const data = (await res.json()) as {
        status?: string;
        feedback?: string;
        fields?: Record<string, string[]>;
      };
      if (res.status === 400) {
        setFieldErrors(data.fields ?? {});
        setFeedback("Please complete every field thoughtfully before continuing.");
        return;
      }
      if (data.status === "APPROVED") {
        onApproved();
        return;
      }
      setNeedsRevision(true);
      setFeedback(data.feedback ?? "Your reflection needs more detail. Revise and resubmit.");
    } catch {
      setFeedback("Something went wrong saving your error log. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card border-warn bg-[color-mix(in_srgb,var(--warn)_7%,var(--surface))] p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-weak px-2.5 py-1 text-[0.6875rem] font-semibold text-warn">
          <IconAlert size={12} />
          Error log required
        </span>
        <span className="text-[0.8125rem] text-ink-2">
          You chose <strong className="font-mono">{chosenAnswer}</strong>; the correct answer is{" "}
          <strong className="font-mono">{correctAnswer}</strong>.
        </span>
      </div>

      {explanation ? (
        <details className="mb-4 rounded-md border border-line bg-surface p-3">
          <summary className="cursor-pointer text-[0.8125rem] font-semibold text-ink-2">
            Official explanation
          </summary>
          <div className="mathprose mt-2 text-[0.8125rem] leading-relaxed text-ink-2">
            <MathText autoMath={isMath}>{explanation}</MathText>
          </div>
        </details>
      ) : null}

      <form onSubmit={submit} className="space-y-4">
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label htmlFor={`${attemptId}-${field.name}`} className="label">
              {field.label}
            </label>
            <textarea
              id={`${attemptId}-${field.name}`}
              className="input"
              rows={2}
              placeholder={field.placeholder}
              value={form[field.name]}
              aria-invalid={fieldErrors[field.name] ? true : undefined}
              aria-describedby={fieldErrors[field.name] ? `${attemptId}-${field.name}-err` : undefined}
              onChange={(e) => set(field.name, e.target.value)}
            />
            {fieldErrors[field.name]?.length ? (
              <p id={`${attemptId}-${field.name}-err`} className="mt-1 text-[0.75rem] text-bad">
                {fieldErrors[field.name][0]}
              </p>
            ) : null}
          </div>
        ))}

        <div>
          <label htmlFor={`${attemptId}-type`} className="label">
            What kind of mistake was this?
          </label>
          <select
            id={`${attemptId}-type`}
            className="input"
            value={form.mistakeType}
            aria-invalid={fieldErrors.mistakeType ? true : undefined}
            onChange={(e) => set("mistakeType", e.target.value)}
          >
            <option value="">Select…</option>
            {MISTAKE_TYPES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label} — {m.hint}
              </option>
            ))}
          </select>
          {fieldErrors.mistakeType?.length ? (
            <p className="mt-1 text-[0.75rem] text-bad">{fieldErrors.mistakeType[0]}</p>
          ) : null}
        </div>

        <fieldset>
          <legend className="label">How well do you understand it now?</legend>
          <div className="flex flex-wrap gap-2">
            {CONFIDENCE_AFTER.map((c) => (
              <button
                key={c.value}
                type="button"
                className="option"
                aria-pressed={form.confidenceAfter === c.value}
                onClick={() => set("confidenceAfter", c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </fieldset>

        {feedback ? (
          <div
            role="status"
            className={cx(
              "rounded-md border p-3.5 text-[0.8125rem]",
              needsRevision ? "border-warn bg-warn-weak" : "border-bad bg-bad-weak"
            )}
          >
            <p className="font-semibold text-ink">
              {needsRevision ? "Let's sharpen this reflection" : "Heads up"}
            </p>
            <p className="mt-1 leading-relaxed text-ink-2">{feedback}</p>
          </div>
        ) : null}

        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting ? <IconSpinner /> : null}
          {submitting ? "Saving…" : needsRevision ? "Resubmit revised log" : "Submit error log"}
        </button>
      </form>
    </section>
  );
}
