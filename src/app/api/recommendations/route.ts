import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { recommendationSchema, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Mark a recommendation done or dismissed. */
export async function PATCH(req: NextRequest) {
  const user = await getLocalUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = recommendationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });

  const updated = await prisma.skillRecommendation.updateMany({
    where: { id: parsed.data.id, userId: user.id },
    data: { status: parsed.data.status },
  });
  if (updated.count === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
