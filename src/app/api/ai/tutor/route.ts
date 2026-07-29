import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { isAiConfigured, tutorRespond } from "@/lib/ai";
import { buildTutorProfile, buildTutorQuestion } from "@/lib/tutorContext";
import { tutorSchema, validationError } from "@/lib/validation";
import { offlineTutorReply } from "@/lib/tutorFallback";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

/**
 * The AI tutor endpoint. The API key stays on the server; the browser only ever
 * sends a mode plus a message and receives text back.
 *
 * When AI is unavailable — no key, rate limited, timed out — this still returns
 * a useful reply built from local data, so the tutor degrades instead of
 * breaking.
 */
export async function POST(req: NextRequest) {
  const user = await getLocalUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = tutorSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(validationError(parsed.error), { status: 400 });
  const { mode, message, questionId, attemptId, threadKey = "main" } = parsed.data;

  const settings = await prisma.settings.findUnique({ where: { userId: user.id } });
  const aiOn = isAiConfigured() && settings?.aiEnabled !== false;

  const [profile, question, history] = await Promise.all([
    buildTutorProfile(user.id),
    buildTutorQuestion(user.id, questionId, attemptId),
    prisma.tutorMessage.findMany({
      where: { userId: user.id, threadKey },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
  ]);

  await prisma.tutorMessage.create({
    data: { userId: user.id, threadKey, role: "user", mode, content: message },
  });

  if (!aiOn) {
    const fallback = offlineTutorReply(mode, profile, question);
    await prisma.tutorMessage.create({
      data: { userId: user.id, threadKey, role: "assistant", mode, content: fallback.reply },
    });
    return NextResponse.json({ ...fallback, source: "offline" });
  }

  const result = await tutorRespond({
    mode,
    message,
    profile,
    question,
    history: history.map((h) => ({
      role: h.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: h.content,
    })),
  });

  if (!result.ok) {
    const fallback = offlineTutorReply(mode, profile, question, result.reason);
    await prisma.tutorMessage.create({
      data: { userId: user.id, threadKey, role: "assistant", mode, content: fallback.reply },
    });
    return NextResponse.json({ ...fallback, source: "offline", aiError: result.reason });
  }

  await prisma.tutorMessage.create({
    data: {
      userId: user.id,
      threadKey,
      role: "assistant",
      mode,
      content: result.data.reply,
      dataJson: result.data.generatedQuestion
        ? JSON.stringify(result.data.generatedQuestion)
        : null,
    },
  });

  return NextResponse.json({ ...result.data, source: "ai" });
}
