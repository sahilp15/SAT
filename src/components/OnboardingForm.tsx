"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SatDate } from "@/lib/satDates";
import { PLAN_INTENSITIES } from "@/lib/taxonomy";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function OnboardingForm({ dates }: { dates: SatDate[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [f, setF] = useState({
    grade: "11",
    satDateId: dates[0]?.id ?? "",
    targetScore: "1550",
    hasTakenOfficial: false,
    lastOfficialTotal: "",
    hasTakenBluebook: false,
    lastTotalScore: "",
    lastMathScore: "",
    lastRwScore: "",
    weeklyHours: "8",
    availableDays: ["Mon", "Wed", "Sat"] as string[],
    strongerSection: "BALANCED",
    planIntensity: "BALANCED",
    diagnosticChoice: "TAKE_TEST_1",
  });

  const set = (k: keyof typeof f, v: unknown) => setF((s) => ({ ...s, [k]: v }));
  const toggleDay = (d: string) =>
    setF((s) => ({
      ...s,
      availableDays: s.availableDays.includes(d)
        ? s.availableDays.filter((x) => x !== d)
        : [...s.availableDays, d],
    }));

  const num = (v: string) => (v.trim() === "" ? null : parseInt(v, 10));
  const hasDiagnostic = f.hasTakenOfficial || f.hasTakenBluebook;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: num(f.grade),
          satDateId: f.satDateId || null,
          targetScore: num(f.targetScore),
          hasTakenOfficial: f.hasTakenOfficial,
          lastOfficialTotal: num(f.lastOfficialTotal),
          hasTakenBluebook: f.hasTakenBluebook,
          lastTotalScore: num(f.lastTotalScore),
          lastMathScore: num(f.lastMathScore),
          lastRwScore: num(f.lastRwScore),
          weeklyHours: num(f.weeklyHours),
          availableDays: f.availableDays,
          strongerSection: f.strongerSection,
          planIntensity: f.planIntensity,
          diagnosticChoice: hasDiagnostic ? "SKIP_AND_PRACTICE" : f.diagnosticChoice,
        }),
      });
      if (res.ok) router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">What grade are you in?</label>
          <select className="input" value={f.grade} onChange={(e) => set("grade", e.target.value)}>
            {[9, 10, 11, 12].map((g) => (
              <option key={g} value={g}>
                {g}th grade
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">When are you planning to take the SAT?</label>
          <select
            className="input"
            value={f.satDateId}
            onChange={(e) => set("satDateId", e.target.value)}
          >
            {dates.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label} ({d.date})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Target total score</label>
          <input
            type="number"
            className="input"
            min={400}
            max={1600}
            value={f.targetScore}
            onChange={(e) => set("targetScore", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Realistic study hours per week</label>
          <input
            type="number"
            className="input"
            min={0}
            max={80}
            value={f.weeklyHours}
            onChange={(e) => set("weeklyHours", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label">Which days are you usually free?</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                f.availableDays.includes(d)
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-slate-300 text-slate-600"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Where do you feel stronger?</label>
          <select
            className="input"
            value={f.strongerSection}
            onChange={(e) => set("strongerSection", e.target.value)}
          >
            <option value="BALANCED">About the same</option>
            <option value="MATH">Math</option>
            <option value="READING_WRITING">Reading & Writing</option>
          </select>
        </div>
        <div>
          <label className="label">How intense should your plan be?</label>
          <select
            className="input"
            value={f.planIntensity}
            onChange={(e) => set("planIntensity", e.target.value)}
          >
            {PLAN_INTENSITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-700">Score history (optional)</legend>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f.hasTakenOfficial}
              onChange={(e) => set("hasTakenOfficial", e.target.checked)}
            />
            I&apos;ve taken an official SAT
          </label>
          {f.hasTakenOfficial ? (
            <input
              type="number"
              className="input max-w-xs"
              placeholder="Last official total (e.g. 1400)"
              value={f.lastOfficialTotal}
              onChange={(e) => set("lastOfficialTotal", e.target.value)}
            />
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f.hasTakenBluebook}
              onChange={(e) => set("hasTakenBluebook", e.target.checked)}
            />
            I&apos;ve taken a Bluebook practice test
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="number"
              className="input"
              placeholder="Latest total"
              value={f.lastTotalScore}
              onChange={(e) => set("lastTotalScore", e.target.value)}
            />
            <input
              type="number"
              className="input"
              placeholder="Math subscore"
              value={f.lastMathScore}
              onChange={(e) => set("lastMathScore", e.target.value)}
            />
            <input
              type="number"
              className="input"
              placeholder="R&W subscore"
              value={f.lastRwScore}
              onChange={(e) => set("lastRwScore", e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      {!hasDiagnostic ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
          <div className="font-semibold text-slate-800">Get a real baseline first</div>
          <p className="mt-1 text-sm text-slate-600">
            Since you haven&apos;t logged a diagnostic, we recommend taking{" "}
            <b>Official SAT Practice Test 1 in Bluebook</b>. It gives a realistic starting point and
            sharply personalizes your plan. You can also skip and start practicing now.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => set("diagnosticChoice", "TAKE_TEST_1")}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                f.diagnosticChoice === "TAKE_TEST_1"
                  ? "border-brand-500 bg-white text-brand-700"
                  : "border-slate-300 text-slate-600"
              }`}
            >
              I&apos;ll take Practice Test 1
            </button>
            <button
              type="button"
              onClick={() => set("diagnosticChoice", "SKIP_AND_PRACTICE")}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                f.diagnosticChoice === "SKIP_AND_PRACTICE"
                  ? "border-brand-500 bg-white text-brand-700"
                  : "border-slate-300 text-slate-600"
              }`}
            >
              Skip — start practicing
            </button>
          </div>
        </div>
      ) : null}

      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? "Building your plan…" : "Create my study plan"}
      </button>
    </form>
  );
}
