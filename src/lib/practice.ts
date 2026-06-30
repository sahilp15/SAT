// Practice engine: question selection, grading, mastery tracking, SRS enqueue.
// Used by the API routes. Kept free of Next.js specifics so it stays testable.

import { prisma } from "./db";
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
  difficulty: string;
  format: string;
  stimulus: string | null;
  stem: string;
  assets: string[];
  requiresCalculator: boolean;
  desmosRelevant: boolean;
  isRegression: boolean;
  choices: { label: string; content: string }[];
}

function toClientQuestion(q: {
  id: string;
  section: string;
  domain: string;
  skill: string;
  difficulty: string;
  format: string;
  stimulus: string | null;
  stem: string;
  assets: string | null;
  requiresCalculator: boolean;
  desmosRelevant: boolean;
  isRegression: boolean;
  choices: { label: string; content: string }[];
}): ClientQuestion {
  return {
    id: q.id,
    section: q.section,
    domain: q.domain,
    skill: q.skill,
    difficulty: q.difficulty,
    format: q.format,
    stimulus: q.stimulus,
    stem: q.stem,
    assets: q.assets ? (JSON.parse(q.assets) as string[]) : [],
    requiresCalculator: q.requiresCalculator,
    desmosRelevant: q.desmosRelevant,
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
function toNumber(s: string): number | null {
  const t = s.trim().replace(/\s/g, "");
  if (/^-?\d+(\.\d+)?$/.test(t)) return parseFloat(t);
  const frac = t.match(/^(-?\d+)\/(\d+)$/);
  if (frac) {
    const d = parseInt(frac[2], 10);
    if (d !== 0) return parseInt(frac[1], 10) / d;
  }
  return null;
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
  }
): Promise<GradeResult> {
  const question = await prisma.question.findUniqueOrThrow({
    where: { id: input.questionId },
    include: { choices: { orderBy: { label: "asc" } } },
  });

  const isCorrect =
    question.format === "SPR"
      ? gradeSpr(input.chosenAnswer, question.correctAnswer)
      : input.chosenAnswer.trim().toUpperCase() === question.correctAnswer.trim().toUpperCase();

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
    },
  });

  await updateTopicMastery(userId, question, isCorrect);

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

async function updateTopicMastery(
  userId: string,
  question: { section: string; domain: string; skill: string },
  isCorrect: boolean
) {
  const key = {
    userId_section_domain_skill: {
      userId,
      section: question.section,
      domain: question.domain,
      skill: question.skill,
    },
  };
  const existing = await prisma.topicMastery.findUnique({ where: key });
  const attempts = (existing?.attempts ?? 0) + 1;
  const correct = (existing?.correct ?? 0) + (isCorrect ? 1 : 0);
  const accuracy = correct / attempts;
  await prisma.topicMastery.upsert({
    where: key,
    create: {
      userId,
      section: question.section,
      domain: question.domain,
      skill: question.skill,
      attempts,
      correct,
      accuracy,
      prevAccuracy: accuracy,
      lastAttemptAt: new Date(),
    },
    update: {
      attempts,
      correct,
      prevAccuracy: existing?.accuracy ?? accuracy,
      accuracy,
      lastAttemptAt: new Date(),
    },
  });
}
