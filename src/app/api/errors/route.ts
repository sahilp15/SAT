import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { errorEntrySchema, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Update one error-log entry: the student's own note, whether they consider it
 * understood, and whether the AI/heuristic mistake diagnosis was accurate.
 */
export async function PATCH(req: NextRequest) {
  const user = await getLocalUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = errorEntrySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
  const d = parsed.data;

  const attempt = await prisma.questionAttempt.findFirst({
    where: { id: d.attemptId, userId: user.id },
    select: { id: true },
  });
  if (!attempt) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.questionAttempt.update({
    where: { id: attempt.id },
    data: {
      note: d.note === undefined ? undefined : d.note,
      resolved: d.resolved ?? undefined,
      resolvedAt: d.resolved === undefined ? undefined : d.resolved ? new Date() : null,
    },
  });

  if (d.diagnosisFeedback !== undefined) {
    await prisma.mistakeDiagnosis.updateMany({
      where: { attemptId: attempt.id, userId: user.id },
      data: { userFeedback: d.diagnosisFeedback },
    });
  }

  return NextResponse.json({ ok: true });
}
