import { NextResponse } from "next/server";
import { getLocalUser } from "@/lib/user";
import { DiagnosticUnavailableError, startOrResumeSession } from "@/lib/diagnostic/session";
import { diagnosticStartSchema, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Resume an in-progress diagnostic, or start a new one. An optional `formId`
 * picks a specific diagnostic; without it, the next one not yet taken is chosen.
 */
export async function POST(request: Request) {
  const user = await getLocalUser();

  // The body is optional — a bare POST means "whatever comes next".
  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: "The request body was not valid JSON." },
      { status: 400 }
    );
  }

  const parsed = diagnosticStartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 });
  }

  try {
    const session = await startOrResumeSession(user.id, parsed.data.formId);
    return NextResponse.json({
      sessionId: session.id,
      formId: session.formId,
      currentIndex: session.currentIndex,
    });
  } catch (err) {
    if (err instanceof DiagnosticUnavailableError) {
      return NextResponse.json({ error: "unavailable", message: err.message }, { status: 503 });
    }
    throw err;
  }
}
