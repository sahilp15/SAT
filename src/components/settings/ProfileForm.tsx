"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconSpinner } from "@/components/ui/icons";
import { Card, CardHeader, cx } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { MATH_TAXONOMY, RW_TAXONOMY } from "@/lib/taxonomy";
import type { SatDate } from "@/lib/satDates";

// Post-onboarding editing of everything the plan is built from. Saving always
// regenerates the schedule, because every field here changes it.

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const TIME_SLOTS = [
  { value: "MORNING", label: "Morning" },
  { value: "AFTERNOON", label: "Afternoon" },
  { value: "EVENING", label: "Evening" },
  { value: "NIGHT", label: "Late night" },
];
const SECTIONS = [
  { value: "MATH", label: "Math" },
  { value: "READING_WRITING", label: "Reading & Writing" },
  { value: "BALANCED", label: "About the same" },
];

export interface ProfileInitial {
  testDate: string;
  satDateId: string | null;
  targetScore: number;
  strongerSection: string;
  weakerSection: string;
  strugglingTopics: string[];
  daysPerWeek: number;
  minutesPerDay: number;
  availableDays: string[];
  preferredStudyTimes: string[];
  studyStyle: string;
  lastTotalScore: string;
  lastMathScore: string;
  lastRwScore: string;
  priorTestType: string;
}

export function ProfileForm({
  dates,
  initial,
}: {
  dates: SatDate[];
  initial: ProfileInitial;
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState<"MATH" | "READING_WRITING">("MATH");

  function set<K extends keyof ProfileInitial>(key: K, value: ProfileInitial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleIn(key: "availableDays" | "preferredStudyTimes" | "strugglingTopics", v: string) {
    const list = form[key];
    set(key, list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  async function save() {
    setSaving(true);
    try {
      const num = (v: string) => (v.trim() === "" ? null : Number.parseInt(v, 10));
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testDate: form.testDate,
          satDateId: form.satDateId,
          targetScore: form.targetScore,
          strongerSection: form.strongerSection,
          weakerSection: form.weakerSection,
          strugglingTopics: form.strugglingTopics,
          daysPerWeek: Math.max(1, form.availableDays.length || form.daysPerWeek),
          minutesPerDay: form.minutesPerDay,
          availableDays: form.availableDays,
          preferredStudyTimes: form.preferredStudyTimes,
          studyStyle: form.studyStyle,
          priorTestType: form.priorTestType,
          lastTotalScore: num(form.lastTotalScore),
          lastMathScore: num(form.lastMathScore),
          lastRwScore: num(form.lastRwScore),
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Save failed");
      toast.success("Profile saved", "Your study plan has been rebuilt around the changes.");
      router.refresh();
    } catch (e) {
      toast.error("Couldn't save", e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  const taxonomy = section === "MATH" ? MATH_TAXONOMY : RW_TAXONOMY;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Test date and target"
          description="Changing either rebuilds the entire schedule."
        />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sat-date" className="label">
              Scheduled SAT
            </label>
            <select
              id="sat-date"
              className="input"
              value={dates.some((d) => d.date === form.testDate) ? form.testDate : "custom"}
              onChange={(e) => {
                if (e.target.value === "custom") return;
                const match = dates.find((d) => d.date === e.target.value);
                set("testDate", e.target.value);
                set("satDateId", match?.id ?? null);
              }}
            >
              {dates.map((d) => (
                <option key={d.id} value={d.date}>
                  {d.label}
                </option>
              ))}
              <option value="custom">Custom date…</option>
            </select>
          </div>
          <div>
            <label htmlFor="custom-date" className="label">
              Exact date
            </label>
            <input
              id="custom-date"
              type="date"
              className="input"
              value={form.testDate}
              min="2026-01-01"
              max="2030-12-31"
              onChange={(e) => {
                set("testDate", e.target.value);
                set("satDateId", null);
              }}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="target" className="label">
              Target total score: <span className="font-mono">{form.targetScore}</span>
            </label>
            <input
              id="target"
              type="range"
              min={800}
              max={1600}
              step={10}
              value={form.targetScore}
              onChange={(e) => set("targetScore", Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Availability" description="Sessions are sized to this, so keep it honest." />
        <fieldset className="mt-4">
          <legend className="label">Study days</legend>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                className="option min-w-[3.25rem] justify-center"
                aria-pressed={form.availableDays.includes(d)}
                onClick={() => toggleIn("availableDays", d)}
              >
                {d}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 max-w-sm">
          <label htmlFor="minutes" className="label">
            Minutes per study day: <span className="font-mono">{form.minutesPerDay}</span>
          </label>
          <input
            id="minutes"
            type="range"
            min={15}
            max={180}
            step={15}
            value={form.minutesPerDay}
            onChange={(e) => set("minutesPerDay", Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
          <p className="hint mt-1.5">
            {Math.round((form.availableDays.length * form.minutesPerDay) / 6) / 10} hours per week.
          </p>
        </div>

        <fieldset className="mt-5">
          <legend className="label">Preferred study times</legend>
          <div className="flex flex-wrap gap-2">
            {TIME_SLOTS.map((t) => (
              <button
                key={t.value}
                type="button"
                className="option"
                aria-pressed={form.preferredStudyTimes.includes(t.value)}
                onClick={() => toggleIn("preferredStudyTimes", t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="label">Plan style</legend>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "STRUCTURED", label: "Structured" },
              { value: "FLEXIBLE", label: "Flexible" },
              { value: "BOTH", label: "Both" },
            ].map((s) => (
              <button
                key={s.value}
                type="button"
                className="option"
                aria-pressed={form.studyStyle === s.value}
                onClick={() => set("studyStyle", s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card>
        <CardHeader
          title="Sections and weak spots"
          description="Self-reported weaknesses get a priority boost in the recommendation engine."
        />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <fieldset>
            <legend className="label">Stronger section</legend>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className="option"
                  aria-pressed={form.strongerSection === s.value}
                  onClick={() => set("strongerSection", s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">Weaker section</legend>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className="option"
                  aria-pressed={form.weakerSection === s.value}
                  onClick={() => set("weakerSection", s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-5">
          <div className="mb-3 inline-flex rounded-md border border-line bg-surface-2 p-1">
            {(
              [
                ["MATH", "Math"],
                ["READING_WRITING", "Reading & Writing"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSection(value)}
                aria-pressed={section === value}
                className={cx(
                  "rounded-[0.4375rem] px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
                  section === value ? "bg-surface text-ink shadow-xs" : "text-ink-3 hover:text-ink"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {Object.entries(taxonomy).map(([domain, skills]) => (
              <div key={domain}>
                <p className="eyebrow mb-1.5">{domain}</p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      className="option"
                      aria-pressed={form.strugglingTopics.includes(skill)}
                      onClick={() => toggleIn("strugglingTopics", skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Score history"
          description="Optional. Your diagnostic is the authoritative baseline, but prior scores add context."
        />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="prior-type" className="label">
              Most recent test
            </label>
            <select
              id="prior-type"
              className="input"
              value={form.priorTestType}
              onChange={(e) => set("priorTestType", e.target.value)}
            >
              <option value="NONE">None yet</option>
              <option value="SAT">Official SAT</option>
              <option value="PSAT">PSAT</option>
              <option value="PRACTICE">Practice test</option>
            </select>
          </div>
          <div>
            <label htmlFor="prior-total" className="label">
              Total
            </label>
            <input
              id="prior-total"
              type="number"
              className="input font-mono"
              min={400}
              max={1600}
              value={form.lastTotalScore}
              onChange={(e) => set("lastTotalScore", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="prior-rw" className="label">
              R&amp;W
            </label>
            <input
              id="prior-rw"
              type="number"
              className="input font-mono"
              min={200}
              max={800}
              value={form.lastRwScore}
              onChange={(e) => set("lastRwScore", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="prior-math" className="label">
              Math
            </label>
            <input
              id="prior-math"
              type="number"
              className="input font-mono"
              min={200}
              max={800}
              value={form.lastMathScore}
              onChange={(e) => set("lastMathScore", e.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="sticky bottom-20 flex items-center gap-3 lg:bottom-4">
        <button type="button" className="btn btn-primary btn-lg" onClick={save} disabled={saving}>
          {saving ? <IconSpinner /> : null}
          Save and rebuild my plan
        </button>
      </div>
    </div>
  );
}
