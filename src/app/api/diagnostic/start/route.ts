import { NextResponse } from "next/server";
import { getLocalUser } from "@/lib/user";
import { DiagnosticUnavailableError, startOrResumeSession } from "@/lib/diagnostic/session";

export const dynamic = "force-dynamic";

/** Resume an in-progress diagnostic, or start a new one. */
export async function POST() {
  const user = await getLocalUser();
  try {
    const session = await startOrResumeSession(user.id);
    return NextResponse.json({ sessionId: session.id, currentIndex: session.currentIndex });
  } catch (err) {
    if (err instanceof DiagnosticUnavailableError) {
      return NextResponse.json({ error: "unavailable", message: err.message }, { status: 503 });
    }
    throw err;
  }
}
