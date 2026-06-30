import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLocalUser } from "@/lib/user";
import { recordAttempt } from "@/lib/practice";

export const dynamic = "force-dynamic";

const schema = z.object({
  questionId: z.string(),
  chosenAnswer: z.string(),
  mode: z.string().optional(),
  confidence: z.enum(["GUESS", "UNSURE", "CONFIDENT"]).nullable().optional(),
  timeMs: z.number().int().nonnegative().optional(),
  isReview: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getLocalUser();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await recordAttempt(user.id, parsed.data);
  return NextResponse.json(result);
}
