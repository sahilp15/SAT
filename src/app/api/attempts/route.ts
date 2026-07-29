import { NextRequest, NextResponse } from "next/server";
import { getLocalUser } from "@/lib/user";
import { recordAttempt } from "@/lib/practice";
import { attemptSchema, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getLocalUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = attemptSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });

  const result = await recordAttempt(user.id, parsed.data);
  return NextResponse.json(result);
}
