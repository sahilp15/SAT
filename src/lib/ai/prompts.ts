// Prompt construction.
//
// Two rules run through every prompt here:
//
//  1. The official explanation shipped with a question is ground truth. The
//     model may rephrase, teach around it, or diagnose the student's reasoning,
//     but it must never contradict it or change the correct answer.
//
//  2. Nothing the model produces may be presented as an official College Board
//     question or claim. Generated questions are explicitly labelled as
//     practice material written in the SAT's style.
//
// Only study data is sent — never a name, email, or any other identifier.

import type { ChatMessage } from "./client";

const GUARDRAILS = `You are an expert SAT tutor working inside a student's private study app.

Hard rules:
- The official explanation provided with a question is authoritative. Never contradict it and never change the stated correct answer.
- Never claim that anything you write is an official College Board question, statistic, or policy. If you generate a question, it is SAT-style practice material you wrote.
- Never guarantee a score. You may be ambitious and motivating, but be honest about uncertainty.
- Be concrete and specific to the question and student in front of you. Generic advice ("read carefully", "practice more") is a failure.
- Keep mathematical notation readable in plain text or simple LaTeX between $ signs.`;

function system(extra: string): ChatMessage {
  return { role: "system", content: `${GUARDRAILS}\n\n${extra}` };
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

// ---------------------------------------------------------------------------
// Error-log reflection review
// ---------------------------------------------------------------------------

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
  return [
    system(`You are reviewing the QUALITY of a student's written reflection on a question they missed — you are not re-grading the question.

Decide whether they genuinely understood the mistake. Be warm in tone but do not approve vague, lazy, or factually wrong reflections. A strong reflection is specific to THIS question, correctly identifies why the right answer is right and why theirs was wrong, and commits to a concrete change.

Score three rubric dimensions 0-5 and approve only when specificity >= 3 AND accuracy >= 3 AND understanding >= 3. If the verdict is NEEDS_REVISION, say exactly what to fix.`),
    {
      role: "user",
      content: `QUESTION
Section: ${ctx.section} | Domain: ${ctx.domain} | Skill: ${ctx.skill} | Difficulty: ${ctx.difficulty}
${truncate(ctx.stem, 1200)}
Correct answer: ${ctx.correctAnswer}
Official explanation (ground truth): ${truncate(ctx.officialExplanation ?? "(none provided)", 1600)}

STUDENT REFLECTION
They chose: ${ctx.chosenAnswer}
Mistake type they selected: ${ctx.mistakeType}
Why they chose it: ${ctx.whyChose}
Why it was wrong: ${ctx.whyWrong}
Why the correct answer is right: ${ctx.whyCorrectRight}
What they'll do differently: ${ctx.whatDifferent}
Confidence now: ${ctx.confidenceAfter}`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Mistake analysis
// ---------------------------------------------------------------------------

export interface MistakeContext {
  section: string;
  domain: string;
  skill: string;
  subskill: string | null;
  difficulty: string;
  format: string;
  stem: string;
  choices: { label: string; content: string }[];
  correctAnswer: string;
  officialExplanation: string | null;
  chosenAnswer: string | null;
  timeSpentSec: number;
  recommendedSec: number;
  answerChanges: number;
  priorAccuracyOnSkill: number | null;
  priorAttemptsOnSkill: number;
  heuristicCategory: string;
}

export function mistakeAnalysisMessages(ctx: MistakeContext): ChatMessage[] {
  return [
    system(`Diagnose WHY this specific student missed this specific question, then teach the fix in a few sentences.

Use all the evidence, not just the correct answer: which distractor they chose and what mistaken reasoning would lead there, how long they spent versus the target, how often they changed their answer, and how they have done on this skill before. A local heuristic classifier has already proposed a category — agree with it or override it, whichever the evidence supports.

Write "whyCorrect" so it is consistent with the official explanation. Keep every field tight; the student reads this between practice sets.`),
    {
      role: "user",
      content: `QUESTION (${ctx.difficulty}, ${ctx.format})
Section: ${ctx.section} | Domain: ${ctx.domain} | Skill: ${ctx.skill}${ctx.subskill ? ` | Subskill: ${ctx.subskill}` : ""}
${truncate(ctx.stem, 1400)}
${ctx.choices.map((c) => `${c.label}) ${truncate(c.content, 200)}`).join("\n")}
Correct answer: ${ctx.correctAnswer}
Official explanation (ground truth): ${truncate(ctx.officialExplanation ?? "(none)", 1600)}

STUDENT EVIDENCE
Chose: ${ctx.chosenAnswer ?? "(left blank)"}
Time spent: ${ctx.timeSpentSec}s against a ${ctx.recommendedSec}s target
Answer changes before submitting: ${ctx.answerChanges}
History on this skill: ${
        ctx.priorAttemptsOnSkill > 0
          ? `${Math.round((ctx.priorAccuracyOnSkill ?? 0) * 100)}% across ${ctx.priorAttemptsOnSkill} prior attempts`
          : "no prior attempts"
      }
Heuristic classifier suggested: ${ctx.heuristicCategory}`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Tutor
// ---------------------------------------------------------------------------

export type TutorMode =
  | "TEACH"
  | "HINT"
  | "CHECK"
  | "SIMILAR"
  | "EXPLAIN_MISTAKE"
  | "QUIZ"
  | "PLAN";

export const TUTOR_MODES: { value: TutorMode; label: string; blurb: string }[] = [
  { value: "TEACH", label: "Teach me", blurb: "Build the concept from the ground up" },
  { value: "HINT", label: "Give me a hint", blurb: "One nudge, no answer" },
  { value: "CHECK", label: "Check my reasoning", blurb: "Find the first wrong step" },
  { value: "SIMILAR", label: "Generate a similar question", blurb: "New practice item, same skill" },
  { value: "EXPLAIN_MISTAKE", label: "Explain my mistake", blurb: "Why my answer failed" },
  { value: "QUIZ", label: "Quiz me", blurb: "Drill a weak skill, one at a time" },
  { value: "PLAN", label: "Plan my day", blurb: "What to do with the time I have" },
];

export const TUTOR_MODE_INSTRUCTIONS: Record<TutorMode, string> = {
  TEACH:
    "Teach the underlying concept from the ground up. Build to the answer with worked steps, and end by naming the pattern so it transfers to other questions.",
  HINT: "Give ONE hint that unlocks the next step. Do not reveal the answer, do not work the whole problem, and do not name the correct choice. Stop after the hint.",
  CHECK:
    "The student will describe their reasoning. Check it step by step, name the first step that goes wrong (if any), and confirm what they got right before correcting.",
  SIMILAR:
    "Write ONE new SAT-style practice question testing the same skill at a similar difficulty, and fill in generatedQuestion. State clearly in the reply that you wrote it — it is not an official College Board question. Include four plausible distractors and a complete explanation.",
  EXPLAIN_MISTAKE:
    "Explain why the student's chosen answer is wrong and why the correct one works, using the official explanation as ground truth. Name the trap in the distractor they picked.",
  QUIZ: "Quiz the student on the weak skill provided. Ask ONE question at a time, wait for their answer, then give feedback before the next one.",
  PLAN: "Help the student plan today's study session using their available time, current weaknesses, and how far away the test is. Be concrete about what to do and in what order.",
};

export interface TutorProfile {
  daysUntilTest: number | null;
  targetScore: number | null;
  predictedTotal: number | null;
  predictedMath: number | null;
  predictedRw: number | null;
  minutesPerDay: number | null;
  weakestSkills: { skill: string; mastery: number; signal: string }[];
  strongestSkills: { skill: string; mastery: number }[];
  recentMistakes: { skill: string; category: string; difficulty: string }[];
  questionsAnswered: number;
  accuracy: number;
  todayPlan: string | null;
  avgSecondsPerQuestion: number | null;
}

export interface TutorQuestionContext {
  stem: string;
  choices: { label: string; content: string }[];
  correctAnswer: string;
  officialExplanation: string | null;
  chosenAnswer: string | null;
  section: string;
  domain: string;
  skill: string;
  difficulty: string;
}

export interface TutorContext {
  mode: TutorMode;
  message: string;
  profile: TutorProfile;
  question?: TutorQuestionContext | null;
  history: { role: "user" | "assistant"; content: string }[];
}

export function tutorMessages(ctx: TutorContext): ChatMessage[] {
  const p = ctx.profile;
  const profileBlock = `STUDENT PROFILE (study data only)
Days until test: ${p.daysUntilTest ?? "unknown"} | Target: ${p.targetScore ?? "not set"} | Current estimate: ${
    p.predictedTotal
      ? `${p.predictedTotal} (Math ${p.predictedMath}, R&W ${p.predictedRw})`
      : "no diagnostic yet"
  }
Practice so far: ${p.questionsAnswered} questions at ${Math.round(p.accuracy * 100)}% accuracy${
    p.avgSecondsPerQuestion ? `, averaging ${p.avgSecondsPerQuestion}s per question` : ""
  }
Time available per study day: ${p.minutesPerDay ?? "unknown"} minutes
Weakest skills: ${
    p.weakestSkills.length
      ? p.weakestSkills.map((s) => `${s.skill} (${Math.round(s.mastery * 100)}%, ${s.signal})`).join("; ")
      : "not enough data"
  }
Strongest skills: ${
    p.strongestSkills.length
      ? p.strongestSkills.map((s) => `${s.skill} (${Math.round(s.mastery * 100)}%)`).join("; ")
      : "not enough data"
  }
Recent mistakes: ${
    p.recentMistakes.length
      ? p.recentMistakes.map((m) => `${m.skill} — ${m.category} (${m.difficulty})`).join("; ")
      : "none logged"
  }
Today's plan: ${p.todayPlan ?? "nothing scheduled"}`;

  const questionBlock = ctx.question
    ? `\n\nQUESTION IN SCOPE (${ctx.question.difficulty}, ${ctx.question.section} / ${ctx.question.skill})
${truncate(ctx.question.stem, 1400)}
${ctx.question.choices.map((c) => `${c.label}) ${truncate(c.content, 200)}`).join("\n")}
Correct answer: ${ctx.question.correctAnswer}
Student chose: ${ctx.question.chosenAnswer ?? "(not answered)"}
Official explanation (ground truth): ${truncate(ctx.question.officialExplanation ?? "(none)", 1600)}`
    : "";

  const messages: ChatMessage[] = [
    system(
      `MODE: ${ctx.mode}\n${TUTOR_MODE_INSTRUCTIONS[ctx.mode]}\n\nSet generatedQuestion to null unless the mode is SIMILAR. Offer up to three short follow-up suggestions the student could tap next.`
    ),
    { role: "user", content: `${profileBlock}${questionBlock}` },
  ];
  for (const h of ctx.history.slice(-8)) {
    messages.push({ role: h.role, content: truncate(h.content, 1500) });
  }
  messages.push({ role: "user", content: truncate(ctx.message, 2000) });
  return messages;
}

// ---------------------------------------------------------------------------
// Daily coaching
// ---------------------------------------------------------------------------

export interface CoachingContext {
  daysUntilTest: number | null;
  targetScore: number | null;
  predictedTotal: number | null;
  streakDays: number;
  todayKind: string;
  todayFocus: string[];
  weakestSkills: string[];
  recentAccuracy: number;
  questionsThisWeek: number;
}

export function dailyCoachingMessages(ctx: CoachingContext): ChatMessage[] {
  return [
    system(
      "Write a short, specific daily coaching note for the dashboard. Four fields, one or two sentences each. Reference the student's actual numbers. Motivating, never saccharine, never a score promise."
    ),
    {
      role: "user",
      content: `Days until test: ${ctx.daysUntilTest ?? "unknown"}
Target: ${ctx.targetScore ?? "not set"} | Current estimate: ${ctx.predictedTotal ?? "no diagnostic yet"}
Current streak: ${ctx.streakDays} day(s) | Questions this week: ${ctx.questionsThisWeek} | Recent accuracy: ${Math.round(ctx.recentAccuracy * 100)}%
Today is a ${ctx.todayKind} day. Planned focus: ${ctx.todayFocus.join("; ") || "open practice"}
Weakest skills right now: ${ctx.weakestSkills.join("; ") || "not enough data"}`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Skill diagnosis + plan adjustment
// ---------------------------------------------------------------------------

export interface SkillDiagnosisContext {
  skill: string;
  domain: string;
  section: string;
  mastery: number;
  signal: string;
  attempts: number;
  easy: { correct: number; total: number };
  medium: { correct: number; total: number };
  hard: { correct: number; total: number };
  avgSeconds: number | null;
  recentMistakeCategories: string[];
}

export function skillDiagnosisMessages(ctx: SkillDiagnosisContext): ChatMessage[] {
  return [
    system(
      "Diagnose what is actually going wrong with one skill and prescribe specific drills. Distinguish a conceptual gap from a procedural slip, a timing problem, or a test-strategy problem — the difficulty breakdown and timing below are the evidence."
    ),
    {
      role: "user",
      content: `Skill: ${ctx.skill} (${ctx.section} / ${ctx.domain})
Estimated mastery: ${Math.round(ctx.mastery * 100)}% across ${ctx.attempts} attempts. Local signal: ${ctx.signal}
By difficulty — easy ${ctx.easy.correct}/${ctx.easy.total}, medium ${ctx.medium.correct}/${ctx.medium.total}, hard ${ctx.hard.correct}/${ctx.hard.total}
Average time: ${ctx.avgSeconds ? `${ctx.avgSeconds}s` : "unknown"}
Recent mistake categories: ${ctx.recentMistakeCategories.join(", ") || "none recorded"}`,
    },
  ];
}

export interface PlanAdjustmentContext {
  daysUntilTest: number;
  phase: string;
  targetScore: number | null;
  predictedTotal: number | null;
  minutesPerDay: number;
  daysPerWeek: number;
  topPriorities: { skill: string; mastery: number; signal: string }[];
  recentTrend: string;
}

export function studyPlanAdjustmentMessages(ctx: PlanAdjustmentContext): ChatMessage[] {
  return [
    system(
      "Review a student's rule-based study plan and suggest at most five concrete adjustments. You cannot change the schedule directly — write what should shift and why, in language the student can act on. Respect the time they actually have."
    ),
    {
      role: "user",
      content: `Days until test: ${ctx.daysUntilTest} | Current phase: ${ctx.phase}
Target: ${ctx.targetScore ?? "not set"} | Current estimate: ${ctx.predictedTotal ?? "no diagnostic yet"}
Availability: ${ctx.daysPerWeek} days/week, ${ctx.minutesPerDay} minutes/day
Recent trend: ${ctx.recentTrend}
Top priorities: ${ctx.topPriorities.map((p) => `${p.skill} (${Math.round(p.mastery * 100)}%, ${p.signal})`).join("; ") || "none yet"}`,
    },
  ];
}
