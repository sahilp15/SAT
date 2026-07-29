// Practice engine: question selection, grading, mastery tracking, SRS enqueue.
// Used by the API routes. Kept free of Next.js specifics so it stays testable.

import { prisma } from "./db";
import { analyzeMistake, type MistakeSignals } from "./diagnostic/mistakes";
import { FORMS, allSlots } from "./diagnostic/form";
import { updateSkillMastery } from "./mastery";
import type { Difficulty, Section } from "./taxonomy";
import {
  computeNextReview,
  initialSrsState,
  nextDueDate,
  type Confidence,
} from "./srs";

export interface SelectOptions {
  section?: "MATH" | "READING_WRITING";
  mode?: string; // practice | timed | srs | missed | mixed | diagnostic
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  skill?: string;
  domain?: string;
  calculator?: "desmos" | "non-desmos";
  regression?: boolean;
}

/** Client-safe question shape — never includes which choice is correct. */
export interface ClientQuestion {
  id: string;
  section: string;
  domain: string;
  skill: string;
  subskill: string | null;
  difficulty: string;
  format: string;
  stimulus: string | null;
  stem: string;
  assets: string[];
  requiresCalculator: boolean;
  desmosRelevant: boolean;
  calculatorAppropriate: boolean;
  timeRecommendationSec: number | null;
  isRegression: boolean;
  choices: { label: string; content: string }[];
}

/**
 * Questions belonging to diagnostics the student hasn't finished yet are held
 * back from practice, so a score estimate is never contaminated by having drilled
 * its exact items the day before.
 *
 * Only *pending* forms are excluded. Once a diagnostic is submitted its questions
 * rejoin the practice pool, which is the right outcome — re-meeting a question
 * you just got wrong is spaced review, not a leak. With 18 forms that keeps
 * roughly half the bank available immediately and opens the rest as you go.
 */
async function pendingDiagnosticExclusion(userId: string): Promise<Record<string, unknown>> {
  const submitted = await prisma.diagnosticSession.findMany({
    where: { userId, status: "SUBMITTED" },
    select: { formId: true },
    distinct: ["formId"],
  });
  const done = new Set(submitted.map((s) => s.formId));
  const pending = FORMS.filter((f) => !done.has(f.id));
  if (pending.length === 0) return {};

  const reserved = new Set(pending.flatMap((f) => allSlots(f).map((s) => s.externalId)));
  return { externalId: { notIn: [...reserved] } };
}

export interface QuestionRow {
  id: string;
  section: string;
  domain: string;
  skill: string;
  subskill: string | null;
  difficulty: string;
  format: string;
  stimulus: string | null;
  stem: string;
  assets: string | null;
  requiresCalculator: boolean;
  desmosRelevant: boolean;
  calculatorAppropriate: boolean;
  timeRecommendationSec: number | null;
  isRegression: boolean;
  choices: { label: string; content: string }[];
}

/** Strip everything the client must not see (correct answer, rationales). */
export function toClientQuestion(q: QuestionRow): ClientQuestion {
  let assets: string[] = [];
  if (q.assets) {
    try {
      const parsed: unknown = JSON.parse(q.assets);
      if (Array.isArray(parsed)) assets = parsed.filter((a): a is string => typeof a === "string");
    } catch {
      assets = [];
    }
  }
  return {
    id: q.id,
    section: q.section,
    domain: q.domain,
    skill: q.skill,
    subskill: q.subskill,
    difficulty: q.difficulty,
    format: q.format,
    stimulus: q.stimulus,
    stem: q.stem,
    assets,
    requiresCalculator: q.requiresCalculator,
    desmosRelevant: q.desmosRelevant,
    calculatorAppropriate: q.calculatorAppropriate,
    timeRecommendationSec: q.timeRecommendationSec,
    isRegression: q.isRegression,
    choices: q.choices.map((c) => ({ label: c.label, content: c.content })),
  };
}

const choiceSelect = {
  select: { label: true, content: true },
  orderBy: { label: "asc" as const },
};

/**
 * Pick the next question for a practice session. Excludes Bluebook-reserved and
 * NEEDS_REVIEW items from normal practice. SRS/missed modes pull from the queue.
 */
export async function getNextQuestion(
  userId: string,
  opts: SelectOptions
): Promise<ClientQuestion | null> {
  const now = new Date();

  // SRS / missed modes draw from the spaced-repetition queue.
  if (opts.mode === "srs" || opts.mode === "missed") {
    const srs = await prisma.srsItem.findFirst({
      where: {
        userId,
        active: true,
        ...(opts.mode === "srs" ? { dueDate: { lte: now } } : {}),
      },
      orderBy: { dueDate: "asc" },
      include: { question: { include: { choices: choiceSelect } } },
    });
    return srs ? toClientQuestion(srs.question) : null;
  }

  const where: Record<string, unknown> = {
    isBluebook: false,
    reviewStatus: "OK",
    ...(await pendingDiagnosticExclusion(userId)),
  };
  if (opts.section) where.section = opts.section;
  if (opts.difficulty) where.difficulty = opts.difficulty;
  if (opts.skill) where.skill = opts.skill;
  if (opts.domain) where.domain = opts.domain;
  if (opts.regression) where.isRegression = true;
  if (opts.calculator === "desmos") where.desmosRelevant = true;
  if (opts.calculator === "non-desmos") where.desmosRelevant = false;

  // Prefer questions the user hasn't attempted yet; fall back to any match.
  const attempted = await prisma.questionAttempt.findMany({
    where: { userId, question: where as never },
    select: { questionId: true },
    distinct: ["questionId"],
  });
  const attemptedIds = attempted.map((a) => a.questionId);

  const unattemptedWhere: Record<string, unknown> = { ...where, id: { notIn: attemptedIds } };
  let pool: Record<string, unknown> = unattemptedWhere;
  let count = await prisma.question.count({ where: unattemptedWhere as never });
  if (count === 0) {
    pool = where;
    count = await prisma.question.count({ where: where as never });
  }
  if (count === 0) return null;

  const skip = Math.floor(Math.random() * count);
  const q = await prisma.question.findFirst({
    where: pool as never,
    skip,
    include: { choices: choiceSelect },
  });
  return q ? toClientQuestion(q) : null;
}

/**
 * Build a fixed-length practice set for one skill — what a "Start this practice
 * set" button on a recommendation opens. Unseen questions come first, then
 * previously-missed ones, then anything else that matches.
 */
export async function getPracticeSet(
  userId: string,
  opts: { section?: string; skill?: string; domain?: string; difficulty?: string; count: number }
): Promise<ClientQuestion[]> {
  const where: Record<string, unknown> = {
    isBluebook: false,
    reviewStatus: "OK",
    ...(await pendingDiagnosticExclusion(userId)),
  };
  if (opts.section) where.section = opts.section;
  if (opts.skill) where.skill = opts.skill;
  if (opts.domain) where.domain = opts.domain;
  if (opts.difficulty) where.difficulty = opts.difficulty;

  const count = Math.max(1, Math.min(40, opts.count));

  const attempted = await prisma.questionAttempt.findMany({
    where: { userId },
    select: { questionId: true, isCorrect: true },
    distinct: ["questionId"],
  });
  const seen = new Set(attempted.map((a) => a.questionId));
  const missed = new Set(attempted.filter((a) => !a.isCorrect).map((a) => a.questionId));

  const pool = await prisma.question.findMany({
    where: where as never,
    include: { choices: choiceSelect },
    take: 200,
  });

  const rank = (q: { id: string }) => (seen.has(q.id) ? (missed.has(q.id) ? 1 : 2) : 0);
  return pool
    .sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id))
    .slice(0, count)
    .map(toClientQuestion);
}

export interface GradeResult {
  attemptId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string | null;
  requiresErrorLog: boolean;
  choices: {
    label: string;
    content: string;
    isCorrect: boolean;
    rationaleWrong: string | null;
  }[];
}

/** Normalize an SPR answer to a comparable numeric value (handles fractions). */
export function toNumber(s: string): number | null {
  const t = s.trim().replace(/\s/g, "");
  if (/^-?\d+(\.\d+)?$/.test(t)) return parseFloat(t);
  const frac = t.match(/^(-?\d+)\/(\d+)$/);
  if (frac) {
    const d = parseInt(frac[2], 10);
    if (d !== 0) return parseInt(frac[1], 10) / d;
  }
  return null;
}

/**
 * Grade one answer. Shared by practice, spaced repetition, and the diagnostic so
 * there is exactly one definition of "correct" in the app.
 */
export function gradeAnswer(
  question: { format: string; correctAnswer: string },
  chosenAnswer: string | null | undefined
): boolean {
  if (chosenAnswer == null || chosenAnswer.trim() === "") return false;
  return question.format === "SPR"
    ? gradeSpr(chosenAnswer, question.correctAnswer)
    : chosenAnswer.trim().toUpperCase() === question.correctAnswer.trim().toUpperCase();
}

/** SPR grading: the stored correctAnswer may list several accepted forms. */
function gradeSpr(chosen: string, accepted: string): boolean {
  const candidates = accepted.split(",").map((s) => s.trim()).filter(Boolean);
  const chosenTrim = chosen.trim();
  for (const cand of candidates) {
    if (chosenTrim === cand) return true;
    const a = toNumber(chosenTrim);
    const b = toNumber(cand);
    if (a !== null && b !== null && Math.abs(a - b) < 0.001) return true;
  }
  return false;
}

export async function recordAttempt(
  userId: string,
  input: {
    questionId: string;
    chosenAnswer: string;
    mode?: string;
    confidence?: Confidence | null;
    timeMs?: number;
    isReview?: boolean;
    flagged?: boolean;
    answerChanges?: number;
  }
): Promise<GradeResult> {
  const question = await prisma.question.findUniqueOrThrow({
    where: { id: input.questionId },
    include: { choices: { orderBy: { label: "asc" } } },
  });

  const isCorrect = gradeAnswer(question, input.chosenAnswer);

  const attempt = await prisma.questionAttempt.create({
    data: {
      userId,
      questionId: question.id,
      chosenAnswer: input.chosenAnswer,
      isCorrect,
      mode: input.mode ?? "practice",
      confidence: input.confidence ?? null,
      timeMs: input.timeMs ?? null,
      isReview: input.isReview ?? false,
      flagged: input.flagged ?? false,
      answerChanges: input.answerChanges ?? 0,
    },
  });

  await updateSkillMastery({
    userId,
    section: question.section,
    domain: question.domain,
    skill: question.skill,
    difficulty: question.difficulty,
    isCorrect,
    timeMs: input.timeMs ?? null,
    recommendedSec: question.timeRecommendationSec,
  });

  // Record why it was missed so the error log has an answer immediately, with
  // no dependency on the AI layer being available.
  if (!isCorrect) {
    await saveHeuristicDiagnosis({
      userId,
      attemptId: attempt.id,
      question,
      chosenAnswer: input.chosenAnswer,
      timeMs: input.timeMs ?? 0,
      answerChanges: input.answerChanges ?? 0,
      flagged: input.flagged ?? false,
    });
  }

  // Spaced repetition.
  let requiresErrorLog = !isCorrect;
  if (input.isReview) {
    // Reviewing an existing SRS item: advance/shorten using the scheduler.
    const item = await prisma.srsItem.findUnique({
      where: { userId_questionId: { userId, questionId: question.id } },
    });
    if (item) {
      const outcome = computeNextReview({
        intervalIndex: item.intervalIndex,
        consecutiveCorrect: item.consecutiveCorrect,
        lapses: item.lapses,
        active: item.active,
        result: isCorrect ? "CORRECT" : "INCORRECT",
        confidence: input.confidence ?? null,
      });
      await prisma.srsItem.update({
        where: { id: item.id },
        data: {
          intervalIndex: outcome.intervalIndex,
          consecutiveCorrect: outcome.consecutiveCorrect,
          lapses: outcome.lapses,
          active: outcome.active,
          lastResult: isCorrect ? "CORRECT" : "INCORRECT",
          dueDate: nextDueDate(new Date(), outcome),
        },
      });
      requiresErrorLog = outcome.requiresErrorLog;
    }
  } else if (!isCorrect) {
    // Fresh miss -> enqueue into SRS (or reset an existing item).
    const init = initialSrsState();
    await prisma.srsItem.upsert({
      where: { userId_questionId: { userId, questionId: question.id } },
      create: {
        userId,
        questionId: question.id,
        intervalIndex: init.intervalIndex,
        consecutiveCorrect: 0,
        lapses: 0,
        active: true,
        lastResult: "INCORRECT",
        dueDate: new Date(),
      },
      update: {
        intervalIndex: 0,
        consecutiveCorrect: 0,
        active: true,
        lastResult: "INCORRECT",
        lapses: { increment: 1 },
        dueDate: new Date(),
      },
    });
  }

  return {
    attemptId: attempt.id,
    isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    requiresErrorLog,
    choices: question.choices.map((c) => ({
      label: c.label,
      content: c.content,
      isCorrect: c.isCorrect,
      rationaleWrong: c.rationaleWrong,
    })),
  };
}

export interface DiagnosisQuestion {
  id: string;
  section: string;
  domain: string;
  skill: string;
  subskill: string | null;
  difficulty: string;
  format: string;
  correctAnswer: string;
  explanation: string | null;
  timeRecommendationSec: number | null;
}

/**
 * Classify why a question was missed and store it. Runs on every miss, in
 * practice and in the diagnostic, using only local heuristics — the AI route
 * can later replace this row with a richer analysis.
 */
export async function saveHeuristicDiagnosis(input: {
  userId: string;
  attemptId: string;
  question: DiagnosisQuestion;
  chosenAnswer: string | null;
  timeMs: number;
  answerChanges: number;
  flagged: boolean;
  nearSectionEnd?: boolean;
}) {
  const { question } = input;

  const priorMastery = await prisma.topicMastery.findUnique({
    where: {
      userId_section_domain_skill: {
        userId: input.userId,
        section: question.section,
        domain: question.domain,
        skill: question.skill,
      },
    },
    select: { accuracy: true, attempts: true },
  });

  const signals: MistakeSignals = {
    section: question.section as Section,
    domain: question.domain,
    skill: question.skill,
    subskill: question.subskill,
    difficulty: question.difficulty as Difficulty,
    format: question.format === "SPR" ? "SPR" : "MCQ",
    chosenAnswer: input.chosenAnswer,
    correctAnswer: question.correctAnswer,
    timeMs: input.timeMs,
    recommendedSec: question.timeRecommendationSec ?? 90,
    answerChanges: input.answerChanges,
    flagged: input.flagged,
    priorSkillAccuracy: priorMastery?.accuracy ?? null,
    priorSkillAttempts: priorMastery?.attempts ?? 0,
    nearSectionEnd: input.nearSectionEnd,
  };

  const analysis = analyzeMistake(signals, question.explanation);

  await prisma.mistakeDiagnosis.upsert({
    where: { attemptId: input.attemptId },
    create: {
      userId: input.userId,
      attemptId: input.attemptId,
      category: analysis.category,
      confidence: analysis.confidence,
      testing: analysis.testing,
      whyWrong: analysis.whyWrong,
      whyCorrect: analysis.whyCorrect,
      lesson: analysis.lesson,
      nextStep: analysis.nextStep,
      similarJson: JSON.stringify(analysis.similar),
      source: "heuristic",
    },
    update: {
      category: analysis.category,
      confidence: analysis.confidence,
      testing: analysis.testing,
      whyWrong: analysis.whyWrong,
      whyCorrect: analysis.whyCorrect,
      lesson: analysis.lesson,
      nextStep: analysis.nextStep,
      similarJson: JSON.stringify(analysis.similar),
      source: "heuristic",
    },
  });

  return analysis;
}
