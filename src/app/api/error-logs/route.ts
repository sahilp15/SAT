import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { errorLogSchema } from "@/lib/errorLogValidation";
import { reviewErrorLog } from "@/lib/ai";
import type { ErrorLogContext } from "@/lib/ai/prompts";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getLocalUser();
  const body = await req.json();
  const parsed = errorLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "incomplete", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const attempt = await prisma.questionAttempt.findUnique({
    where: { id: input.attemptId },
    include: { question: true },
  });
  if (!attempt || attempt.userId !== user.id) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  // Create (or replace) the error log for this attempt.
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
  };
  const errorLog = existing
    ? await prisma.errorLog.update({
        where: { id: existing.id },
        data: { ...baseData, revisionCount: { increment: 1 } },
      })
    : await prisma.errorLog.create({ data: { attemptId: input.attemptId, ...baseData } });

  // Server-side AI review of the reflection QUALITY (key never leaves the server).
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

  if (!review.configured) {
    // No AI key: the completeness gate above is the bar. Allow continuing.
    await prisma.errorLog.update({
      where: { id: errorLog.id },
      data: { aiReviewStatus: "NOT_REVIEWED", aiFeedback: null },
    });
    return NextResponse.json({
      status: "APPROVED",
      aiConfigured: false,
      feedback:
        "Saved. (AI review is off — add an OPENAI_API_KEY to get feedback on your reflections.)",
      errorLogId: errorLog.id,
    });
  }

  if (review.error || !review.data) {
    // AI errored: don't block the student on infra problems.
    await prisma.errorLog.update({
      where: { id: errorLog.id },
      data: { aiReviewStatus: "NOT_REVIEWED" },
    });
    return NextResponse.json({
      status: "APPROVED",
      aiConfigured: true,
      feedback: "Saved. (AI review was unavailable just now.)",
      errorLogId: errorLog.id,
    });
  }

  const { verdict, feedback, rubricScores, model } = review.data;
  await prisma.aiReview.create({
    data: {
      errorLogId: errorLog.id,
      model,
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
