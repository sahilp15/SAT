"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconSpinner,
  IconTarget,
} from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";
import { MATH_TAXONOMY, RW_TAXONOMY, SUBSKILLS } from "@/lib/taxonomy";
import type { SatDate } from "@/lib/satDates";

// A seven-question stepper, one idea per screen. Every answer is saved to the
// server as the student moves forward, so backing up, refreshing, or closing the
// tab never loses work.

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DEFAULT_TEST_DATE = "2026-08-22";

interface FormState {
  testDate: string;
  satDateId: string | null;
  targetScore: number;
  priorTestType: "SAT" | "PSAT" | "PRACTICE" | "NONE";
  lastTotalScore: string;
  lastMathScore: string;
  lastRwScore: string;
  strongerSection: "MATH" | "READING_WRITING" | "BALANCED";
  weakerSection: "MATH" | "READING_WRITING" | "BALANCED";
  strugglingTopics: string[];
  daysPerWeek: number;
  minutesPerDay: number;
  availableDays: string[];
  preferredStudyTimes: string[];
  studyStyle: "STRUCTURED" | "FLEXIBLE" | "BOTH";
  wantsReminders: boolean;
  dailyGoalQuestions: number;
}

const INITIAL: FormState = {
  testDate: DEFAULT_TEST_DATE,
  satDateId: DEFAULT_TEST_DATE,
  targetScore: 1600,
  priorTestType: "NONE",
  lastTotalScore: "",
  lastMathScore: "",
  lastRwScore: "",
  strongerSection: "BALANCED",
  weakerSection: "BALANCED",
  strugglingTopics: [],
  daysPerWeek: 5,
  minutesPerDay: 60,
  availableDays: ["Mon", "Tue", "Wed", "Thu", "Sat"],
  preferredStudyTimes: ["EVENING"],
  studyStyle: "BOTH",
  wantsReminders: true,
  dailyGoalQuestions: 20,
};

const STEPS = [
  { id: "welcome", label: "Welcome" },
  { id: "date", label: "Test date" },
  { id: "target", label: "Target" },
  { id: "baseline", label: "Baseline" },
  { id: "sections", label: "Sections" },
  { id: "topics", label: "Weak spots" },
  { id: "time", label: "Availability" },
  { id: "style", label: "Style" },
  { id: "done", label: "Finish" },
] as const;

const FIRST_QUESTION = 1;
const LAST_QUESTION = STEPS.length - 2;
const DONE_STEP = STEPS.length - 1;

const DRAFT_KEY = "sat-onboarding-draft";

export function OnboardingFlow({
  dates,
  initialStep,
  initialValues,
}: {
  dates: SatDate[];
  initialStep: number;
  initialValues: Partial<FormState>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 0), DONE_STEP));
  const [form, setForm] = useState<FormState>({ ...INITIAL, ...initialValues });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState<"none" | "diagnostic" | "dashboard">("none");
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  // Local draft is a safety net for a mid-step refresh before the server save
  // lands; the server copy always wins on load.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setForm((f) => ({ ...f, ...(parsed as Partial<FormState>), ...initialValues }));
      }
    } catch {
      /* corrupted draft — start clean */
    }
    // Intentionally runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* storage full or blocked — the server copy still has it */
    }
  }, [form]);

  // Move focus to the new question so keyboard and screen-reader users follow.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const payload = useCallback(
    (extra: Record<string, unknown> = {}) => {
      const num = (v: string) => (v.trim() === "" ? null : Number.parseInt(v, 10));
      return {
        testDate: form.testDate,
        satDateId: form.satDateId,
        targetScore: form.targetScore,
        priorTestType: form.priorTestType,
        lastTotalScore: form.priorTestType === "NONE" ? null : num(form.lastTotalScore),
        lastMathScore: form.priorTestType === "NONE" ? null : num(form.lastMathScore),
        lastRwScore: form.priorTestType === "NONE" ? null : num(form.lastRwScore),
        strongerSection: form.strongerSection,
        weakerSection: form.weakerSection,
        strugglingTopics: form.strugglingTopics,
        daysPerWeek: form.daysPerWeek,
        minutesPerDay: form.minutesPerDay,
        availableDays: form.availableDays,
        preferredStudyTimes: form.preferredStudyTimes,
        studyStyle: form.studyStyle,
        wantsReminders: form.wantsReminders,
        dailyGoalQuestions: form.dailyGoalQuestions,
        ...extra,
      };
    },
    [form]
  );

  const save = useCallback(
    async (extra: Record<string, unknown> = {}) => {
      setError(null);
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(extra)),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "We couldn't save your answers. Please try again.");
      }
    },
    [payload]
  );

  const next = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const target = Math.min(step + 1, DONE_STEP);
      await save({ onboardingStep: target });
      setStep(target);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }, [save, saving, step]);

  const back = useCallback(() => {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const finish = useCallback(
    async (choice: "diagnostic" | "dashboard") => {
      setFinishing(choice);
      try {
        await save({
          complete: true,
          onboardingStep: DONE_STEP,
          diagnosticChoice: choice === "diagnostic" ? "TAKE_NOW" : "LATER",
        });
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* nothing to clean up */
        }
        // "Take it now" means now — straight into diagnostic 1, not to the hub.
        router.push(choice === "diagnostic" ? "/diagnostic/run?form=1" : "/dashboard");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
        setFinishing("none");
      }
    },
    [router, save]
  );

  const canAdvance = useMemo(() => {
    if (step === 1) return !!form.testDate;
    if (step === 6) return form.availableDays.length > 0;
    return true;
  }, [step, form.testDate, form.availableDays.length]);

  // Enter advances, which makes the whole flow keyboard-driveable.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key !== "Enter" || step >= DONE_STEP) return;
      if (!canAdvance) return;
      e.preventDefault();
      void next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, step, canAdvance]);

  const progress = step === 0 ? 0 : ((step - FIRST_QUESTION + 1) / (LAST_QUESTION - FIRST_QUESTION + 2)) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-3 px-5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent font-display text-[0.9375rem] font-semibold text-accent-contrast">
            S
          </span>
          <span className="font-display text-[0.9375rem] font-semibold text-ink">SAT Studio</span>
          {step > 0 && step < DONE_STEP ? (
            <span className="ml-auto font-mono text-[0.6875rem] uppercase tracking-wider text-ink-3">
              Step {step} of {LAST_QUESTION}
            </span>
          ) : null}
        </div>
        <div className="h-0.5 w-full bg-surface-2">
          <div
            className="h-full bg-accent transition-[width] duration-500 ease-out"
            style={{ width: `${Math.min(100, progress)}%` }}
            role="progressbar"
            aria-valuenow={Math.round(Math.min(100, progress))}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Setup progress"
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-10 sm:py-16">
        <div key={step} className="flex-1 animate-fade-up">
          {step === 0 ? <WelcomeStep headingRef={headingRef} /> : null}
          {step === 1 ? (
            <DateStep headingRef={headingRef} dates={dates} form={form} set={set} />
          ) : null}
          {step === 2 ? <TargetStep headingRef={headingRef} form={form} set={set} /> : null}
          {step === 3 ? <BaselineStep headingRef={headingRef} form={form} set={set} /> : null}
          {step === 4 ? <SectionsStep headingRef={headingRef} form={form} set={set} /> : null}
          {step === 5 ? <TopicsStep headingRef={headingRef} form={form} set={set} /> : null}
          {step === 6 ? <TimeStep headingRef={headingRef} form={form} set={set} /> : null}
          {step === 7 ? <StyleStep headingRef={headingRef} form={form} set={set} /> : null}
          {step === DONE_STEP ? (
            <DoneStep headingRef={headingRef} form={form} onFinish={finish} finishing={finishing} />
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="mt-6 text-[0.8125rem] font-medium text-bad">
            {error}
          </p>
        ) : null}

        {step < DONE_STEP ? (
          <div className="mt-10 flex items-center gap-3 border-t border-line pt-6">
            {step > 0 ? (
              <button type="button" onClick={back} className="btn btn-ghost" disabled={saving}>
                <IconChevronLeft size={15} />
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={next}
              className="btn btn-primary btn-lg ml-auto"
              disabled={saving || !canAdvance}
            >
              {saving ? <IconSpinner /> : null}
              {step === 0 ? "Get started" : step === LAST_QUESTION ? "Build my plan" : "Continue"}
              {!saving ? <IconArrowRight size={15} /> : null}
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared step chrome
// ---------------------------------------------------------------------------

type HeadingRef = React.RefObject<HTMLHeadingElement>;

function StepShell({
  headingRef,
  eyebrow,
  title,
  description,
  children,
}: {
  headingRef: HeadingRef;
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-[1.75rem] leading-tight text-ink outline-none sm:text-[2rem]"
      >
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-ink-3">{description}</p>
      ) : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function ChoiceCard({
  active,
  onClick,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "flex w-full items-start gap-3 rounded-md border p-4 text-left transition-colors duration-200",
        active
          ? "border-accent bg-accent-weak"
          : "border-line-strong bg-surface hover:border-ink-3 hover:bg-surface-2"
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          active ? "border-accent bg-accent text-accent-contrast" : "border-line-strong"
        )}
      >
        {active ? <IconCheck size={9} strokeWidth={3.5} /> : null}
      </span>
      <span className="min-w-0">
        <span className={cx("block text-sm font-semibold", active ? "text-accent" : "text-ink")}>
          {title}
        </span>
        {description ? (
          <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-ink-3">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

function WelcomeStep({ headingRef }: { headingRef: HeadingRef }) {
  return (
    <StepShell
      headingRef={headingRef}
      eyebrow="Setup · about 2 minutes"
      title="Let's build a plan you'll actually follow."
      description="Seven short questions. Your answers decide what you practice, how the schedule is shaped, and how the score estimate is interpreted &mdash; so it&rsquo;s worth answering honestly rather than optimistically."
    >
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ["Your date", "The whole schedule is built backwards from test day."],
          ["Your gaps", "Practice targets specific skills, not whole sections."],
          ["Your time", "Sessions are sized to the time you actually have."],
        ].map(([title, body]) => (
          <li key={title} className="card-inset p-4">
            <p className="text-[0.8125rem] font-semibold text-ink">{title}</p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-3">{body}</p>
          </li>
        ))}
      </ul>
    </StepShell>
  );
}

interface StepProps {
  headingRef: HeadingRef;
  form: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}

function DateStep({ headingRef, dates, form, set }: StepProps & { dates: SatDate[] }) {
  const [custom, setCustom] = useState(
    () => !dates.some((d) => d.date === form.testDate)
  );

  return (
    <StepShell
      headingRef={headingRef}
      eyebrow="Question 1"
      title="When are you taking the SAT?"
      description="Everything else is scheduled backwards from this date, so get it right &mdash; you can change it later in Settings."
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {dates.slice(0, 4).map((d) => (
          <ChoiceCard
            key={d.id}
            active={!custom && form.testDate === d.date}
            onClick={() => {
              setCustom(false);
              set("testDate", d.date);
              set("satDateId", d.id);
            }}
            title={d.label}
            description={
              d.registrationDeadline ? `Registration closes ~${d.registrationDeadline}` : undefined
            }
          />
        ))}
      </div>

      <div className="mt-4 rounded-md border border-line-strong bg-surface p-4">
        <label htmlFor="custom-date" className="label flex items-center gap-2">
          <IconCalendar size={14} />
          Or enter another date
        </label>
        <input
          id="custom-date"
          type="date"
          className="input max-w-xs"
          value={custom ? form.testDate : ""}
          min="2026-01-01"
          max="2030-12-31"
          onChange={(e) => {
            setCustom(true);
            set("testDate", e.target.value);
            set("satDateId", null);
          }}
        />
        <p className="hint mt-2">
          Verify your exact date on collegeboard.org — administration dates occasionally shift.
        </p>
      </div>
    </StepShell>
  );
}

const TARGET_PRESETS = [1600, 1550, 1500, 1400];

function TargetStep({ headingRef, form, set }: StepProps) {
  return (
    <StepShell
      headingRef={headingRef}
      eyebrow="Question 2"
      title="What score are you aiming for?"
      description="This sets the mastery bar for every skill. Aim high &mdash; the plan will be honest with you about the gap rather than pretending it isn&rsquo;t there."
    >
      <div className="flex flex-wrap gap-2">
        {TARGET_PRESETS.map((score) => (
          <button
            key={score}
            type="button"
            className="option font-mono"
            aria-pressed={form.targetScore === score}
            onClick={() => set("targetScore", score)}
          >
            {score}
          </button>
        ))}
      </div>

      <div className="mt-6 max-w-sm">
        <label htmlFor="target-score" className="label flex items-center gap-2">
          <IconTarget size={14} />
          Target total score
        </label>
        <input
          id="target-score"
          type="range"
          min={800}
          max={1600}
          step={10}
          value={form.targetScore}
          onChange={(e) => set("targetScore", Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
          aria-describedby="target-score-value"
        />
        <div
          id="target-score-value"
          className="mt-2 font-mono text-3xl font-semibold leading-none text-ink"
        >
          {form.targetScore}
        </div>
        <p className="hint mt-2">
          That&rsquo;s roughly {Math.round(form.targetScore / 2 / 10) * 10} per section.
        </p>
      </div>
    </StepShell>
  );
}

function BaselineStep({ headingRef, form, set }: StepProps) {
  const showScores = form.priorTestType !== "NONE";
  return (
    <StepShell
      headingRef={headingRef}
      eyebrow="Question 3"
      title="Have you taken the SAT or PSAT before?"
      description="A prior score gives the plan a starting point. If you haven&rsquo;t taken one, the score predictor will establish your baseline instead."
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {(
          [
            ["SAT", "Official SAT", "I\u2019ve sat a real, scored SAT."],
            ["PSAT", "PSAT / NMSQT", "I have a PSAT score."],
            ["PRACTICE", "Practice test", "A Bluebook or paper practice test."],
            ["NONE", "Not yet", "This will be my first."],
          ] as const
        ).map(([value, title, desc]) => (
          <ChoiceCard
            key={value}
            active={form.priorTestType === value}
            onClick={() => set("priorTestType", value)}
            title={title}
            description={desc}
          />
        ))}
      </div>

      {showScores ? (
        <div className="mt-5 animate-fade-up rounded-md border border-line-strong bg-surface p-4">
          <p className="label">Your most recent scores (optional)</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="last-total" className="hint mb-1 block">
                Total (400–1600)
              </label>
              <input
                id="last-total"
                type="number"
                inputMode="numeric"
                min={400}
                max={1600}
                className="input font-mono"
                value={form.lastTotalScore}
                onChange={(e) => set("lastTotalScore", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="last-rw" className="hint mb-1 block">
                Reading &amp; Writing
              </label>
              <input
                id="last-rw"
                type="number"
                inputMode="numeric"
                min={200}
                max={800}
                className="input font-mono"
                value={form.lastRwScore}
                onChange={(e) => set("lastRwScore", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="last-math" className="hint mb-1 block">
                Math
              </label>
              <input
                id="last-math"
                type="number"
                inputMode="numeric"
                min={200}
                max={800}
                className="input font-mono"
                value={form.lastMathScore}
                onChange={(e) => set("lastMathScore", e.target.value)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </StepShell>
  );
}

const SECTION_OPTIONS = [
  { value: "MATH", label: "Math" },
  { value: "READING_WRITING", label: "Reading & Writing" },
  { value: "BALANCED", label: "About the same" },
] as const;

function SectionsStep({ headingRef, form, set }: StepProps) {
  return (
    <StepShell
      headingRef={headingRef}
      eyebrow="Question 4"
      title="Which section is stronger?"
      description="Your own read on this shapes the early schedule. The diagnostic will confirm or correct it with evidence."
    >
      <fieldset>
        <legend className="label">Stronger section</legend>
        <div className="flex flex-wrap gap-2">
          {SECTION_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className="option"
              aria-pressed={form.strongerSection === o.value}
              onClick={() => {
                set("strongerSection", o.value);
                // Keep the pair coherent without forcing a second decision.
                if (o.value === "MATH") set("weakerSection", "READING_WRITING");
                else if (o.value === "READING_WRITING") set("weakerSection", "MATH");
                else set("weakerSection", "BALANCED");
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="label">Weaker section</legend>
        <div className="flex flex-wrap gap-2">
          {SECTION_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className="option"
              aria-pressed={form.weakerSection === o.value}
              onClick={() => set("weakerSection", o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>
    </StepShell>
  );
}

function TopicsStep({ headingRef, form, set }: StepProps) {
  const [section, setSection] = useState<"MATH" | "READING_WRITING">("MATH");
  const taxonomy = section === "MATH" ? MATH_TAXONOMY : RW_TAXONOMY;

  function toggle(skill: string) {
    set(
      "strugglingTopics",
      form.strugglingTopics.includes(skill)
        ? form.strugglingTopics.filter((s) => s !== skill)
        : [...form.strugglingTopics, skill]
    );
  }

  return (
    <StepShell
      headingRef={headingRef}
      eyebrow="Question 5"
      title="What already gives you trouble?"
      description="Pick anything you know is shaky. These get an immediate priority boost &mdash; the diagnostic will find the rest."
    >
      <div className="mb-5 inline-flex rounded-md border border-line bg-surface-2 p-1">
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
              "rounded-[0.4375rem] px-3.5 py-1.5 text-sm font-medium transition-colors",
              section === value ? "bg-surface text-ink shadow-xs" : "text-ink-3 hover:text-ink"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {Object.entries(taxonomy).map(([domain, skills]) => (
          <div key={domain}>
            <p className="eyebrow mb-2">{domain}</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => {
                const examples = (SUBSKILLS[skill] ?? []).slice(0, 2).map((s) => s.name);
                return (
                  <button
                    key={skill}
                    type="button"
                    className="option max-w-full items-start text-left"
                    aria-pressed={form.strugglingTopics.includes(skill)}
                    onClick={() => toggle(skill)}
                    title={examples.length ? `e.g. ${examples.join(", ")}` : undefined}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{skill}</span>
                      {examples.length ? (
                        <span className="block truncate text-[0.6875rem] text-ink-3">
                          e.g. {examples.join(" · ")}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="hint mt-6">
        {form.strugglingTopics.length === 0
          ? "Nothing selected \u2014 that\u2019s fine, the diagnostic will figure it out."
          : `${form.strugglingTopics.length} selected.`}
      </p>
    </StepShell>
  );
}

function TimeStep({ headingRef, form, set }: StepProps) {
  const weekly = Math.round((form.daysPerWeek * form.minutesPerDay) / 6) / 10;

  function toggleDay(day: string) {
    const next = form.availableDays.includes(day)
      ? form.availableDays.filter((d) => d !== day)
      : [...form.availableDays, day];
    set("availableDays", next);
    set("daysPerWeek", Math.max(1, next.length));
  }

  return (
    <StepShell
      headingRef={headingRef}
      eyebrow="Question 6"
      title="How much time do you really have?"
      description="Be realistic rather than aspirational. A plan sized to the time you actually have is the one you&rsquo;ll still be following in a month."
    >
      <fieldset>
        <legend className="label">Which days can you study?</legend>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              className="option min-w-[3.25rem] justify-center"
              aria-pressed={form.availableDays.includes(day)}
              onClick={() => toggleDay(day)}
            >
              {day}
            </button>
          ))}
        </div>
        {form.availableDays.length === 0 ? (
          <p className="mt-2 text-[0.8125rem] font-medium text-bad">Pick at least one day.</p>
        ) : null}
      </fieldset>

      <div className="mt-7 max-w-sm">
        <label htmlFor="minutes" className="label">
          Minutes per study day
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
          aria-describedby="minutes-value"
        />
        <div id="minutes-value" className="mt-2 font-mono text-2xl font-semibold text-ink">
          {form.minutesPerDay} min
        </div>
      </div>

      <div className="mt-6 card-inset p-4">
        <p className="text-[0.8125rem] text-ink-2">
          That&rsquo;s <strong className="font-mono">{weekly}</strong> hours a week across{" "}
          <strong className="font-mono">{form.availableDays.length || form.daysPerWeek}</strong>{" "}
          days.
        </p>
      </div>
    </StepShell>
  );
}

const TIME_SLOTS = [
  { value: "MORNING", label: "Morning" },
  { value: "AFTERNOON", label: "Afternoon" },
  { value: "EVENING", label: "Evening" },
  { value: "NIGHT", label: "Late night" },
] as const;

function StyleStep({ headingRef, form, set }: StepProps) {
  function toggleTime(value: string) {
    set(
      "preferredStudyTimes",
      form.preferredStudyTimes.includes(value)
        ? form.preferredStudyTimes.filter((t) => t !== value)
        : [...form.preferredStudyTimes, value]
    );
  }

  return (
    <StepShell
      headingRef={headingRef}
      eyebrow="Question 7"
      title="How do you want this to run?"
      description="The last piece: how prescriptive the plan should be, and what you want to be nudged about."
    >
      <fieldset>
        <legend className="label">Plan style</legend>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {(
            [
              ["STRUCTURED", "Structured", "Tell me exactly what to do each day."],
              ["FLEXIBLE", "Flexible", "Give me recommendations, I\u2019ll choose."],
              ["BOTH", "Both", "A daily plan I can deviate from."],
            ] as const
          ).map(([value, title, desc]) => (
            <ChoiceCard
              key={value}
              active={form.studyStyle === value}
              onClick={() => set("studyStyle", value)}
              title={title}
              description={desc}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-7">
        <legend className="label">When do you usually study?</legend>
        <div className="flex flex-wrap gap-2">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot.value}
              type="button"
              className="option"
              aria-pressed={form.preferredStudyTimes.includes(slot.value)}
              onClick={() => toggleTime(slot.value)}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card-inset p-4">
          <label htmlFor="daily-goal" className="label">
            Daily question goal
          </label>
          <input
            id="daily-goal"
            type="number"
            min={0}
            max={200}
            className="input max-w-[8rem] font-mono"
            value={form.dailyGoalQuestions}
            onChange={(e) => set("dailyGoalQuestions", Number(e.target.value || 0))}
          />
          <p className="hint mt-2">Shown on the dashboard as today&rsquo;s target.</p>
        </div>
        <div className="card-inset flex items-start gap-3 p-4">
          <input
            id="reminders"
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            checked={form.wantsReminders}
            onChange={(e) => set("wantsReminders", e.target.checked)}
          />
          <label htmlFor="reminders" className="text-[0.8125rem] leading-relaxed text-ink-2">
            <span className="block font-semibold text-ink">Daily goals and nudges</span>
            Show streaks, daily targets, and reminders about what&rsquo;s due.
          </label>
        </div>
      </div>
    </StepShell>
  );
}

function DoneStep({
  headingRef,
  form,
  onFinish,
  finishing,
}: {
  headingRef: HeadingRef;
  form: FormState;
  onFinish: (choice: "diagnostic" | "dashboard") => void;
  finishing: "none" | "diagnostic" | "dashboard";
}) {
  const busy = finishing !== "none";
  return (
    <section className="animate-fade-up">
      <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-good-weak text-good">
        <IconCheck size={22} strokeWidth={2.5} />
      </span>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-[1.75rem] leading-tight text-ink outline-none sm:text-[2rem]"
      >
        Your plan is ready.
      </h1>
      <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-ink-3">
        We&rsquo;ve built a schedule aiming at{" "}
        <strong className="font-mono text-ink">{form.targetScore}</strong> and running through your
        test date.
      </p>

      <div className="mt-8 rounded-lg border border-accent bg-accent-weak p-5">
        <p className="eyebrow text-accent">Recommended next step</p>
        <h2 className="mt-2 text-lg text-ink">Take the 20-question score predictor</h2>
        <p className="mt-2 max-w-xl text-[0.875rem] leading-relaxed text-ink-2">
          It takes about 25 minutes and adapts as you go: five routing questions per section, then
          five more matched to how you did. It produces an estimated score with an honest confidence
          range, and — more usefully — the exact skills to work on first. Until you take it, your
          plan is built from your own self-assessment alone.
        </p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => onFinish("diagnostic")}
            disabled={busy}
          >
            {finishing === "diagnostic" ? <IconSpinner /> : null}
            Take the diagnostic now
            {finishing !== "diagnostic" ? <IconArrowRight size={15} /> : null}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={() => onFinish("dashboard")}
            disabled={busy}
          >
            {finishing === "dashboard" ? <IconSpinner /> : null}
            Go to the dashboard, I&rsquo;ll take it later
          </button>
        </div>
      </div>

      <p className="mt-6 text-[0.8125rem] leading-relaxed text-ink-3">
        You can change any of these answers in{" "}
        <Link href="/profile" className="font-medium text-accent hover:underline">
          your profile
        </Link>{" "}
        at any time. No study plan can guarantee a score — this one is built to give you the best
        shot at yours.
      </p>
    </section>
  );
}
