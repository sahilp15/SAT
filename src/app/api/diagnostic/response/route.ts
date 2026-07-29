import { NextRequest, NextResponse } from "next/server";
import { getLocalUser } from "@/lib/user";
import { saveResponse } from "@/lib/diagnostic/session";
import { diagnosticResponseSchema, validationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Autosave one diagnostic response. Deliberately returns nothing about
 * correctness — the student must not be able to learn answers mid-test by
 * watching the network tab.
 */
export async function POST(req: NextRequest) {
  const user = await getLocalUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = diagnosticResponseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });

  const { sessionId, ...input } = parsed.data;
  const result = await saveResponse(user.id, sessionId, input);
  if (!result.ok) {
    const status = result.reason === "LOCKED" ? 409 : 404;
    return NextResponse.json({ error: result.reason.toLowerCase() }, { status });
  }
  return NextResponse.json({ ok: true });
}
