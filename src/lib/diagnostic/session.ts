// Diagnostic session orchestration: start, autosave, route, submit.
//
// Everything a student does during the predictor is persisted server-side on
// every answer, so closing the tab, refreshing, or switching devices never loses
// progress. The correct answers never leave the server until the whole thing is
// submitted — that is what makes it a measurement rather than a quiz.

import "server-only";
import { prisma } from "../db";
import {
  gradeAnswer,
  saveHeuristicDiagnosis,
  toClientQuestion,
  type ClientQuestion,
} from "../practice";
import { updateSkillMastery } from "../mastery";
import { regenerateRecommendations } from "../recommendations";
import { initialSrsState } from "../srs";
import type { Difficulty, Section } from "../taxonomy";
import {
  DIAGNOSTIC_FORM,
  QUESTIONS_PER_SECTION,
  QUESTIONS_PER_STAGE,
  SECTION_ORDER,
  TOTAL_QUESTIONS,
  routingSlots,
  trackSlots,
  type DiagnosticSlot,
  type DiagnosticStage,
  type DiagnosticTrack,
} from "./form";
import { decideTrack, type RoutingResponse } from "./routing";
import { scoreDiagnostic, type ScoredResponse } from "./scoring";

/** One position in the 20-question form as persisted in `formJson`. */
export interface FormEntry {
  index: number;
  section: Section;
  stage: DiagnosticStage;
  /** null until the section's adaptive track has been decided. */
  questionId: string | null;
  externalId: string | null;
  difficulty: Difficulty | null;
}

export interface DiagnosticBlock {
  section: Section;
  stage: DiagnosticStage;
  /** Inclusive form indices covered by this block. */
  start: number;
  end: number;
}

/**
 * The form is four locked blocks of five. Back-navigation is allowed inside a
 * block but not across one: letting a student revise routing answers after
 * seeing the adaptive set would break the measurement.
 */
export const BLOCKS: DiagnosticBlock[] = SECTION_ORDER.flatMap((section, s) => [
  {
    section,
    stage: "ROUTING" as const,
    start: s * QUESTIONS_PER_SECTION,
    end: s * QUESTIONS_PER_SECTION + QUESTIONS_PER_STAGE - 1,
  },
  {
    section,
    stage: "ADAPTIVE" as const,
    start: s * QUESTIONS_PER_SECTION + QUESTIONS_PER_STAGE,
    end: s * QUESTIONS_PER_SECTION + QUESTIONS_PER_SECTION - 1,
  },
]);

export function blockForIndex(index: number): DiagnosticBlock {
  return BLOCKS.find((b) => index >= b.start && index <= b.end) ?? BLOCKS[BLOCKS.length - 1];
}

function parseForm(json: string): FormEntry[] {
  try {
    const parsed: unknown = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed as FormEntry[];
  } catch {
    /* fall through */
  }
  return [];
}

async function resolveSlots(slots: DiagnosticSlot[]): Promise<Map<string, string>> {
  const rows = await prisma.question.findMany({
    where: { externalId: { in: slots.map((s) => s.externalId) } },
    select: { id: true, externalId: true },
  });
  const map = new Map<string, string>();
  for (const r of rows) if (r.externalId) map.set(r.externalId, r.id);
  return map;
}

/** Build the initial 20-entry form with routing questions resolved. */
async function buildInitialForm(): Promise<FormEntry[]> {
  const routing = SECTION_ORDER.flatMap((section) => routingSlots(section));
  const ids = await resolveSlots(routing);

  const missing = routing.filter((s) => !ids.has(s.externalId));
  if (missing.length) {
    throw new DiagnosticUnavailableError(
      `The diagnostic question set is not loaded (${missing.length} of ${routing.length} routing questions missing). Run "npm run db:seed".`
    );
  }

  const entries: FormEntry[] = [];
  SECTION_ORDER.forEach((section, s) => {
    const base = s * QUESTIONS_PER_STAGE * 2;
    routingSlots(section).forEach((slot, i) => {
      entries.push({
        index: base + i,
        section,
        stage: "ROUTING",
        questionId: ids.get(slot.externalId) ?? null,
        externalId: slot.externalId,
        difficulty: slot.difficulty,
      });
    });
    for (let i = 0; i < QUESTIONS_PER_STAGE; i += 1) {
      entries.push({
        index: base + QUESTIONS_PER_STAGE + i,
        section,
        stage: "ADAPTIVE",
        questionId: null,
        externalId: null,
        difficulty: null,
      });
    }
  });
  return entries.sort((a, b) => a.index - b.index);
}

export class DiagnosticUnavailableError extends Error {}

/** Thrown when a session id doesn't exist or belongs to someone else. */
export class DiagnosticNotFoundError extends Error {}

export async function getActiveSession(userId: string) {
  return prisma.diagnosticSession.findFirst({
    where: { userId, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
    include: { responses: true },
  });
}

/** Resume the in-progress session, or start a fresh one. */
export async function startOrResumeSession(userId: string) {
  const existing = await getActiveSession(userId);
  if (existing) return existing;

  const form = await buildInitialForm();
  const session = await prisma.diagnosticSession.create({
    data: { userId, formJson: JSON.stringify(form) },
    include: { responses: true },
  });
  await prisma.studentProfile.updateMany({
    where: { userId },
    data: { diagnosticChoice: "TAKE_NOW" },
  });
  return session;
}

/** Discard an in-progress session so the student can start over. */
export async function abandonSession(userId: string, sessionId: string) {
  await prisma.diagnosticSession.updateMany({
    where: { id: sessionId, userId, status: "IN_PROGRESS" },
    data: { status: "ABANDONED" },
  });
}

export interface ClientDiagnosticQuestion extends ClientQuestion {
  index: number;
  stage: DiagnosticStage;
}

export interface ClientResponse {
  questionId: string;
  chosenAnswer: string | null;
  flagged: boolean;
  timeMs: number;
  answerChanges: number;
  visits: number;
}

export interface DiagnosticState {
  sessionId: string;
  status: string;
  currentIndex: number;
  totalQuestions: number;
  questionsPerStage: number;
  /** Only the questions the student is allowed to see so far. */
  questions: ClientDiagnosticQuestion[];
  responses: ClientResponse[];
  blocks: DiagnosticBlock[];
  /** Index of the first question in a block that has not been locked yet. */
  unlockedThrough: number;
  mathTrack: DiagnosticTrack | null;
  rwTrack: DiagnosticTrack | null;
  startedAt: string;
}

/**
 * Client-safe snapshot. Questions beyond the current block are withheld so the
 * adaptive set cannot be inspected before routing is decided.
 */
export async function getSessionState(
  userId: string,
  sessionId: string
): Promise<DiagnosticState | null> {
  const session = await prisma.diagnosticSession.findFirst({
    where: { id: sessionId, userId },
    include: { responses: true },
  });
  if (!session) return null;

  const form = parseForm(session.formJson);
  const block = blockForIndex(session.currentIndex);
  const visibleIds = form
    .filter((e) => e.index <= block.end && e.questionId)
    .map((e) => e.questionId as string);

  const rows = await prisma.question.findMany({
    where: { id: { in: visibleIds } },
    include: { choices: { select: { label: true, content: true }, orderBy: { label: "asc" } } },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));

  const questions: ClientDiagnosticQuestion[] = form
    .filter((e) => e.questionId && byId.has(e.questionId))
    .map((e) => ({
      ...toClientQuestion(byId.get(e.questionId as string)!),
      index: e.index,
      stage: e.stage,
    }));

  return {
    sessionId: session.id,
    status: session.status,
    currentIndex: session.currentIndex,
    totalQuestions: TOTAL_QUESTIONS,
    questionsPerStage: QUESTIONS_PER_STAGE,
    questions,
    responses: session.responses.map((r) => ({
      questionId: r.questionId,
      chosenAnswer: r.chosenAnswer,
      flagged: r.flagged,
      timeMs: r.timeMs,
      answerChanges: r.answerChanges,
      visits: r.visits,
    })),
    blocks: BLOCKS,
    unlockedThrough: block.end,
    mathTrack: (session.mathTrack as DiagnosticTrack | null) ?? null,
    rwTrack: (session.rwTrack as DiagnosticTrack | null) ?? null,
    startedAt: session.startedAt.toISOString(),
  };
}

export interface SaveResponseInput {
  questionId: string;
  chosenAnswer: string | null;
  flagged: boolean;
  /** Additional dwell time in ms since the last save for this question. */
  timeDeltaMs: number;
  answerChanges: number;
  currentIndex: number;
}

/**
 * Autosave a single response. Correctness is computed and stored server-side but
 * never returned — the student must not learn the answer mid-test.
 */
export async function saveResponse(userId: string, sessionId: string, input: SaveResponseInput) {
  const session = await prisma.diagnosticSession.findFirst({
    where: { id: sessionId, userId, status: "IN_PROGRESS" },
  });
  if (!session) return { ok: false as const, reason: "NOT_FOUND" as const };

  const form = parseForm(session.formJson);
  const entry = form.find((e) => e.questionId === input.questionId);
  if (!entry) return { ok: false as const, reason: "NOT_IN_FORM" as const };

  // A question in an already-locked block can no longer be changed.
  const currentBlock = blockForIndex(session.currentIndex);
  if (entry.index < currentBlock.start) {
    return { ok: false as const, reason: "LOCKED" as const };
  }

  const question = await prisma.question.findUnique({
    where: { id: input.questionId },
    select: { format: true, correctAnswer: true },
  });
  if (!question) return { ok: false as const, reason: "NOT_FOUND" as const };

  const answered = input.chosenAnswer != null && input.chosenAnswer.trim() !== "";
  const isCorrect = answered ? gradeAnswer(question, input.chosenAnswer) : null;

  const existing = await prisma.diagnosticResponse.findUnique({
    where: { sessionId_questionId: { sessionId, questionId: input.questionId } },
  });

  await prisma.diagnosticResponse.upsert({
    where: { sessionId_questionId: { sessionId, questionId: input.questionId } },
    create: {
      sessionId,
      questionId: input.questionId,
      orderIndex: entry.index,
      section: entry.section,
      stage: entry.stage,
      chosenAnswer: answered ? input.chosenAnswer : null,
      isCorrect,
      timeMs: Math.max(0, input.timeDeltaMs),
      visits: 1,
      answerChanges: input.answerChanges,
      flagged: input.flagged,
      answeredAt: answered ? new Date() : null,
    },
    update: {
      chosenAnswer: answered ? input.chosenAnswer : null,
      isCorrect,
      timeMs: { increment: Math.max(0, input.timeDeltaMs) },
      visits: { increment: 1 },
      answerChanges: Math.max(existing?.answerChanges ?? 0, input.answerChanges),
      flagged: input.flagged,
      answeredAt: answered ? new Date() : existing?.answeredAt ?? null,
    },
  });

  const nextIndex = Math.max(0, Math.min(TOTAL_QUESTIONS - 1, input.currentIndex));
  if (nextIndex !== session.currentIndex) {
    await prisma.diagnosticSession.update({
      where: { id: sessionId },
      data: { currentIndex: nextIndex },
    });
  }

  return { ok: true as const };
}

export interface AdvanceResult {
  ok: boolean;
  track?: DiagnosticTrack;
  reason?: string;
  nextIndex?: number;
  completed?: boolean;
}

/**
 * Lock the current block and move on. When the block was a routing stage, this
 * is where the adaptive track is decided and its five questions get written into
 * the form.
 */
export async function advanceBlock(userId: string, sessionId: string): Promise<AdvanceResult> {
  const session = await prisma.diagnosticSession.findFirst({
    where: { id: sessionId, userId, status: "IN_PROGRESS" },
    include: { responses: true },
  });
  if (!session) return { ok: false, reason: "NOT_FOUND" };

  const form = parseForm(session.formJson);
  const block = blockForIndex(session.currentIndex);
  const blockIdx = BLOCKS.indexOf(block);

  if (block.stage === "ROUTING") {
    const responses = form
      .filter((e) => e.index >= block.start && e.index <= block.end)
      .map<RoutingResponse>((entry) => {
        const res = session.responses.find((r) => r.questionId === entry.questionId);
        return {
          difficulty: entry.difficulty ?? "MEDIUM",
          isCorrect: res?.isCorrect === true,
          unanswered: !res?.chosenAnswer,
        };
      });

    const decision = decideTrack(responses);
    const slots = trackSlots(block.section, decision.track);
    const ids = await resolveSlots(slots);
    const missing = slots.filter((s) => !ids.has(s.externalId));
    if (missing.length) {
      throw new DiagnosticUnavailableError(
        `Adaptive questions for the ${decision.track} track are missing from the question bank. Run "npm run db:seed".`
      );
    }

    const updated = form.map((entry) => {
      if (entry.index < block.end + 1 || entry.index > block.end + QUESTIONS_PER_STAGE) return entry;
      const slot = slots[entry.index - block.end - 1];
      return {
        ...entry,
        questionId: ids.get(slot.externalId) ?? null,
        externalId: slot.externalId,
        difficulty: slot.difficulty,
      };
    });

    await prisma.diagnosticSession.update({
      where: { id: sessionId },
      data: {
        formJson: JSON.stringify(updated),
        currentIndex: block.end + 1,
        ...(block.section === "MATH"
          ? { mathTrack: decision.track }
          : { rwTrack: decision.track }),
      },
    });
    return { ok: true, track: decision.track, nextIndex: block.end + 1 };
  }

  // End of an adaptive block: either move to the next section or finish.
  const nextBlock = BLOCKS[blockIdx + 1];
  if (!nextBlock) return { ok: true, completed: true, nextIndex: block.end };

  await prisma.diagnosticSession.update({
    where: { id: sessionId },
    data: { currentIndex: nextBlock.start },
  });
  return { ok: true, nextIndex: nextBlock.start };
}

// ---------------------------------------------------------------------------
// Submission
// ---------------------------------------------------------------------------

export interface SubmitResult {
  resultId: string;
  sessionId: string;
}

/**
 * Grade and score the whole diagnostic, then fan the results out into the rest
 * of the app: attempts, mastery, mistake diagnoses, spaced repetition,
 * recommendations, and the study plan.
 */
export async function submitSession(userId: string, sessionId: string): Promise<SubmitResult> {
  const session = await prisma.diagnosticSession.findFirst({
    where: { id: sessionId, userId },
    include: { responses: true },
  });
  if (!session) throw new DiagnosticNotFoundError("Diagnostic session not found");

  const existing = await prisma.diagnosticResult.findUnique({ where: { sessionId } });
  if (existing) return { resultId: existing.id, sessionId };

  const form = parseForm(session.formJson).filter((e) => e.questionId);
  const questionIds = form.map((e) => e.questionId as string);
  const questions = await prisma.question.findMany({ where: { id: { in: questionIds } } });
  const byId = new Map(questions.map((q) => [q.id, q]));

  const scored: ScoredResponse[] = [];
  for (const entry of form) {
    const q = byId.get(entry.questionId as string);
    if (!q) continue;
    const res = session.responses.find((r) => r.questionId === q.id);
    const chosen = res?.chosenAnswer ?? null;
    scored.push({
      questionId: q.id,
      section: q.section as Section,
      stage: entry.stage,
      domain: q.domain,
      skill: q.skill,
      subskill: q.subskill,
      difficulty: q.difficulty as Difficulty,
      isCorrect: chosen ? gradeAnswer(q, chosen) : false,
      chosenAnswer: chosen,
      correctAnswer: q.correctAnswer,
      timeMs: res?.timeMs ?? 0,
      recommendedSec: q.timeRecommendationSec ?? 90,
      answerChanges: res?.answerChanges ?? 0,
      flagged: res?.flagged ?? false,
    });
  }

  const score = scoreDiagnostic(scored, {
    MATH: (session.mathTrack as DiagnosticTrack | null) ?? null,
    READING_WRITING: (session.rwTrack as DiagnosticTrack | null) ?? null,
  });

  const result = await prisma.diagnosticResult.create({
    data: {
      sessionId,
      userId,
      mathScore: score.math.score,
      rwScore: score.rw.score,
      totalScore: score.total,
      mathLow: score.math.low,
      mathHigh: score.math.high,
      rwLow: score.rw.low,
      rwHigh: score.rw.high,
      totalLow: score.totalLow,
      totalHigh: score.totalHigh,
      mathTheta: score.math.theta,
      mathSe: score.math.se,
      rwTheta: score.rw.theta,
      rwSe: score.rw.se,
      confidence: score.confidence,
      accuracyPct: score.accuracyPct,
      breakdownJson: JSON.stringify({ ...score.breakdown, confidenceNote: score.confidenceNote }),
    },
  });

  await prisma.diagnosticSession.update({
    where: { id: sessionId },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });

  // Fan out into the rest of the app. Done sequentially so mastery is up to date
  // before recommendations are recomputed from it.
  for (const res of scored) {
    const q = byId.get(res.questionId);
    if (!q) continue;

    const attempt = await prisma.questionAttempt.create({
      data: {
        userId,
        questionId: q.id,
        chosenAnswer: res.chosenAnswer ?? "",
        isCorrect: res.isCorrect,
        timeMs: res.timeMs,
        mode: "diagnostic",
        sessionId,
        stage: res.stage,
        flagged: res.flagged,
        answerChanges: res.answerChanges,
      },
    });

    await updateSkillMastery({
      userId,
      section: q.section,
      domain: q.domain,
      skill: q.skill,
      difficulty: q.difficulty,
      isCorrect: res.isCorrect,
      timeMs: res.timeMs,
      recommendedSec: q.timeRecommendationSec,
    });

    if (!res.isCorrect) {
      await saveHeuristicDiagnosis({
        userId,
        attemptId: attempt.id,
        question: {
          id: q.id,
          section: q.section,
          domain: q.domain,
          skill: q.skill,
          subskill: q.subskill,
          difficulty: q.difficulty,
          format: q.format,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          timeRecommendationSec: q.timeRecommendationSec,
        },
        chosenAnswer: res.chosenAnswer ?? null,
        timeMs: res.timeMs,
        answerChanges: res.answerChanges,
        flagged: res.flagged,
        // The last two items of each stage are where the clock bites.
        nearSectionEnd: (form.find((e) => e.questionId === q.id)?.index ?? 0) % 5 >= 3,
      });

      const init = initialSrsState();
      await prisma.srsItem.upsert({
        where: { userId_questionId: { userId, questionId: q.id } },
        create: {
          userId,
          questionId: q.id,
          intervalIndex: init.intervalIndex,
          dueDate: new Date(),
          lastResult: "INCORRECT",
          active: true,
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
  }

  await prisma.studentProfile.updateMany({
    where: { userId },
    data: {
      hasTakenBluebook: true,
      lastTotalScore: score.total,
      lastMathScore: score.math.score,
      lastRwScore: score.rw.score,
      diagnosticChoice: "TAKE_NOW",
    },
  });

  await regenerateRecommendations(userId);

  return { resultId: result.id, sessionId };
}

/** Latest submitted result for a user, or null. */
export async function getLatestResult(userId: string) {
  return prisma.diagnosticResult.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export { DIAGNOSTIC_FORM, TOTAL_QUESTIONS, QUESTIONS_PER_STAGE };
