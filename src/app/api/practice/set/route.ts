import { NextRequest, NextResponse } from "next/server";
import { getLocalUser } from "@/lib/user";
import { getPracticeSet } from "@/lib/practice";
import { practiceSetSchema, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Fixed-length practice set — what a recommendation's "Start" button opens. */
export async function GET(req: NextRequest) {
  const user = await getLocalUser();
  const sp = req.nextUrl.searchParams;

  const parsed = practiceSetSchema.safeParse({
    section: sp.get("section") ?? undefined,
    skill: sp.get("skill") ?? undefined,
    domain: sp.get("domain") ?? undefined,
    difficulty: sp.get("difficulty") ?? undefined,
    count: sp.get("count") ? Number(sp.get("count")) : undefined,
  });
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });

  const questions = await getPracticeSet(user.id, parsed.data);
  return NextResponse.json({ questions });
}
