import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { planDaySchema, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Mark a scheduled study day complete (or undo it). */
export async function PATCH(req: NextRequest) {
  const user = await getLocalUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = planDaySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });

  const updated = await prisma.studyPlanDay.updateMany({
    where: { id: parsed.data.dayId, userId: user.id },
    data: {
      completed: parsed.data.completed,
      completedAt: parsed.data.completed ? new Date() : null,
    },
  });
  if (updated.count === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
