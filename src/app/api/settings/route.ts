import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { generateAndSavePlan } from "@/lib/planning";
import { settingsSchema, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const user = await getLocalUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
  const d = parsed.data;

  await prisma.settings.update({
    where: { userId: user.id },
    data: {
      theme: d.theme ?? undefined,
      defaultTimerSecs: d.defaultTimerSecs ?? undefined,
      aiEnabled: d.aiEnabled ?? undefined,
    },
  });

  const profileTouched =
    d.satDateId !== undefined ||
    d.testDate !== undefined ||
    d.targetScore !== undefined ||
    d.dailyGoalQuestions !== undefined ||
    d.wantsReminders !== undefined;

  if (profileTouched) {
    await prisma.studentProfile.update({
      where: { userId: user.id },
      data: {
        satDateId: d.satDateId ?? undefined,
        testDate: d.testDate ?? undefined,
        targetScore: d.targetScore ?? undefined,
        dailyGoalQuestions: d.dailyGoalQuestions ?? undefined,
        wantsReminders: d.wantsReminders ?? undefined,
      },
    });
  }

  // A changed test date or target invalidates the whole schedule.
  if (d.satDateId !== undefined || d.testDate !== undefined || d.targetScore !== undefined) {
    await generateAndSavePlan(user.id);
  }

  return NextResponse.json({ ok: true });
}
