import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";

export const dynamic = "force-dynamic";

const schema = z.object({
  // "progress" wipes attempts/logs/SRS/plans but keeps questions + profile.
  // "all" also clears the student profile back to defaults.
  scope: z.enum(["progress", "all"]),
});

// Local data reset. Mirrors the README "reset local progress" instructions.
export async function POST(req: NextRequest) {
  const user = await getLocalUser();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.errorLog.deleteMany({ where: { userId: user.id } }),
    prisma.questionAttempt.deleteMany({ where: { userId: user.id } }),
    prisma.srsItem.deleteMany({ where: { userId: user.id } }),
    prisma.topicMastery.deleteMany({ where: { userId: user.id } }),
    prisma.studyPlan.deleteMany({ where: { userId: user.id } }),
    prisma.practiceTestSchedule.deleteMany({ where: { userId: user.id } }),
    prisma.practiceTestResult.deleteMany({ where: { userId: user.id } }),
  ]);

  if (parsed.data.scope === "all") {
    await prisma.studentProfile.update({
      where: { userId: user.id },
      data: {
        grade: null,
        satDateId: null,
        targetScore: null,
        hasTakenOfficial: false,
        lastOfficialTotal: null,
        hasTakenBluebook: false,
        lastTotalScore: null,
        lastMathScore: null,
        lastRwScore: null,
        weeklyHours: null,
        availableDays: null,
        strongerSection: null,
        planIntensity: "BALANCED",
        diagnosticChoice: null,
        onboardingComplete: false,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
