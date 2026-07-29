import { NextRequest, NextResponse } from "next/server";
import { getLocalUser } from "@/lib/user";
import { getSessionState } from "@/lib/diagnostic/session";

export const dynamic = "force-dynamic";

/** Client-safe snapshot used to restore the player after a refresh. */
export async function GET(req: NextRequest) {
  const user = await getLocalUser();
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "missing_session" }, { status: 400 });
  }
  const state = await getSessionState(user.id, sessionId);
  if (!state) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(state);
}
