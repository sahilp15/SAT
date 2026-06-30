// Rule-based study-plan and practice-test scheduling.
// This is the deterministic fallback that always works (no AI key needed). When
// AI is configured, the /api/ai/study-plan route can enrich/replace the summary,
// but the phase logic and test spacing here remain a sane backbone.

import { getSatDateById, daysUntil, type SatDate } from "./satDates";

export type StudyPhase =
  | "DIAGNOSTIC"
  | "SKILL_BUILDING"
  | "TOPIC_MASTERY"
  | "TIMED_PRACTICE"
  | "FULL_TEST"
  | "FINAL_REVIEW";

export interface PlanInputs {
  satDateId: string | null;
  targetScore: number | null;
  lastTotalScore: number | null;
  weeklyHours: number | null;
  planIntensity: string; // AGGRESSIVE | BALANCED | LIGHT
  hasDiagnostic: boolean;
  weakestTopics: { section: string; domain: string; skill: string; accuracy: number }[];
  now?: Date;
}

export interface PlanTask {
  title: string;
  description?: string;
  cadence: "daily" | "weekly";
  section?: string | null;
}

export interface GeneratedPlan {
  phase: StudyPhase;
  summary: string;
  weeklyTasks: PlanTask[];
  dailyTasks: PlanTask[];
}

/** Pick the current study phase from time remaining + diagnostic status. */
export function determinePhase(daysLeft: number | null, hasDiagnostic: boolean): StudyPhase {
  if (!hasDiagnostic) return "DIAGNOSTIC";
  if (daysLeft == null) return "SKILL_BUILDING";
  if (daysLeft <= 7) return "FINAL_REVIEW";
  if (daysLeft <= 21) return "FULL_TEST";
  if (daysLeft <= 56) return "TIMED_PRACTICE";
  if (daysLeft <= 120) return "TOPIC_MASTERY";
  return "SKILL_BUILDING";
}

const PHASE_BLURB: Record<StudyPhase, string> = {
  DIAGNOSTIC:
    "Start with a realistic baseline. Take Official Practice Test 1 in Bluebook so your plan can target your real weak spots.",
  SKILL_BUILDING:
    "Build broad coverage. Work through topics steadily, log every mistake, and let spaced repetition lock in what you miss.",
  TOPIC_MASTERY:
    "Go deep on weak topics. Push into harder questions and turn shaky skills into reliable ones.",
  TIMED_PRACTICE:
    "Add time pressure. Practice in timed sets to build speed and accuracy while keeping careless mistakes low.",
  FULL_TEST:
    "Simulate test day. Take full-length practice tests on a schedule and review every miss thoroughly.",
  FINAL_REVIEW:
    "Taper and sharpen. Light, focused review of your error log and due spaced-repetition items — rest before test day.",
};

export function generateRuleBasedPlan(inputs: PlanInputs): GeneratedPlan {
  const now = inputs.now ?? new Date();
  const satDate = getSatDateById(inputs.satDateId);
  const daysLeft = satDate ? daysUntil(satDate, now) : null;
  const phase = determinePhase(daysLeft, inputs.hasDiagnostic);

  const hours = inputs.weeklyHours ?? 5;
  const intensity = inputs.planIntensity;
  const setsPerWeek = intensity === "AGGRESSIVE" ? 5 : intensity === "LIGHT" ? 2 : 3;

  const weeklyTasks: PlanTask[] = [];
  if (phase === "DIAGNOSTIC") {
    weeklyTasks.push({
      title: "Take Official Practice Test 1 (Bluebook)",
      description: "Sit a full timed test to establish your baseline. You can also skip and start practicing.",
      cadence: "weekly",
    });
  }
  weeklyTasks.push({
    title: `Complete ${setsPerWeek} focused practice sets`,
    description: `Aim for ~${Math.max(1, Math.round(hours / setsPerWeek))} hr each, mixing Math and Reading & Writing.`,
    cadence: "weekly",
  });

  // Target the two weakest topics explicitly.
  for (const t of inputs.weakestTopics.slice(0, 2)) {
    weeklyTasks.push({
      title: `Drill: ${t.skill}`,
      description: `Your accuracy here is ~${Math.round(t.accuracy * 100)}%. Do a targeted set and review the explanations.`,
      cadence: "weekly",
      section: t.section,
    });
  }
  if (phase === "TIMED_PRACTICE" || phase === "FULL_TEST") {
    weeklyTasks.push({
      title: "One timed section under test conditions",
      description: "Practice pacing — keep an eye on careless mistakes.",
      cadence: "weekly",
    });
  }

  const dailyTasks: PlanTask[] = [
    {
      title: "Clear today's spaced-repetition queue",
      description: "Review every due missed question and confirm you truly understand it.",
      cadence: "daily",
    },
    {
      title: "Answer 10–15 fresh questions",
      description: "Write an error log for every miss — no skipping.",
      cadence: "daily",
    },
  ];
  if (intensity === "AGGRESSIVE") {
    dailyTasks.push({
      title: "Review 3 error logs from earlier this week",
      description: "Re-derive the correct approach from memory.",
      cadence: "daily",
    });
  }

  const target = inputs.targetScore ? ` toward your ${inputs.targetScore} goal` : "";
  const timeframe = daysLeft != null ? ` You have about ${Math.max(0, daysLeft)} days until your SAT.` : "";
  const summary = `${PHASE_BLURB[phase]}${timeframe} This plan is built to maximize your chances${target} if you follow it consistently — it isn't a guarantee, but consistent, reflective practice is what moves scores.`;

  return { phase, summary, weeklyTasks, dailyTasks };
}

// ---------------------------------------------------------------------------
// Practice-test scheduling
// ---------------------------------------------------------------------------
export interface ScheduledTest {
  testLabel: string;
  scheduledFor: Date;
  kind: "DIAGNOSTIC" | "FULL";
}

/**
 * Space full-length Bluebook practice tests strategically before the SAT:
 *  - a diagnostic up front (if not yet taken),
 *  - full tests every ~2-3 weeks, getting more frequent near the end,
 *  - nothing in the final 3 days (rest).
 * Returns an empty list if there's no SAT date set.
 */
export function planPracticeTests(opts: {
  satDateId: string | null;
  hasDiagnostic: boolean;
  now?: Date;
}): ScheduledTest[] {
  const now = opts.now ?? new Date();
  const satDate = getSatDateById(opts.satDateId);
  if (!satDate) return [];
  const daysLeft = daysUntil(satDate, now);
  if (daysLeft <= 3) return [];

  const tests: ScheduledTest[] = [];
  let testNum = 1;

  if (!opts.hasDiagnostic) {
    tests.push({
      testLabel: "Official Practice Test 1 (Bluebook) — Diagnostic",
      scheduledFor: addDays(now, Math.min(7, Math.max(2, Math.floor(daysLeft * 0.05)))),
      kind: "DIAGNOSTIC",
    });
    testNum = 2;
  }

  // Place full tests from ~3 weeks out, then every 2-3 weeks, ending 3 days before.
  const lastTestOffsetFromSat = 3; // days before SAT to stop
  const finalTestDay = daysLeft - lastTestOffsetFromSat;
  let day = Math.max(21, Math.floor(daysLeft * 0.4));
  const spacing = daysLeft > 90 ? 21 : 14;
  while (day <= finalTestDay && testNum <= 6) {
    tests.push({
      testLabel: `Official Practice Test ${testNum} (Bluebook)`,
      scheduledFor: addDays(now, day),
      kind: "FULL",
    });
    testNum += 1;
    day += spacing;
  }
  return tests;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + days);
  return x;
}

export const PHASE_LABELS: Record<StudyPhase, string> = {
  DIAGNOSTIC: "Diagnostic",
  SKILL_BUILDING: "Skill Building",
  TOPIC_MASTERY: "Topic Mastery",
  TIMED_PRACTICE: "Timed Practice",
  FULL_TEST: "Full-Length Tests",
  FINAL_REVIEW: "Final Review",
};
