import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { analyzeMistakeWithAi, isAiConfigured } from "@/lib/ai";
import { validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

const schema = z.object({ attemptId: z.string().min(1).max(64) });

/**
 * Upgrade a heuristic mistake diagnosis to a full AI analysis. The heuristic row
 * already exists, so a failure here leaves the student exactly where they were.
 */
export async function POST(req: NextRequest) {
  const user = await getLocalUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });

  const settings = await prisma.settings.findUnique({ where: { userId: user.id } });
  if (!isAiConfigured() || settings?.aiEnabled === false) {
    return NextResponse.json(
      {
        error: "ai_unavailable",
        message:
          "AI analysis is off. Your local diagnosis is still shown — add an OPENAI_API_KEY to enable the deeper write-up.",
      },
      { status: 503 }
    );
  }

  const attempt = await prisma.questionAttempt.findFirst({
    where: { id: parsed.data.attemptId, userId: user.id },
    include: { question: { include: { choices: { orderBy: { label: "asc" } } } } },
  });
  if (!attempt) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (attempt.isCorrect) {
    return NextResponse.json({ error: "not_a_miss" }, { status: 400 });
  }

  const [existing, mastery] = await Promise.all([
    prisma.mistakeDiagnosis.findUnique({ where: { attemptId: attempt.id } }),
    prisma.topicMastery.findUnique({
      where: {
        userId_section_domain_skill: {
          userId: user.id,
          section: attempt.question.section,
          domain: attempt.question.domain,
          skill: attempt.question.skill,
        },
      },
      select: { accuracy: true, attempts: true },
    }),
  ]);

  const result = await analyzeMistakeWithAi(
    {
      section: attempt.question.section,
      domain: attempt.question.domain,
      skill: attempt.question.skill,
      subskill: attempt.question.subskill,
      difficulty: attempt.question.difficulty,
      format: attempt.question.format,
      stem: attempt.question.stem,
      choices: attempt.question.choices.map((c) => ({ label: c.label, content: c.content })),
      correctAnswer: attempt.question.correctAnswer,
      officialExplanation: attempt.question.explanation,
      chosenAnswer: attempt.chosenAnswer || null,
      timeSpentSec: Math.round((attempt.timeMs ?? 0) / 1000),
      recommendedSec: attempt.question.timeRecommendationSec ?? 90,
      answerChanges: attempt.answerChanges,
      priorAccuracyOnSkill: mastery?.accuracy ?? null,
      priorAttemptsOnSkill: mastery?.attempts ?? 0,
      heuristicCategory: existing?.category ?? "unknown",
    },
    // Deterministic per attempt: re-asking costs nothing after the first call.
    `mistake:${attempt.id}`
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.reason, message: result.message }, { status: 503 });
  }

  const data = result.data;
  await prisma.mistakeDiagnosis.upsert({
    where: { attemptId: attempt.id },
    create: {
      userId: user.id,
      attemptId: attempt.id,
      category: data.category,
      confidence: data.confidence,
      testing: data.testing,
      whyWrong: data.whyWrong,
      whyCorrect: data.whyCorrect,
      lesson: data.lesson,
      nextStep: data.nextStep,
      similarJson: JSON.stringify(data.similar),
      source: "ai",
      model: result.model,
      // A fresh analysis invalidates the student's rating of the previous one.
      userFeedback: null,
    },
    update: {
      category: data.category,
      confidence: data.confidence,
      testing: data.testing,
      whyWrong: data.whyWrong,
      whyCorrect: data.whyCorrect,
      lesson: data.lesson,
      nextStep: data.nextStep,
      similarJson: JSON.stringify(data.similar),
      source: "ai",
      model: result.model,
      userFeedback: null,
    },
  });

  return NextResponse.json({ ...data, source: "ai", cached: result.cached });
}
