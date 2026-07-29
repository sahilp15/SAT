// Assembles the learning profile the AI tutor sees.
//
// PRIVACY: this is the only place tutor context is built, and it deliberately
// reads no name, email, or other identifier — only study data (mastery, recent
// mistakes, plan, timing). Anything not in TutorProfile never reaches the API.

import "server-only";
import { prisma } from "./db";
import { getTodayPlan } from "./planning";
import { resolveTestDate } from "./testDate";
import type { TutorProfile, TutorQuestionContext } from "./ai/prompts";

export async function buildTutorProfile(userId: string): Promise<TutorProfile> {
  const [profile, result, mastery, recentMisses, attemptStats, today] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId } }),
    prisma.diagnosticResult.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.topicMastery.findMany({ where: { userId }, orderBy: { mastery: "asc" }, take: 40 }),
    prisma.mistakeDiagnosis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        attempt: { select: { question: { select: { skill: true, difficulty: true } } } },
      },
    }),
    prisma.questionAttempt.findMany({
      where: { userId },
      select: { isCorrect: true, timeMs: true },
    }),
    getTodayPlan(userId),
  ]);

  const resolved = resolveTestDate(profile);
  const answered = attemptStats.length;
  const correct = attemptStats.filter((a) => a.isCorrect).length;
  const timed = attemptStats.filter((a) => (a.timeMs ?? 0) > 0);
  const avgSecondsPerQuestion = timed.length
    ? Math.round(timed.reduce((s, a) => s + (a.timeMs ?? 0), 0) / timed.length / 1000)
    : null;

  const tested = mastery.filter((m) => m.attempts >= 2);

  return {
    daysUntilTest: resolved?.daysRemaining ?? null,
    targetScore: profile?.targetScore ?? null,
    predictedTotal: result?.totalScore ?? profile?.lastTotalScore ?? null,
    predictedMath: result?.mathScore ?? profile?.lastMathScore ?? null,
    predictedRw: result?.rwScore ?? profile?.lastRwScore ?? null,
    minutesPerDay: profile?.minutesPerDay ?? null,
    weakestSkills: tested
      .slice(0, 5)
      .map((m) => ({ skill: m.skill, mastery: m.mastery, signal: m.signal ?? "UNTESTED" })),
    strongestSkills: [...tested]
      .sort((a, b) => b.mastery - a.mastery)
      .slice(0, 3)
      .map((m) => ({ skill: m.skill, mastery: m.mastery })),
    recentMistakes: recentMisses.map((d) => ({
      skill: d.attempt.question.skill,
      category: d.category,
      difficulty: d.attempt.question.difficulty,
    })),
    questionsAnswered: answered,
    accuracy: answered ? correct / answered : 0,
    todayPlan: today ? `${today.title} — ${today.items.map((i) => i.label).join("; ")}` : null,
    avgSecondsPerQuestion,
  };
}

/** Question context for tutor modes that operate on a specific item. */
export async function buildTutorQuestion(
  userId: string,
  questionId: string | null | undefined,
  attemptId?: string | null
): Promise<TutorQuestionContext | null> {
  if (!questionId && !attemptId) return null;

  const attempt = attemptId
    ? await prisma.questionAttempt.findFirst({
        where: { id: attemptId, userId },
        include: { question: { include: { choices: { orderBy: { label: "asc" } } } } },
      })
    : null;

  const question =
    attempt?.question ??
    (questionId
      ? await prisma.question.findUnique({
          where: { id: questionId },
          include: { choices: { orderBy: { label: "asc" } } },
        })
      : null);

  if (!question) return null;

  // When no explicit attempt was named, fall back to this user's latest attempt
  // on the question so "explain my mistake" knows what they chose.
  const chosen =
    attempt?.chosenAnswer ??
    (
      await prisma.questionAttempt.findFirst({
        where: { userId, questionId: question.id },
        orderBy: { createdAt: "desc" },
        select: { chosenAnswer: true },
      })
    )?.chosenAnswer ??
    null;

  return {
    stem: question.stem,
    choices: question.choices.map((c) => ({ label: c.label, content: c.content })),
    correctAnswer: question.correctAnswer,
    officialExplanation: question.explanation,
    chosenAnswer: chosen,
    section: question.section,
    domain: question.domain,
    skill: question.skill,
    difficulty: question.difficulty,
  };
}
