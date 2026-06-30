// Prompt templates for the AI tutor. Kept separate so they're easy to audit and
// tune. The guiding rule everywhere: the official explanation is ground truth —
// the AI may rephrase or coach, but must never change the correct answer or
// invent unsupported explanations.

import type { ChatMessage } from "./types";

export interface ErrorLogContext {
  section: string;
  domain: string;
  skill: string;
  difficulty: string;
  stem: string;
  correctAnswer: string;
  officialExplanation: string | null;
  chosenAnswer: string;
  whyChose: string;
  whyWrong: string;
  whyCorrectRight: string;
  mistakeType: string;
  whatDifferent: string;
  confidenceAfter: string;
}

export function errorLogReviewMessages(ctx: ErrorLogContext): ChatMessage[] {
  const system = `You are a strict but encouraging SAT tutor reviewing the QUALITY of a student's error-log reflection (not re-grading the question).

Your job: decide whether the student genuinely understood their mistake. Be supportive in tone, but do NOT approve vague, lazy, generic, or factually wrong reflections. A strong reflection is specific to THIS question, correctly identifies why the right answer is right and why their answer was wrong, and states a concrete, actionable change.

Ground truth: the official explanation provided below is authoritative. If the student's reasoning contradicts it, that is an accuracy problem. Never change the correct answer.

Respond ONLY with strict JSON of the form:
{"verdict":"APPROVED"|"NEEDS_REVISION","feedback":"<2-5 sentences, warm but specific; if NEEDS_REVISION, say exactly what to fix>","rubricScores":{"specificity":0-5,"accuracy":0-5,"understanding":0-5}}

Approve only when specificity>=3 AND accuracy>=3 AND understanding>=3.`;

  const user = `QUESTION CONTEXT
Section: ${ctx.section} | Domain: ${ctx.domain} | Skill: ${ctx.skill} | Difficulty: ${ctx.difficulty}
Question: ${ctx.stem}
Correct answer: ${ctx.correctAnswer}
Official explanation (ground truth): ${ctx.officialExplanation ?? "(none provided)"}

STUDENT'S REFLECTION
They chose: ${ctx.chosenAnswer}
Mistake type they selected: ${ctx.mistakeType}
Why they chose their answer: ${ctx.whyChose}
Why their answer was wrong: ${ctx.whyWrong}
Why the correct answer is right: ${ctx.whyCorrectRight}
What they'll do differently: ${ctx.whatDifferent}
Confidence after reviewing: ${ctx.confidenceAfter}

Review the QUALITY of this reflection and respond with the JSON described.`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export interface StudyPlanContext {
  grade: number | null;
  daysUntilSat: number | null;
  targetScore: number | null;
  lastTotalScore: number | null;
  lastMathScore: number | null;
  lastRwScore: number | null;
  weeklyHours: number | null;
  strongerSection: string | null;
  planIntensity: string;
  hasDiagnostic: boolean;
  weakestTopics: string[];
}

export function studyPlanMessages(ctx: StudyPlanContext): ChatMessage[] {
  const system = `You are an expert SAT coach building a realistic, motivating study plan. Do NOT guarantee any score. Frame the plan as maximizing the student's chances if followed consistently. Be concrete and time-aware.

Respond ONLY with strict JSON:
{"summary":"<2-4 sentence overview, realistic and encouraging>","phase":"DIAGNOSTIC|SKILL_BUILDING|TOPIC_MASTERY|TIMED_PRACTICE|FULL_TEST|FINAL_REVIEW","weeklyTasks":[{"title":"...","description":"...","section":"MATH|READING_WRITING|null"}],"dailyTasks":[{"title":"...","description":"..."}]}

Keep weeklyTasks to 3-6 items and dailyTasks to 2-4 items, sized to the student's weekly hours.`;

  const user = `STUDENT
Grade: ${ctx.grade ?? "?"} | Days until SAT: ${ctx.daysUntilSat ?? "unknown"} | Target: ${ctx.targetScore ?? "?"}
Last scores — total: ${ctx.lastTotalScore ?? "n/a"}, Math: ${ctx.lastMathScore ?? "n/a"}, R&W: ${ctx.lastRwScore ?? "n/a"}
Weekly study hours: ${ctx.weeklyHours ?? "?"} | Stronger section: ${ctx.strongerSection ?? "?"} | Intensity: ${ctx.planIntensity}
Has taken a diagnostic: ${ctx.hasDiagnostic ? "yes" : "no"}
Weakest topics so far: ${ctx.weakestTopics.length ? ctx.weakestTopics.join(", ") : "no in-app data yet"}

Build the plan as JSON.`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
