import { NextRequest, NextResponse } from "next/server";
import { getLocalUser } from "@/lib/user";
import { getNextQuestion, type SelectOptions } from "@/lib/practice";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getLocalUser();
  const sp = req.nextUrl.searchParams;
  const section = sp.get("section");
  const opts: SelectOptions = {
    section: section === "MATH" || section === "READING_WRITING" ? section : undefined,
    mode: sp.get("mode") ?? "practice",
    difficulty: (sp.get("difficulty") as SelectOptions["difficulty"]) ?? undefined,
    skill: sp.get("skill") ?? undefined,
    domain: sp.get("domain") ?? undefined,
    calculator: (sp.get("calculator") as SelectOptions["calculator"]) ?? undefined,
    regression: sp.get("regression") === "true" ? true : undefined,
  };
  const question = await getNextQuestion(user.id, opts);
  return NextResponse.json({ question });
}
