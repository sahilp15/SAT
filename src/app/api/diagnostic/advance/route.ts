import { NextRequest, NextResponse } from "next/server";
import { getLocalUser } from "@/lib/user";
import { advanceBlock, DiagnosticUnavailableError } from "@/lib/diagnostic/session";
import { sessionIdSchema, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Lock the current block of five and move on. After a routing block this is
 * where the adaptive track is decided; the chosen track is returned so the UI
 * can tell the student what just happened.
 */
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
    const result = await advanceBlock(user.id, parsed.data.sessionId);
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 404 });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof DiagnosticUnavailableError) {
      return NextResponse.json({ error: "unavailable", message: err.message }, { status: 503 });
    }
    throw err;
  }
}
