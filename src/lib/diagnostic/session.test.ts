import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../db";
import { deriveQuestionMeta } from "../questionMeta";
import { updateSkillMastery } from "../mastery";
import { regenerateRecommendations } from "../recommendations";
import { FORMS, allSlots } from "./form";
import {
  BLOCKS,
  advanceBlock,
  blockForIndex,
  getSessionState,
  nextFormId,
  saveResponse,
  startOrResumeSession,
  submitSession,
} from "./session";
import fs from "node:fs";
import path from "node:path";

// Integration tests against a real SQLite database. These cover the parts that
// only break in the wiring: autosave, resume-after-refresh, block locking,
// adaptive routing persistence, and the fan-out from submission into mastery,
// diagnoses, and recommendations.

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

  // Only the questions the diagnostic forms reference — the tests don't need the
  // whole bank, and a smaller seed keeps them fast.
  await prisma.question.deleteMany({});
  const everySlot = [...new Map(
    FORMS.flatMap((f) => allSlots(f)).map((s) => [s.externalId, s])
  ).values()];
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
      email: `test-${Date.now()}-${Math.random()}@local`,
      profile: { create: { targetScore: 1600, testDate: "2026-08-22" } },
      settings: { create: {} },
    },
  });
  userId = user.id;
});

/** Answer every question in the current block, correctly or not. */
async function answerBlock(sessionId: string, correct: boolean, blockIndex: number) {
  const block = BLOCKS[blockIndex];
  const state = await getSessionState(userId, sessionId);
  if (!state) throw new Error("no state");

  for (let i = block.start; i <= block.end; i += 1) {
    const q = state.questions.find((x) => x.index === i);
    if (!q) throw new Error(`question ${i} not unlocked`);
    const row = await prisma.question.findUniqueOrThrow({
      where: { id: q.id },
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
      questionId: q.id,
      chosenAnswer: answer,
      flagged: false,
      timeDeltaMs: 60_000,
      answerChanges: 0,
      currentIndex: i,
    });
  }
}

describe("block boundaries", () => {
  it("splits the form into four locked blocks of five", () => {
    expect(BLOCKS).toHaveLength(4);
    expect(BLOCKS.map((b) => `${b.section}:${b.stage}`)).toEqual([
      "MATH:ROUTING",
      "MATH:ADAPTIVE",
      "READING_WRITING:ROUTING",
      "READING_WRITING:ADAPTIVE",
    ]);
    for (const b of BLOCKS) expect(b.end - b.start).toBe(4);
  });

  it("maps every index to the right block", () => {
    expect(blockForIndex(0).stage).toBe("ROUTING");
    expect(blockForIndex(4).stage).toBe("ROUTING");
    expect(blockForIndex(5).stage).toBe("ADAPTIVE");
    expect(blockForIndex(10).section).toBe("READING_WRITING");
    expect(blockForIndex(19).stage).toBe("ADAPTIVE");
  });
});

describe("starting and resuming", () => {
  it("creates a session with only the first block visible", async () => {
    const session = await startOrResumeSession(userId);
    const state = await getSessionState(userId, session.id);
    expect(state).not.toBeNull();
    expect(state?.totalQuestions).toBe(20);
    // Adaptive questions must not be visible before routing decides.
    expect(state?.questions).toHaveLength(5);
    expect(state?.questions.every((q) => q.stage === "ROUTING")).toBe(true);
  });

  it("never sends the correct answer to the client", async () => {
    const session = await startOrResumeSession(userId);
    const state = await getSessionState(userId, session.id);
    const serialized = JSON.stringify(state);
    const answers = await prisma.question.findMany({
      where: { isDiagnostic: true },
      select: { correctAnswer: true, explanation: true },
      take: 5,
    });
    for (const a of answers) {
      expect(serialized).not.toContain(a.explanation?.slice(0, 60) ?? "###");
    }
    expect(serialized).not.toContain("correctAnswer");
    expect(serialized).not.toContain("isCorrect");
  });

  it("resumes the same session rather than starting a new one", async () => {
    const first = await startOrResumeSession(userId);
    const second = await startOrResumeSession(userId);
    expect(second.id).toBe(first.id);
  });

  it("restores saved answers after a refresh", async () => {
    const session = await startOrResumeSession(userId);
    const state = await getSessionState(userId, session.id);
    const q = state!.questions[0];

    await saveResponse(userId, session.id, {
      questionId: q.id,
      chosenAnswer: "C",
      flagged: true,
      timeDeltaMs: 12_000,
      answerChanges: 2,
      currentIndex: 1,
    });

    // A fresh read is exactly what a page refresh does.
    const restored = await getSessionState(userId, session.id);
    const saved = restored!.responses.find((r) => r.questionId === q.id);
    expect(saved?.chosenAnswer).toBe("C");
    expect(saved?.flagged).toBe(true);
    expect(saved?.answerChanges).toBe(2);
    expect(restored!.currentIndex).toBe(1);
  });

  it("accumulates time across visits instead of overwriting it", async () => {
    const session = await startOrResumeSession(userId);
    const q = (await getSessionState(userId, session.id))!.questions[0];
    const save = (ms: number) =>
      saveResponse(userId, session.id, {
        questionId: q.id,
        chosenAnswer: "A",
        flagged: false,
        timeDeltaMs: ms,
        answerChanges: 0,
        currentIndex: 0,
      });

    await save(10_000);
    await save(5_000);
    const state = await getSessionState(userId, session.id);
    const saved = state!.responses.find((r) => r.questionId === q.id);
    expect(saved?.timeMs).toBe(15_000);
    expect(saved?.visits).toBe(2);
  });

  it("rejects a response for a question outside the form", async () => {
    const session = await startOrResumeSession(userId);
    const result = await saveResponse(userId, session.id, {
      questionId: "does-not-exist",
      chosenAnswer: "A",
      flagged: false,
      timeDeltaMs: 0,
      answerChanges: 0,
      currentIndex: 0,
    });
    expect(result.ok).toBe(false);
  });

  it("refuses to load another user's session", async () => {
    const session = await startOrResumeSession(userId);
    const other = await prisma.user.create({
      data: { email: `other-${Math.random()}@local` },
    });
    expect(await getSessionState(other.id, session.id)).toBeNull();
  });
});

describe("adaptive routing", () => {
  it("routes a perfect Math routing stage into the hard track", async () => {
    const session = await startOrResumeSession(userId);
    await answerBlock(session.id, true, 0);
    const result = await advanceBlock(userId, session.id);

    expect(result.ok).toBe(true);
    expect(result.track).toBe("HARD");

    const state = await getSessionState(userId, session.id);
    expect(state?.mathTrack).toBe("HARD");
    // The five adaptive questions are now unlocked, and they're the hard set.
    const adaptive = state!.questions.filter((q) => q.stage === "ADAPTIVE");
    expect(adaptive).toHaveLength(5);
    expect(adaptive.filter((q) => q.difficulty === "HARD").length).toBeGreaterThanOrEqual(4);
  });

  it("routes a failed Math routing stage into the easy track", async () => {
    const session = await startOrResumeSession(userId);
    await answerBlock(session.id, false, 0);
    const result = await advanceBlock(userId, session.id);

    expect(result.track).toBe("EASY");
    const state = await getSessionState(userId, session.id);
    const adaptive = state!.questions.filter((q) => q.stage === "ADAPTIVE");
    expect(adaptive).toHaveLength(5);

    // What matters is that this set is genuinely easier than the alternatives,
    // not a fixed count of EASY items — the blueprint tunes that mix.
    const rank = { EASY: 0, MEDIUM: 1, HARD: 2 } as const;
    const avg = (list: { difficulty: string }[]) =>
      list.reduce((sum, q) => sum + rank[q.difficulty as keyof typeof rank], 0) / list.length;
    const routing = state!.questions.filter((q) => q.stage === "ROUTING");
    expect(avg(adaptive)).toBeLessThan(avg(routing));
    expect(avg(adaptive)).toBeLessThan(rank.MEDIUM);
  });

  it("routes Math and Reading & Writing independently", async () => {
    const session = await startOrResumeSession(userId);
    await answerBlock(session.id, true, 0);
    await advanceBlock(userId, session.id); // Math -> HARD
    await answerBlock(session.id, true, 1);
    await advanceBlock(userId, session.id); // into R&W routing
    await answerBlock(session.id, false, 2);
    const rw = await advanceBlock(userId, session.id);

    expect(rw.track).toBe("EASY");
    const state = await getSessionState(userId, session.id);
    expect(state?.mathTrack).toBe("HARD");
    expect(state?.rwTrack).toBe("EASY");
  });

  it("locks a block once it has been advanced past", async () => {
    const session = await startOrResumeSession(userId);
    const first = (await getSessionState(userId, session.id))!.questions[0];
    await answerBlock(session.id, true, 0);
    await advanceBlock(userId, session.id);

    const result = await saveResponse(userId, session.id, {
      questionId: first.id,
      chosenAnswer: "D",
      flagged: false,
      timeDeltaMs: 1000,
      answerChanges: 1,
      currentIndex: 5,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("LOCKED");
  });
});

describe("submission", () => {
  async function runFullDiagnostic(correct: boolean) {
    const session = await startOrResumeSession(userId);
    for (let block = 0; block < BLOCKS.length; block += 1) {
      await answerBlock(session.id, correct, block);
      await advanceBlock(userId, session.id);
    }
    await submitSession(userId, session.id);
    return session.id;
  }

  it("scores a perfect run higher than a failed one", async () => {
    await runFullDiagnostic(true);
    const strong = await prisma.diagnosticResult.findFirstOrThrow({ where: { userId } });

    await prisma.diagnosticResult.deleteMany({ where: { userId } });
    await prisma.diagnosticSession.deleteMany({ where: { userId } });
    await prisma.questionAttempt.deleteMany({ where: { userId } });
    await prisma.topicMastery.deleteMany({ where: { userId } });

    await runFullDiagnostic(false);
    const weak = await prisma.diagnosticResult.findFirstOrThrow({ where: { userId } });

    expect(strong.totalScore).toBeGreaterThan(weak.totalScore);
    expect(strong.totalScore).toBeLessThanOrEqual(1600);
    expect(weak.totalScore).toBeGreaterThanOrEqual(400);
  });

  it("records an attempt for every question and updates mastery", async () => {
    await runFullDiagnostic(true);

    const attempts = await prisma.questionAttempt.findMany({ where: { userId } });
    expect(attempts).toHaveLength(20);
    expect(attempts.every((a) => a.mode === "diagnostic")).toBe(true);
    expect(attempts.every((a) => a.stage === "ROUTING" || a.stage === "ADAPTIVE")).toBe(true);

    const mastery = await prisma.topicMastery.findMany({ where: { userId } });
    expect(mastery.length).toBeGreaterThan(4);
    for (const m of mastery) {
      expect(m.mastery).toBeGreaterThan(0.5);
      expect(m.recentJson).toBeTruthy();
    }
  });

  it("diagnoses every missed question and queues it for spaced review", async () => {
    await runFullDiagnostic(false);

    const diagnoses = await prisma.mistakeDiagnosis.findMany({ where: { userId } });
    expect(diagnoses).toHaveLength(20);
    for (const d of diagnoses) {
      expect(d.category.length).toBeGreaterThan(2);
      expect(d.whyWrong.length).toBeGreaterThan(20);
      expect(d.whyCorrect.length).toBeGreaterThan(20);
      expect(d.source).toBe("heuristic");
    }

    const srs = await prisma.srsItem.findMany({ where: { userId, active: true } });
    expect(srs).toHaveLength(20);
  });

  it("generates prioritized recommendations after a weak run", async () => {
    await runFullDiagnostic(false);
    const recs = await prisma.skillRecommendation.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { priority: "asc" },
    });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].priority).toBe(1);
    expect(recs[0].recommendedQuestions).toBeGreaterThan(0);
    expect(recs[0].reason.length).toBeGreaterThan(30);
    // Priorities are contiguous and ordered.
    recs.forEach((r, i) => expect(r.priority).toBe(i + 1));
  });

  it("stores a confidence range that brackets the score", async () => {
    await runFullDiagnostic(true);
    const result = await prisma.diagnosticResult.findFirstOrThrow({ where: { userId } });
    expect(result.totalLow).toBeLessThanOrEqual(result.totalScore);
    expect(result.totalScore).toBeLessThanOrEqual(result.totalHigh);
    expect(result.mathLow).toBeLessThanOrEqual(result.mathScore);
    expect(result.rwHigh).toBeGreaterThanOrEqual(result.rwScore);
    expect(["LOW", "MODERATE", "HIGH"]).toContain(result.confidence);
  });

  it("is idempotent — submitting twice doesn't double-count", async () => {
    const sessionId = await runFullDiagnostic(true);
    await submitSession(userId, sessionId);

    expect(await prisma.diagnosticResult.count({ where: { userId } })).toBe(1);
    expect(await prisma.questionAttempt.count({ where: { userId } })).toBe(20);
  });

  it("writes the predicted score back to the profile", async () => {
    await runFullDiagnostic(true);
    const profile = await prisma.studentProfile.findUniqueOrThrow({ where: { userId } });
    const result = await prisma.diagnosticResult.findFirstOrThrow({ where: { userId } });
    expect(profile.lastTotalScore).toBe(result.totalScore);
    expect(profile.lastMathScore).toBe(result.mathScore);
    expect(profile.hasTakenBluebook).toBe(true);
  });
});

describe("mastery persistence", () => {
  it("accumulates difficulty counters across attempts", async () => {
    const key = {
      userId,
      section: "MATH",
      domain: "Algebra",
      skill: "Linear functions",
    };
    await updateSkillMastery({ ...key, difficulty: "EASY", isCorrect: true, timeMs: 30_000 });
    await updateSkillMastery({ ...key, difficulty: "HARD", isCorrect: false, timeMs: 200_000 });
    await updateSkillMastery({ ...key, difficulty: "MEDIUM", isCorrect: true, timeMs: 60_000 });

    const row = await prisma.topicMastery.findUniqueOrThrow({
      where: { userId_section_domain_skill: key },
    });
    expect(row.attempts).toBe(3);
    expect(row.correct).toBe(2);
    expect(row.easyAttempts).toBe(1);
    expect(row.hardAttempts).toBe(1);
    expect(row.mediumCorrect).toBe(1);
    expect(row.mastery).toBeGreaterThan(0);
    expect(row.mastery).toBeLessThanOrEqual(1);
    expect(row.signal).toBeTruthy();
    expect(row.avgTimeMs).toBeGreaterThan(0);
  });

  it("caps the stored recent-attempt window", async () => {
    const key = { userId, section: "MATH", domain: "Algebra", skill: "Linear functions" };
    for (let i = 0; i < 30; i += 1) {
      await updateSkillMastery({ ...key, difficulty: "MEDIUM", isCorrect: i % 2 === 0 });
    }
    const row = await prisma.topicMastery.findUniqueOrThrow({
      where: { userId_section_domain_skill: key },
    });
    expect(row.attempts).toBe(30);
    expect(JSON.parse(row.recentJson ?? "[]")).toHaveLength(20);
  });
});

describe("recommendation regeneration", () => {
  it("includes self-reported struggling topics with no practice history", async () => {
    await prisma.studentProfile.update({
      where: { userId },
      data: { strugglingTopics: JSON.stringify(["Circles"]) },
    });
    const recs = await regenerateRecommendations(userId);
    expect(recs.some((r) => r.skill === "Circles")).toBe(true);
    const stored = await prisma.skillRecommendation.findMany({ where: { userId } });
    expect(stored.some((r) => r.skill === "Circles")).toBe(true);
  });

  it("replaces the previous active set rather than appending", async () => {
    await prisma.studentProfile.update({
      where: { userId },
      data: { strugglingTopics: JSON.stringify(["Circles"]) },
    });
    await regenerateRecommendations(userId);
    await regenerateRecommendations(userId);
    const stored = await prisma.skillRecommendation.findMany({
      where: { userId, status: "ACTIVE" },
    });
    expect(stored.filter((r) => r.skill === "Circles")).toHaveLength(1);
  });
});

describe("multiple forms", () => {
  async function completeForm(formId?: number) {
    const session = await startOrResumeSession(userId, formId);
    for (let block = 0; block < BLOCKS.length; block += 1) {
      await answerBlock(session.id, true, block);
      await advanceBlock(userId, session.id);
    }
    await submitSession(userId, session.id);
    return session;
  }

  it("starts with diagnostic 1 and advances to the next untaken one", async () => {
    expect(await nextFormId(userId)).toBe(1);
    await completeForm();
    expect(await nextFormId(userId)).toBe(2);
    await completeForm();
    expect(await nextFormId(userId)).toBe(3);
  });

  it("gives consecutive diagnostics different questions", async () => {
    const first = await completeForm(1);
    const second = await completeForm(2);

    const idsFor = async (sessionId: string) => {
      const rows = await prisma.diagnosticResponse.findMany({
        where: { sessionId },
        select: { questionId: true },
      });
      return new Set(rows.map((r) => r.questionId));
    };

    const a = await idsFor(first.id);
    const b = await idsFor(second.id);
    expect(a.size).toBe(20);
    expect(b.size).toBe(20);
    // Back-to-back forms must share nothing at all.
    expect([...a].filter((id) => b.has(id))).toHaveLength(0);
  });

  it("records which form each attempt used", async () => {
    await completeForm(1);
    await completeForm(4);
    const results = await prisma.diagnosticResult.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { formId: true },
    });
    expect(results.map((r) => r.formId)).toEqual([1, 4]);
  });

  it("lets a specific form be requested out of order", async () => {
    const session = await startOrResumeSession(userId, 7);
    expect(session.formId).toBe(7);
  });

  it("abandons an in-progress attempt when a different form is requested", async () => {
    const first = await startOrResumeSession(userId, 2);
    const second = await startOrResumeSession(userId, 5);
    expect(second.id).not.toBe(first.id);
    expect(second.formId).toBe(5);

    const stale = await prisma.diagnosticSession.findUniqueOrThrow({ where: { id: first.id } });
    expect(stale.status).toBe("ABANDONED");
  });

  it("resumes rather than restarting when the same form is requested", async () => {
    const first = await startOrResumeSession(userId, 3);
    const again = await startOrResumeSession(userId, 3);
    expect(again.id).toBe(first.id);
  });

  it("rejects a form id that does not exist", async () => {
    await expect(startOrResumeSession(userId, 999)).rejects.toThrow(/doesn't exist/);
  });

  it("routes each form independently on its own questions", async () => {
    const session = await startOrResumeSession(userId, 6);
    await answerBlock(session.id, false, 0);
    const result = await advanceBlock(userId, session.id);
    expect(result.track).toBe("EASY");

    const state = await getSessionState(userId, session.id);
    const adaptive = state!.questions.filter((q) => q.stage === "ADAPTIVE");
    expect(adaptive).toHaveLength(5);
    // The adaptive set belongs to form 6, not form 1.
    const form6 = FORMS[5];
    const expected = new Set(allSlots(form6).map((s) => s.externalId));
    const rows = await prisma.question.findMany({
      where: { id: { in: adaptive.map((q) => q.id) } },
      select: { externalId: true },
    });
    for (const row of rows) expect(expected.has(row.externalId ?? "")).toBe(true);
  });
});
