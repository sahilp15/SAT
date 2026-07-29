import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { generateAndSavePlan } from "@/lib/planning";
import { onboardingSchema, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Edit the study profile after onboarding. Reuses the onboarding schema so the
 * two surfaces can never drift, and always re-plans since every field here
 * feeds the schedule.
 */
export async function PATCH(req: NextRequest) {
  const user = await getLocalUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
  const d = parsed.data;

  const weeklyHours =
    d.daysPerWeek != null && d.minutesPerDay != null
      ? Math.max(1, Math.round((d.daysPerWeek * d.minutesPerDay) / 60))
      : undefined;

  await prisma.studentProfile.update({
    where: { userId: user.id },
    data: {
      grade: d.grade ?? undefined,
      satDateId: d.satDateId ?? undefined,
      testDate: d.testDate ?? undefined,
      targetScore: d.targetScore ?? undefined,
      priorTestType: d.priorTestType ?? undefined,
      lastTotalScore: d.lastTotalScore ?? undefined,
      lastMathScore: d.lastMathScore ?? undefined,
      lastRwScore: d.lastRwScore ?? undefined,
      strongerSection: d.strongerSection ?? undefined,
      weakerSection: d.weakerSection ?? undefined,
      strugglingTopics: d.strugglingTopics ? JSON.stringify(d.strugglingTopics) : undefined,
      daysPerWeek: d.daysPerWeek ?? undefined,
      minutesPerDay: d.minutesPerDay ?? undefined,
      weeklyHours,
      availableDays: d.availableDays ? JSON.stringify(d.availableDays) : undefined,
      preferredStudyTimes: d.preferredStudyTimes
        ? JSON.stringify(d.preferredStudyTimes)
        : undefined,
      studyStyle: d.studyStyle ?? undefined,
      wantsReminders: d.wantsReminders ?? undefined,
      dailyGoalQuestions: d.dailyGoalQuestions ?? undefined,
      planIntensity: d.planIntensity ?? undefined,
    },
  });

  await generateAndSavePlan(user.id);
  return NextResponse.json({ ok: true });
}
