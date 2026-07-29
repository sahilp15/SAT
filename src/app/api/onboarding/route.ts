import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { generateAndSavePlan } from "@/lib/planning";
import { onboardingSchema, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Saves onboarding answers. Called on every step (so backing out never loses
 * work) and once more with `complete: true` at the end, which is when the plan
 * is generated.
 */
export async function POST(req: NextRequest) {
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

  // Weekly hours stay in sync with the days x minutes the student actually
  // committed to, so the planner and the legacy field never disagree.
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
      hasTakenOfficial: d.priorTestType === "SAT" ? true : undefined,
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
      diagnosticChoice: d.diagnosticChoice ?? undefined,
      onboardingStep: d.onboardingStep ?? undefined,
      onboardingComplete: d.complete ? true : undefined,
    },
  });

  if (d.complete) await generateAndSavePlan(user.id);

  return NextResponse.json({ ok: true });
}
