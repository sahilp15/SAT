import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { generateAndSavePlan } from "@/lib/planning";

export const dynamic = "force-dynamic";

const schema = z.object({
  grade: z.number().int().min(6).max(12).nullable().optional(),
  satDateId: z.string().nullable().optional(),
  targetScore: z.number().int().min(400).max(1600).nullable().optional(),
  hasTakenOfficial: z.boolean().optional(),
  lastOfficialTotal: z.number().int().min(400).max(1600).nullable().optional(),
  hasTakenBluebook: z.boolean().optional(),
  lastTotalScore: z.number().int().min(400).max(1600).nullable().optional(),
  lastMathScore: z.number().int().min(200).max(800).nullable().optional(),
  lastRwScore: z.number().int().min(200).max(800).nullable().optional(),
  weeklyHours: z.number().int().min(0).max(80).nullable().optional(),
  availableDays: z.array(z.string()).optional(),
  strongerSection: z.enum(["MATH", "READING_WRITING", "BALANCED"]).nullable().optional(),
  planIntensity: z.enum(["AGGRESSIVE", "BALANCED", "LIGHT"]).optional(),
  diagnosticChoice: z.enum(["TAKE_TEST_1", "SKIP_AND_PRACTICE"]).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getLocalUser();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  await prisma.studentProfile.update({
    where: { userId: user.id },
    data: {
      grade: d.grade ?? undefined,
      satDateId: d.satDateId ?? undefined,
      targetScore: d.targetScore ?? undefined,
      hasTakenOfficial: d.hasTakenOfficial ?? undefined,
      lastOfficialTotal: d.lastOfficialTotal ?? undefined,
      hasTakenBluebook: d.hasTakenBluebook ?? undefined,
      lastTotalScore: d.lastTotalScore ?? undefined,
      lastMathScore: d.lastMathScore ?? undefined,
      lastRwScore: d.lastRwScore ?? undefined,
      weeklyHours: d.weeklyHours ?? undefined,
      availableDays: d.availableDays ? JSON.stringify(d.availableDays) : undefined,
      strongerSection: d.strongerSection ?? undefined,
      planIntensity: d.planIntensity ?? undefined,
      diagnosticChoice: d.diagnosticChoice ?? undefined,
      onboardingComplete: true,
    },
  });

  await generateAndSavePlan(user.id);
  return NextResponse.json({ ok: true });
}
