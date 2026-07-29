import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

const schema = z.object({
  // "progress" wipes performance data but keeps the profile and questions.
  // "all" also resets the profile back to defaults and reruns onboarding.
  scope: z.enum(["progress", "all"]),
});

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

  // Ordered so child rows go before their parents; questions are never touched.
  await prisma.$transaction([
    prisma.aiReview.deleteMany({ where: { errorLog: { userId: user.id } } }),
    prisma.errorLog.deleteMany({ where: { userId: user.id } }),
    prisma.mistakeDiagnosis.deleteMany({ where: { userId: user.id } }),
    prisma.diagnosticResult.deleteMany({ where: { userId: user.id } }),
    prisma.diagnosticSession.deleteMany({ where: { userId: user.id } }),
    prisma.questionAttempt.deleteMany({ where: { userId: user.id } }),
    prisma.srsItem.deleteMany({ where: { userId: user.id } }),
    prisma.topicMastery.deleteMany({ where: { userId: user.id } }),
    prisma.skillRecommendation.deleteMany({ where: { userId: user.id } }),
    prisma.studyPlanDay.deleteMany({ where: { userId: user.id } }),
    prisma.studyPlan.deleteMany({ where: { userId: user.id } }),
    prisma.tutorMessage.deleteMany({ where: { userId: user.id } }),
    prisma.practiceTestSchedule.deleteMany({ where: { userId: user.id } }),
    prisma.practiceTestResult.deleteMany({ where: { userId: user.id } }),
  ]);

  if (parsed.data.scope === "all") {
    await prisma.studentProfile.update({
      where: { userId: user.id },
      data: {
        grade: null,
        satDateId: null,
        testDate: null,
        targetScore: null,
        hasTakenOfficial: false,
        lastOfficialTotal: null,
        hasTakenBluebook: false,
        lastTotalScore: null,
        lastMathScore: null,
        lastRwScore: null,
        priorTestType: null,
        weeklyHours: null,
        daysPerWeek: null,
        minutesPerDay: null,
        availableDays: null,
        strongerSection: null,
        weakerSection: null,
        strugglingTopics: null,
        studyStyle: null,
        preferredStudyTimes: null,
        wantsReminders: true,
        dailyGoalQuestions: 20,
        planIntensity: "BALANCED",
        diagnosticChoice: null,
        onboardingComplete: false,
        onboardingStep: 0,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
