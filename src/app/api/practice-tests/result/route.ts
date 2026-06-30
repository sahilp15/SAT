import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { generateAndSavePlan } from "@/lib/planning";

export const dynamic = "force-dynamic";

const schema = z.object({
  testLabel: z.string().min(1),
  totalScore: z.number().int().min(400).max(1600).nullable().optional(),
  mathScore: z.number().int().min(200).max(800).nullable().optional(),
  rwScore: z.number().int().min(200).max(800).nullable().optional(),
  missedCategories: z.array(z.string()).optional(),
  notes: z.string().optional(),
  scheduleId: z.string().optional(),
});

// Record a completed practice test, then re-plan based on the new data.
export async function POST(req: NextRequest) {
  const user = await getLocalUser();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  await prisma.practiceTestResult.create({
    data: {
      userId: user.id,
      testLabel: d.testLabel,
      totalScore: d.totalScore ?? null,
      mathScore: d.mathScore ?? null,
      rwScore: d.rwScore ?? null,
      missedCategories: d.missedCategories ? JSON.stringify(d.missedCategories) : null,
      notes: d.notes ?? null,
    },
  });

  // Taking a test counts as having a diagnostic baseline.
  await prisma.studentProfile.update({
    where: { userId: user.id },
    data: { hasTakenBluebook: true, lastTotalScore: d.totalScore ?? undefined,
      lastMathScore: d.mathScore ?? undefined, lastRwScore: d.rwScore ?? undefined },
  });

  if (d.scheduleId) {
    await prisma.practiceTestSchedule
      .update({ where: { id: d.scheduleId }, data: { completed: true } })
      .catch(() => {});
  }

  await generateAndSavePlan(user.id);
  return NextResponse.json({ ok: true });
}
