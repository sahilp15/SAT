import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { errorLogSchema } from "@/lib/errorLogValidation";
import { isAiConfigured, reviewErrorLog } from "@/lib/ai";
import type { ErrorLogContext } from "@/lib/ai/prompts";
import { validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

/**
 * Save an error-log reflection. Completeness is enforced locally; the AI review
 * of reflection *quality* is a bonus that never blocks progress when it fails.
 */
export async function POST(req: NextRequest) {
  const user = await getLocalUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = errorLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ...validationError(parsed.error), error: "incomplete" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const attempt = await prisma.questionAttempt.findUnique({
    where: { id: input.attemptId },
    include: { question: true },
  });
  if (!attempt || attempt.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const existing = await prisma.errorLog.findUnique({ where: { attemptId: input.attemptId } });
  const baseData = {
    userId: user.id,
    chosenAnswer: attempt.chosenAnswer,
    correctAnswer: attempt.question.correctAnswer,
    whyChose: input.whyChose,
    whyWrong: input.whyWrong,
    whyCorrectRight: input.whyCorrectRight,
    mistakeType: input.mistakeType,
    whatDifferent: input.whatDifferent,
    confidenceAfter: input.confidenceAfter,
    source: attempt.mode === "diagnostic" ? "diagnostic" : "practice",
  };
  const errorLog = existing
    ? await prisma.errorLog.update({
        where: { id: existing.id },
        data: { ...baseData, revisionCount: { increment: 1 } },
      })
    : await prisma.errorLog.create({ data: { attemptId: input.attemptId, ...baseData } });

  const settings = await prisma.settings.findUnique({ where: { userId: user.id } });
  const aiOn = isAiConfigured() && settings?.aiEnabled !== false;

  if (!aiOn) {
    await prisma.errorLog.update({
      where: { id: errorLog.id },
      data: { aiReviewStatus: "NOT_REVIEWED", aiFeedback: null },
    });
    return NextResponse.json({
      status: "APPROVED",
      aiConfigured: false,
      feedback:
        "Saved. AI review of your reflection is off — add an OPENAI_API_KEY to your .env to turn it on.",
      errorLogId: errorLog.id,
    });
  }

  const ctx: ErrorLogContext = {
    section: attempt.question.section,
    domain: attempt.question.domain,
    skill: attempt.question.skill,
    difficulty: attempt.question.difficulty,
    stem: attempt.question.stem,
    correctAnswer: attempt.question.correctAnswer,
    officialExplanation: attempt.question.explanation,
    chosenAnswer: attempt.chosenAnswer,
    whyChose: input.whyChose,
    whyWrong: input.whyWrong,
    whyCorrectRight: input.whyCorrectRight,
    mistakeType: input.mistakeType,
    whatDifferent: input.whatDifferent,
    confidenceAfter: input.confidenceAfter,
  };
  const review = await reviewErrorLog(ctx);

  if (!review.ok) {
    // Infrastructure problems must never trap a student mid-session.
    await prisma.errorLog.update({
      where: { id: errorLog.id },
      data: { aiReviewStatus: "NOT_REVIEWED" },
    });
    return NextResponse.json({
      status: "APPROVED",
      aiConfigured: true,
      feedback: `Saved. AI review was unavailable just now (${review.reason.toLowerCase().replace(/_/g, " ")}).`,
      errorLogId: errorLog.id,
    });
  }

  const { verdict, feedback, rubricScores } = review.data;
  await prisma.aiReview.create({
    data: {
      errorLogId: errorLog.id,
      model: review.model,
      verdict,
      feedback,
      rubricScores: JSON.stringify(rubricScores),
    },
  });
  await prisma.errorLog.update({
    where: { id: errorLog.id },
    data: { aiReviewStatus: verdict, aiFeedback: feedback },
  });

  return NextResponse.json({
    status: verdict,
    aiConfigured: true,
    feedback,
    rubricScores,
    errorLogId: errorLog.id,
  });
}
