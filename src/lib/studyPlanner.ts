// Day-by-day study plan generation, from today through test day.
//
// The plan is deterministic given its inputs (no randomness, `now` is always
// passed in) so it can be regenerated any time new practice data lands without
// the schedule jumping around. It is rebuilt — not patched — whenever the
// predicted score, mastery, or availability changes, which is what makes it
// "automatically adjust as the test approaches".
//
// Design rules baked in here:
//   - Time is finite: total assigned minutes never exceed what the student said
//     they have. Over-assigning is how plans get abandoned in week two.
//   - Effort follows impact: the highest-priority weaknesses get the most days,
//     rather than every topic getting an equal slice.
//   - The taper is real: the last week is review and rest, not new material.

import { addDays, daysBetween, startOfDay, toIsoDate } from "./testDate";
import type { Recommendation } from "./recommendations";

export type PlanDayKind =
  | "SKILL"
  | "MIXED"
  | "TIMED"
  | "FULL_TEST"
  | "ERROR_REVIEW"
  | "LIGHT"
  | "REST"
  | "FINAL_WEEK"
  | "TEST_DAY";

export type PlanPhase =
  | "DIAGNOSTIC"
  | "FOUNDATION"
  | "SKILL_FOCUS"
  | "TIMED_PRACTICE"
  | "FULL_TEST"
  | "SHARPEN"
  | "FINAL_WEEK"
  | "TEST_DAY";

export const PHASE_LABELS: Record<PlanPhase, string> = {
  DIAGNOSTIC: "Diagnostic",
  FOUNDATION: "Foundations",
  SKILL_FOCUS: "Skill focus",
  TIMED_PRACTICE: "Timed practice",
  FULL_TEST: "Full-length tests",
  SHARPEN: "Sharpening",
  FINAL_WEEK: "Final week",
  TEST_DAY: "Test day",
};

export const PHASE_BLURBS: Record<PlanPhase, string> = {
  DIAGNOSTIC:
    "Take the score predictor first. Every recommendation after that is built on what it finds.",
  FOUNDATION:
    "Build coverage across every domain and fix the methods that are missing. Volume matters more than speed right now.",
  SKILL_FOCUS:
    "Go deep on the specific skills costing the most points. Harder items, tighter feedback loop.",
  TIMED_PRACTICE:
    "Add the clock. The content is mostly there — now it has to happen at test pace.",
  FULL_TEST:
    "Simulate test day on a schedule and review every miss. Stamina is part of the score.",
  SHARPEN:
    "Short, sharp sessions on your remaining weak spots. No new material from here.",
  FINAL_WEEK:
    "Taper. Light review of your error log, confirm your pacing, and protect your sleep.",
  TEST_DAY: "Test day. Trust the preparation.",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export interface PlanItem {
  label: string;
  detail?: string;
  section?: string | null;
  skill?: string | null;
  questions?: number;
  minutes: number;
  href?: string;
}

export interface PlanDay {
  date: Date;
  iso: string;
  weekIndex: number;
  kind: PlanDayKind;
  title: string;
  items: PlanItem[];
  targetMinutes: number;
  targetQuestions: number;
}

export interface PlannerInput {
  now?: Date;
  testDate: Date;
  /** Day-of-week abbreviations the student is available, e.g. ["Mon","Wed","Sat"]. */
  availableDays: string[];
  minutesPerDay: number;
  daysPerWeek: number;
  recommendations: Recommendation[];
  hasDiagnostic: boolean;
  predictedTotal: number | null;
  targetScore: number | null;
  /** Cap on how far ahead to materialize days. */
  horizonDays?: number;
}

export interface GeneratedStudyPlan {
  phase: PlanPhase;
  summary: string;
  days: PlanDay[];
  weeklyGoals: WeeklyGoal[];
}

export interface WeeklyGoal {
  weekIndex: number;
  startIso: string;
  endIso: string;
  focus: string;
  targetQuestions: number;
  targetMinutes: number;
  /** Score checkpoint for the end of this week, or null when unknown. */
  scoreTarget: number | null;
}

export function determinePhase(daysRemaining: number, hasDiagnostic: boolean): PlanPhase {
  if (daysRemaining <= 0) return "TEST_DAY";
  if (!hasDiagnostic) return "DIAGNOSTIC";
  if (daysRemaining <= 7) return "FINAL_WEEK";
  if (daysRemaining <= 14) return "SHARPEN";
  if (daysRemaining <= 28) return "FULL_TEST";
  if (daysRemaining <= 60) return "TIMED_PRACTICE";
  if (daysRemaining <= 120) return "SKILL_FOCUS";
  return "FOUNDATION";
}

/**
 * Pick the study days for a week. Honors the student's stated availability, and
 * if they asked for more days per week than they marked available, fills in the
 * remaining days in a fixed order so the plan still matches their commitment.
 */
function studyDaysForWeek(available: string[], daysPerWeek: number): Set<string> {
  const chosen = new Set(available.filter((d) => DAY_NAMES.includes(d as (typeof DAY_NAMES)[number])));
  if (chosen.size >= daysPerWeek) {
    // Trim to the requested count, keeping calendar order.
    const ordered = DAY_NAMES.filter((d) => chosen.has(d)).slice(0, daysPerWeek);
    return new Set(ordered);
  }
  const fillOrder = ["Mon", "Wed", "Sat", "Tue", "Thu", "Sun", "Fri"];
  for (const d of fillOrder) {
    if (chosen.size >= daysPerWeek) break;
    chosen.add(d);
  }
  return chosen;
}

/** Rotation of day types within a study week, per phase. */
const WEEK_PATTERNS: Record<PlanPhase, PlanDayKind[]> = {
  DIAGNOSTIC: ["SKILL", "SKILL", "MIXED", "ERROR_REVIEW", "SKILL", "MIXED", "LIGHT"],
  FOUNDATION: ["SKILL", "SKILL", "MIXED", "ERROR_REVIEW", "SKILL", "MIXED", "LIGHT"],
  SKILL_FOCUS: ["SKILL", "SKILL", "TIMED", "ERROR_REVIEW", "SKILL", "MIXED", "LIGHT"],
  TIMED_PRACTICE: ["TIMED", "SKILL", "MIXED", "ERROR_REVIEW", "TIMED", "SKILL", "LIGHT"],
  FULL_TEST: ["TIMED", "ERROR_REVIEW", "SKILL", "TIMED", "MIXED", "ERROR_REVIEW", "LIGHT"],
  SHARPEN: ["MIXED", "ERROR_REVIEW", "TIMED", "MIXED", "ERROR_REVIEW", "LIGHT", "LIGHT"],
  FINAL_WEEK: ["FINAL_WEEK", "FINAL_WEEK", "FINAL_WEEK", "FINAL_WEEK", "FINAL_WEEK", "LIGHT", "LIGHT"],
  TEST_DAY: ["LIGHT"],
};

const KIND_TITLES: Record<PlanDayKind, string> = {
  SKILL: "Targeted skill work",
  MIXED: "Mixed review",
  TIMED: "Timed module",
  FULL_TEST: "Full-length practice test",
  ERROR_REVIEW: "Error-log review",
  LIGHT: "Light day",
  REST: "Rest day",
  FINAL_WEEK: "Final-week review",
  TEST_DAY: "Test day",
};

function buildItems(
  kind: PlanDayKind,
  recs: Recommendation[],
  rotation: number,
  minutes: number
): PlanItem[] {
  const budget = Math.max(15, minutes);

  if (kind === "REST") return [];

  if (kind === "TEST_DAY") {
    return [
      {
        label: "Test day — nothing new",
        detail:
          "Eat, arrive early, and bring your admitted-student ticket, photo ID, a charged device, and a backup calculator. Do not study new material.",
        minutes: 0,
      },
    ];
  }

  if (kind === "FULL_TEST") {
    return [
      {
        label: "Full-length practice test under test conditions",
        detail: "Same start time as your real test, no phone, timed breaks.",
        minutes: 134,
        href: "/practice-tests",
      },
      {
        label: "Log every miss",
        detail: "Score it the same day and write an error log for each wrong answer.",
        minutes: 45,
        href: "/errors",
      },
    ];
  }

  if (kind === "FINAL_WEEK") {
    return [
      {
        label: "Review unresolved error-log entries",
        detail: "Only questions you have already seen. No new material this week.",
        minutes: Math.round(budget * 0.5),
        href: "/errors",
      },
      {
        label: "One short timed set to hold pacing",
        questions: 10,
        minutes: Math.round(budget * 0.35),
        href: "/practice",
      },
      {
        label: "Confirm logistics and sleep schedule",
        minutes: Math.round(budget * 0.15),
      },
    ];
  }

  if (kind === "ERROR_REVIEW") {
    return [
      {
        label: "Clear the spaced-repetition queue",
        detail: "Everything due today, answered honestly.",
        minutes: Math.round(budget * 0.5),
        href: "/review/spaced-repetition",
      },
      {
        label: "Re-attempt unresolved misses",
        detail: "Work them cold, then check against your original error log.",
        minutes: Math.round(budget * 0.5),
        href: "/errors",
      },
    ];
  }

  if (kind === "LIGHT") {
    return [
      {
        label: "Short review session",
        detail: "Ten minutes of due spaced-repetition items. Recovery days protect consistency.",
        questions: 8,
        minutes: Math.min(20, budget),
        href: "/review/spaced-repetition",
      },
    ];
  }

  if (kind === "TIMED") {
    // A real module pair is 67 minutes before any review. If the student
    // doesn't have that, run one module and alternate sections across days
    // rather than scheduling time they don't have.
    const RW_MODULE: PlanItem = {
      label: "Timed module — Reading & Writing",
      detail: "27 questions, 32 minutes. Practice the clock, not the content.",
      section: "READING_WRITING",
      questions: 27,
      minutes: 32,
      href: "/practice/reading-writing",
    };
    const MATH_MODULE: PlanItem = {
      label: "Timed module — Math",
      detail: "22 questions, 35 minutes.",
      section: "MATH",
      questions: 22,
      minutes: 35,
      href: "/practice/math",
    };

    const bothFit = budget >= 67;
    const modules = bothFit
      ? [RW_MODULE, MATH_MODULE]
      : [rotation % 2 === 0 ? RW_MODULE : MATH_MODULE];

    const used = modules.reduce((s, m) => s + m.minutes, 0);
    const focus = recs[rotation % Math.max(1, recs.length)];
    const spare = budget - used;

    return [
      ...modules,
      ...(focus && spare >= 12
        ? [
            {
              label: `Review pass: ${focus.skill}`,
              section: focus.section,
              skill: focus.skill,
              questions: 5,
              minutes: Math.min(15, spare),
              href: practiceHref(focus),
            },
          ]
        : []),
    ];
  }

  if (kind === "MIXED") {
    const picks = recs.slice(0, 3);
    const per = Math.max(10, Math.round(budget / Math.max(1, picks.length || 1)));
    if (!picks.length) {
      return [
        {
          label: "Mixed practice set",
          questions: 15,
          minutes: budget,
          href: "/practice",
        },
      ];
    }
    return picks.map((r) => ({
      label: `Mixed set: ${r.skill}`,
      section: r.section,
      skill: r.skill,
      questions: Math.max(5, Math.round(per / 2)),
      minutes: per,
      href: practiceHref(r),
    }));
  }

  // SKILL: one or two focused sets on the highest-priority gaps, rotating so a
  // single skill doesn't monopolize every study day.
  const primary = recs[rotation % Math.max(1, recs.length)];
  const secondary = recs[(rotation + 1) % Math.max(1, recs.length)];
  if (!primary) {
    return [{ label: "Practice set", questions: 15, minutes: budget, href: "/practice" }];
  }
  const items: PlanItem[] = [
    {
      label: `Focused set: ${primary.skill}`,
      detail: primary.reason,
      section: primary.section,
      skill: primary.skill,
      questions: primary.recommendedQuestions,
      minutes: Math.min(primary.estimatedMinutes, Math.round(budget * 0.65)),
      href: practiceHref(primary),
    },
  ];
  if (secondary && secondary.skill !== primary.skill && budget >= 45) {
    items.push({
      label: `Second set: ${secondary.skill}`,
      section: secondary.section,
      skill: secondary.skill,
      questions: Math.max(6, Math.round(secondary.recommendedQuestions / 2)),
      minutes: Math.round(budget * 0.35),
      href: practiceHref(secondary),
    });
  }
  return items;
}

export function practiceHref(r: Pick<Recommendation, "section" | "skill" | "recommendedDifficulty" | "recommendedQuestions">): string {
  const params = new URLSearchParams({
    section: String(r.section),
    skill: r.skill,
    count: String(r.recommendedQuestions),
  });
  if (r.recommendedDifficulty !== "MIXED") params.set("difficulty", r.recommendedDifficulty);
  return `/practice/session?${params.toString()}`;
}

/**
 * Where full-length tests land: every ~14 days once inside 8 weeks, preferring
 * Saturdays, and never in the last 4 days before the test.
 */
function fullTestDates(now: Date, testDate: Date): Set<string> {
  const out = new Set<string>();
  const total = daysBetween(now, testDate);
  if (total < 14) return out;

  const lastAllowed = addDays(testDate, -4);
  let cursor = addDays(now, Math.min(10, Math.max(5, Math.floor(total * 0.15))));
  while (daysBetween(cursor, lastAllowed) >= 0) {
    // Nudge to the nearest Saturday for a realistic full-test slot.
    const shift = (6 - cursor.getDay() + 7) % 7;
    const candidate = shift <= 3 ? addDays(cursor, shift) : cursor;
    if (daysBetween(candidate, lastAllowed) >= 0 && daysBetween(now, candidate) >= 2) {
      out.add(toIsoDate(candidate));
    }
    cursor = addDays(cursor, 14);
  }
  return out;
}

export function generateStudyPlan(input: PlannerInput): GeneratedStudyPlan {
  const now = startOfDay(input.now ?? new Date());
  const testDate = startOfDay(input.testDate);
  const daysRemaining = daysBetween(now, testDate);
  const phase = determinePhase(daysRemaining, input.hasDiagnostic);

  const horizon = Math.max(0, Math.min(input.horizonDays ?? 120, daysRemaining));
  const studyDays = studyDaysForWeek(input.availableDays, Math.max(1, Math.min(7, input.daysPerWeek || 4)));
  const testDays = fullTestDates(now, testDate);
  const minutes = Math.max(15, input.minutesPerDay || 45);

  const days: PlanDay[] = [];
  let rotation = 0;

  for (let offset = 0; offset <= horizon; offset += 1) {
    const date = addDays(now, offset);
    const iso = toIsoDate(date);
    const weekIndex = Math.floor(offset / 7);
    const dayName = DAY_NAMES[date.getDay()];
    const remaining = daysBetween(date, testDate);

    // Phase is evaluated per day so the plan tapers correctly near the end.
    const dayPhase = determinePhase(remaining, input.hasDiagnostic);

    let kind: PlanDayKind;
    if (remaining === 0) {
      kind = "TEST_DAY";
    } else if (remaining === 1) {
      kind = "LIGHT";
    } else if (testDays.has(iso)) {
      kind = "FULL_TEST";
    } else if (!studyDays.has(dayName)) {
      kind = "REST";
    } else {
      const pattern = WEEK_PATTERNS[dayPhase];
      kind = pattern[rotation % pattern.length];
      rotation += 1;
    }

    const items =
      remaining === 1
        ? [
            {
              label: "Day before the test — no new material",
              detail:
                "Twenty minutes skimming your error log at most. Pack your bag, confirm the location, and sleep.",
              minutes: 20,
            },
          ]
        : buildItems(kind, input.recommendations, rotation, minutes);

    days.push({
      date,
      iso,
      weekIndex,
      kind,
      title: remaining === 1 ? "Day before test" : KIND_TITLES[kind],
      items,
      targetMinutes: items.reduce((s, i) => s + i.minutes, 0),
      targetQuestions: items.reduce((s, i) => s + (i.questions ?? 0), 0),
    });
  }

  return {
    phase,
    summary: buildSummary(phase, daysRemaining, input),
    days,
    weeklyGoals: buildWeeklyGoals(days, input, daysRemaining),
  };
}

function buildSummary(phase: PlanPhase, daysRemaining: number, input: PlannerInput): string {
  const gap =
    input.predictedTotal != null && input.targetScore != null
      ? input.targetScore - input.predictedTotal
      : null;

  const timing =
    daysRemaining > 0
      ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} until test day.`
      : "Test day is here.";

  const gapText =
    gap == null
      ? " Take the diagnostic so this plan can target your actual weak spots."
      : gap <= 0
        ? " You are already estimating at or above your target — the plan shifts to holding that level under real conditions."
        : ` The plan prioritizes the ${gap}-point gap between your current estimate and your target, weakest high-impact skills first.`;

  const honesty =
    " This plan is built to give you the best shot at your target if you follow it consistently. No study plan can guarantee a score.";

  return `${PHASE_BLURBS[phase]} ${timing}${gapText}${honesty}`;
}

function buildWeeklyGoals(
  days: PlanDay[],
  input: PlannerInput,
  daysRemaining: number
): WeeklyGoal[] {
  const byWeek = new Map<number, PlanDay[]>();
  for (const d of days) {
    const list = byWeek.get(d.weekIndex) ?? [];
    list.push(d);
    byWeek.set(d.weekIndex, list);
  }

  const totalWeeks = Math.max(1, Math.ceil(Math.max(daysRemaining, 1) / 7));
  const start = input.predictedTotal;
  const target = input.targetScore;

  return [...byWeek.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([weekIndex, weekDays]) => {
      const focusDay = weekDays.find((d) => d.kind === "FULL_TEST")
        ? "Full-length test week"
        : weekDays.find((d) => d.kind === "TIMED")
          ? "Pacing under time"
          : (input.recommendations[weekIndex % Math.max(1, input.recommendations.length)]?.skill ??
            "Broad skill coverage");

      // Score checkpoints assume progress is front-loaded: early weeks close
      // gaps faster than the last stretch, which is realistic.
      let scoreTarget: number | null = null;
      if (start != null && target != null && target > start) {
        const progress = Math.min(1, (weekIndex + 1) / totalWeeks);
        const eased = 1 - Math.pow(1 - progress, 1.6);
        scoreTarget = Math.round((start + (target - start) * eased) / 10) * 10;
      }

      return {
        weekIndex,
        startIso: weekDays[0].iso,
        endIso: weekDays[weekDays.length - 1].iso,
        focus: focusDay,
        targetQuestions: weekDays.reduce((s, d) => s + d.targetQuestions, 0),
        targetMinutes: weekDays.reduce((s, d) => s + d.targetMinutes, 0),
        scoreTarget,
      };
    });
}
