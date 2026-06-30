import { NextResponse } from "next/server";
import { getLocalUser } from "@/lib/user";
import { generateAndSavePlan } from "@/lib/planning";

export const dynamic = "force-dynamic";

// Regenerate the study plan on demand (reflects latest in-app performance).
export async function POST() {
  const user = await getLocalUser();
  const plan = await generateAndSavePlan(user.id);
  return NextResponse.json({ ok: true, plan });
}
