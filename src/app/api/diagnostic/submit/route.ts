import { NextRequest, NextResponse } from "next/server";
import { getLocalUser } from "@/lib/user";
import { DiagnosticNotFoundError, submitSession } from "@/lib/diagnostic/session";
import { generateAndSavePlan } from "@/lib/planning";
import { sessionIdSchema, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";
// Scoring fans out into attempts, mastery, diagnoses, and the plan rebuild.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getLocalUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = sessionIdSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });

  try {
    const result = await submitSession(user.id, parsed.data.sessionId);
    // The plan is rebuilt from the fresh mastery data the submission just wrote.
    await generateAndSavePlan(user.id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof DiagnosticNotFoundError) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    throw err;
  }
}
