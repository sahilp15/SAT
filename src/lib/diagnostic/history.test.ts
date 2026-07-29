import fs from "node:fs";
import path from "node:path";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../db";
import { deriveQuestionMeta } from "../questionMeta";
import { FORMS, FORM_COUNT, allSlots } from "./form";
import { getDiagnosticHistory, scoreTrend, type AttemptSummary } from "./history";
import { BLOCKS, advanceBlock, saveResponse, startOrResumeSession, submitSession } from "./session";

// Integration tests for the diagnostics hub: what it shows before anything has
// been taken, how attempts accumulate, and whether the deltas and trend it
// reports are the real ones.

interface BankQuestion {
  externalId: string;
  section: string;
  domain: string;
  skill: string;
  difficulty: string;
  format: string;
  stem: string;
  correctAnswer: string;
  explanation: string;
  choices: { label: string; content: string }[];
}

let userId: string;

beforeAll(async () => {
  const dir = path.resolve(__dirname, "../../../prisma");
  const bank: BankQuestion[] = [
    ...(JSON.parse(fs.readFileSync(path.join(dir, "bankMath.json"), "utf-8")) as BankQuestion[]),
    ...(JSON.parse(
      fs.readFileSync(path.join(dir, "bankReadingWriting.json"), "utf-8")
    ) as BankQuestion[]),
  ];
  const byId = new Map(bank.map((q) => [q.externalId, q]));

  await prisma.question.deleteMany({});
  const everySlot = [
    ...new Map(FORMS.flatMap((f) => allSlots(f)).map((s) => [s.externalId, s])).values(),
  ];
  for (const slot of everySlot) {
    const q = byId.get(slot.externalId);
    if (!q) throw new Error(`Bank is missing ${slot.externalId}`);
    const meta = deriveQuestionMeta(q);
    const created = await prisma.question.create({
      data: {
        externalId: q.externalId,
        section: q.section,
        domain: q.domain,
        skill: q.skill,
        subskill: meta.subskill,
        difficulty: q.difficulty,
        format: q.format,
        stem: q.stem,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        timeRecommendationSec: meta.timeRecommendationSec,
        calculatorAppropriate: meta.calculatorAppropriate,
        satRelevance: meta.satRelevance,
        isDiagnostic: true,
      },
    });
    if (q.choices.length) {
      await prisma.answerChoice.createMany({
        data: q.choices.map((c) => ({
          questionId: created.id,
          label: c.label,
          content: c.content,
          isCorrect: c.label === q.correctAnswer,
        })),
      });
    }
  }
});

beforeEach(async () => {
  await prisma.user.deleteMany({});
  const user = await prisma.user.create({
    data: {
      email: `history-${Date.now()}-${Math.random()}@local`,
      profile: { create: { targetScore: 1600, testDate: "2026-08-22" } },
      settings: { create: {} },
    },
  });
  userId = user.id;
});

/** Answer a whole block, right or wrong. */
async function answerBlock(sessionId: string, correct: boolean, blockIndex: number) {
  const block = BLOCKS[blockIndex];
  const session = await prisma.diagnosticSession.findUniqueOrThrow({ where: { id: sessionId } });
  const form = JSON.parse(session.formJson) as { index: number; questionId: string | null }[];

  for (let i = block.start; i <= block.end; i += 1) {
    const entry = form.find((e) => e.index === i);
    if (!entry?.questionId) throw new Error(`question ${i} not resolved`);
    const row = await prisma.question.findUniqueOrThrow({
      where: { id: entry.questionId },
      select: { correctAnswer: true, format: true },
    });
    const answer = correct
      ? row.correctAnswer.split(",")[0].trim()
      : row.format === "SPR"
        ? "-999"
        : row.correctAnswer === "A"
          ? "B"
          : "A";
    await saveResponse(userId, sessionId, {
      questionId: entry.questionId,
      chosenAnswer: answer,
      flagged: false,
      timeDeltaMs: 60_000,
      answerChanges: 0,
      currentIndex: i,
    });
  }
}

/** Run a whole diagnostic end to end, answering everything right or wrong. */
async function completeForm(formId: number, correct: boolean) {
  const session = await startOrResumeSession(userId, formId);
  for (let block = 0; block < BLOCKS.length; block += 1) {
    await answerBlock(session.id, correct, block);
    await advanceBlock(userId, session.id);
  }
  await submitSession(userId, session.id);
  return session;
}

describe("an empty history", () => {
  it("offers every form and points at the first one", async () => {
    const history = await getDiagnosticHistory(userId);
    expect(history.forms).toHaveLength(FORM_COUNT);
    expect(history.totalForms).toBe(FORM_COUNT);
    expect(history.completedCount).toBe(0);
    expect(history.forms.every((f) => f.status === "AVAILABLE")).toBe(true);
    expect(history.nextFormId).toBe(1);
    expect(history.latest).toBeNull();
    expect(history.best).toBeNull();
    expect(history.activeSessionId).toBeNull();
    expect(history.timeline).toEqual([]);
  });

  it("lists forms in order with no gaps", async () => {
    const history = await getDiagnosticHistory(userId);
    expect(history.forms.map((f) => f.id)).toEqual(
      Array.from({ length: FORM_COUNT }, (_, i) => i + 1)
    );
  });
});

describe("an in-progress attempt", () => {
  it("reports partial progress without counting it as completed", async () => {
    const session = await startOrResumeSession(userId, 3);
    await answerBlock(session.id, true, 0);

    const history = await getDiagnosticHistory(userId);
    const form3 = history.forms.find((f) => f.id === 3);
    expect(form3?.status).toBe("IN_PROGRESS");
    expect(form3?.progress).toEqual({ sessionId: session.id, answered: 5, total: 20 });
    expect(form3?.result).toBeNull();
    expect(history.completedCount).toBe(0);
    expect(history.activeSessionId).toBe(session.id);
    expect(history.activeFormId).toBe(3);
    // The primary button should resume, not start something new.
    expect(history.nextFormId).toBe(3);
  });

  it("counts only answered questions, not visited ones", async () => {
    const session = await startOrResumeSession(userId, 1);
    const form = JSON.parse(
      (await prisma.diagnosticSession.findUniqueOrThrow({ where: { id: session.id } })).formJson
    ) as { index: number; questionId: string | null }[];
    const first = form[0].questionId as string;
    await saveResponse(userId, session.id, {
      questionId: first,
      chosenAnswer: null,
      flagged: true,
      timeDeltaMs: 4_000,
      answerChanges: 0,
      currentIndex: 0,
    });

    const history = await getDiagnosticHistory(userId);
    expect(history.forms.find((f) => f.id === 1)?.progress?.answered).toBe(0);
  });
});

describe("completed attempts", () => {
  it("records the result against the right form", async () => {
    await completeForm(2, true);
    const history = await getDiagnosticHistory(userId);

    const form2 = history.forms.find((f) => f.id === 2);
    expect(form2?.status).toBe("COMPLETED");
    expect(form2?.attempts).toBe(1);
    expect(form2?.result?.totalScore).toBeGreaterThan(0);
    expect(form2?.result?.formId).toBe(2);
    expect(history.completedCount).toBe(1);
    // Everything else is untouched.
    expect(history.forms.filter((f) => f.status === "AVAILABLE")).toHaveLength(FORM_COUNT - 1);
  });

  it("moves the start button past forms already taken", async () => {
    await completeForm(1, true);
    await completeForm(2, false);
    expect((await getDiagnosticHistory(userId)).nextFormId).toBe(3);
  });

  it("keeps the timeline in the order the attempts were taken", async () => {
    await completeForm(5, true);
    await completeForm(1, false);
    const history = await getDiagnosticHistory(userId);
    expect(history.timeline.map((a) => a.formId)).toEqual([5, 1]);
    expect(history.latest?.formId).toBe(1);
  });

  it("computes each delta against the previous attempt, not the previous form", async () => {
    await completeForm(4, true); // high
    await completeForm(1, false); // low
    const history = await getDiagnosticHistory(userId);

    const [first, second] = history.timeline;
    expect(first.delta).toBeNull();
    expect(second.delta).toBe(second.totalScore - first.totalScore);
    expect(second.delta).toBeLessThan(0);
  });

  it("reports the best attempt regardless of when it was taken", async () => {
    await completeForm(1, true);
    await completeForm(2, false);
    const history = await getDiagnosticHistory(userId);
    expect(history.best?.formId).toBe(1);
    expect(history.latest?.formId).toBe(2);
    expect(history.best!.totalScore).toBeGreaterThan(history.latest!.totalScore);
  });

  it("shows the newest result for a form taken more than once", async () => {
    await completeForm(1, true);
    await completeForm(1, false);
    const history = await getDiagnosticHistory(userId);

    const form1 = history.forms.find((f) => f.id === 1);
    expect(form1?.attempts).toBe(2);
    expect(form1?.result?.resultId).toBe(history.timeline[1].resultId);
    // Two attempts on one form still leaves the other forms untaken.
    expect(history.completedCount).toBe(1);
    expect(history.nextFormId).toBe(2);
  });

  it("carries the section ranges needed to draw the chart", async () => {
    await completeForm(1, true);
    const [attempt] = (await getDiagnosticHistory(userId)).timeline;
    expect(attempt.mathLow).toBeLessThanOrEqual(attempt.mathScore);
    expect(attempt.mathHigh).toBeGreaterThanOrEqual(attempt.mathScore);
    expect(attempt.rwLow).toBeLessThanOrEqual(attempt.rwScore);
    expect(attempt.rwHigh).toBeGreaterThanOrEqual(attempt.rwScore);
    expect(attempt.totalLow).toBeLessThanOrEqual(attempt.totalScore);
    expect(attempt.totalHigh).toBeGreaterThanOrEqual(attempt.totalScore);
  });
});

describe("scoreTrend", () => {
  function series(totals: number[]): AttemptSummary[] {
    return totals.map((total, i) => ({
      resultId: `r${i}`,
      sessionId: `s${i}`,
      formId: i + 1,
      totalScore: total,
      totalLow: total - 60,
      totalHigh: total + 60,
      mathScore: Math.round(total / 2),
      mathLow: Math.round(total / 2) - 30,
      mathHigh: Math.round(total / 2) + 30,
      rwScore: Math.round(total / 2),
      rwLow: Math.round(total / 2) - 30,
      rwHigh: Math.round(total / 2) + 30,
      confidence: "MODERATE",
      accuracyPct: 60,
      takenAt: new Date(2026, 0, i + 1),
      delta: i > 0 ? total - totals[i - 1] : null,
    }));
  }

  it("needs at least two attempts", () => {
    expect(scoreTrend([])).toBeNull();
    expect(scoreTrend(series([1200]))).toBeNull();
  });

  it("returns points gained per attempt on a rising series", () => {
    expect(scoreTrend(series([1100, 1150, 1200, 1250]))).toBe(50);
  });

  it("goes negative when the estimate is falling", () => {
    expect(scoreTrend(series([1300, 1250, 1200]))).toBe(-50);
  });

  it("is flat when the estimate dips and recovers", () => {
    expect(scoreTrend(series([1250, 1150, 1150, 1250]))).toBe(0);
  });

  it("is robust to a single outlier rather than chasing it", () => {
    // Least squares, not last-minus-first: one bad day tilts the line a little.
    const trend = scoreTrend(series([1200, 1210, 1000, 1220, 1230]));
    expect(trend).not.toBeNull();
    expect(Math.abs(trend as number)).toBeLessThan(30);
  });
});
