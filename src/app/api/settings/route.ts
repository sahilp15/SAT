import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";

export const dynamic = "force-dynamic";

const schema = z.object({
  theme: z.enum(["light", "dark"]).optional(),
  defaultTimerSecs: z.number().int().min(15).max(600).optional(),
  aiEnabled: z.boolean().optional(),
  // Profile fields editable from settings.
  satDateId: z.string().nullable().optional(),
  targetScore: z.number().int().min(400).max(1600).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await getLocalUser();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  await prisma.settings.update({
    where: { userId: user.id },
    data: {
      theme: d.theme ?? undefined,
      defaultTimerSecs: d.defaultTimerSecs ?? undefined,
      aiEnabled: d.aiEnabled ?? undefined,
    },
  });
  if (d.satDateId !== undefined || d.targetScore !== undefined) {
    await prisma.studentProfile.update({
      where: { userId: user.id },
      data: {
        satDateId: d.satDateId ?? undefined,
        targetScore: d.targetScore ?? undefined,
      },
    });
  }
  return NextResponse.json({ ok: true });
}
