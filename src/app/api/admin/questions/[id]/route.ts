import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const choiceSchema = z.object({
  label: z.string(),
  content: z.string(),
  isCorrect: z.boolean(),
  rationaleWrong: z.string().nullable().optional(),
});

const schema = z.object({
  stem: z.string().optional(),
  stimulus: z.string().nullable().optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().nullable().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  domain: z.string().optional(),
  skill: z.string().optional(),
  isBluebook: z.boolean().optional(),
  reviewStatus: z.enum(["OK", "NEEDS_REVIEW"]).optional(),
  choices: z.array(choiceSchema).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { choices, ...rest } = parsed.data;

  await prisma.question.update({
    where: { id: params.id },
    data: {
      ...rest,
      stimulus: rest.stimulus === undefined ? undefined : rest.stimulus,
    },
  });

  if (choices) {
    await prisma.answerChoice.deleteMany({ where: { questionId: params.id } });
    await prisma.answerChoice.createMany({
      data: choices.map((c) => ({
        questionId: params.id,
        label: c.label,
        content: c.content,
        isCorrect: c.isCorrect,
        rationaleWrong: c.rationaleWrong ?? null,
      })),
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.question.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
