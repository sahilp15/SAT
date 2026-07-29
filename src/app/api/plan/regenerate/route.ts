import { NextResponse } from "next/server";
import { getLocalUser } from "@/lib/user";
import { generateAndSavePlan } from "@/lib/planning";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Rebuild recommendations + schedule from the latest performance data. */
export async function POST() {
  const user = await getLocalUser();
  const snapshot = await generateAndSavePlan(user.id);
  if (!snapshot) return NextResponse.json({ error: "no_profile" }, { status: 404 });
  return NextResponse.json({
    ok: true,
    phase: snapshot.phase,
    phaseLabel: snapshot.phaseLabel,
    summary: snapshot.summary,
    daysGenerated: snapshot.daysGenerated,
    recommendations: snapshot.recommendations.length,
  });
}
