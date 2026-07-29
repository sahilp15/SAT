import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { isAiConfigured } from "@/lib/ai";
import { TutorChat, type TutorQuestionSummary } from "@/components/tutor/TutorChat";
import { PageHeader } from "@/components/ui";
import type { TutorMode } from "@/lib/ai/prompts";

export const dynamic = "force-dynamic";

const MODES: TutorMode[] = [
  "TEACH",
  "HINT",
  "CHECK",
  "SIMILAR",
  "EXPLAIN_MISTAKE",
  "QUIZ",
  "PLAN",
];

function parseGenerated(json: string | null) {
  if (!json) return null;
  try {
    return JSON.parse(json) as {
      stem: string;
      choices: { label: string; content: string }[];
      correctAnswer: string;
      explanation: string;
      skill: string;
      difficulty: string;
    };
  } catch {
    return null;
  }
}

export default async function TutorPage({
  searchParams,
}: {
  searchParams: { mode?: string; questionId?: string; attemptId?: string };
}) {
  const user = await getLocalUser();

  const mode: TutorMode = MODES.includes(searchParams.mode as TutorMode)
    ? (searchParams.mode as TutorMode)
    : "TEACH";

  const [settings, history, weakest] = await Promise.all([
    prisma.settings.findUnique({ where: { userId: user.id } }),
    prisma.tutorMessage.findMany({
      where: { userId: user.id, threadKey: "main" },
      orderBy: { createdAt: "asc" },
      take: 40,
    }),
    prisma.topicMastery.findMany({
      where: { userId: user.id, attempts: { gte: 2 } },
      orderBy: { mastery: "asc" },
      take: 2,
    }),
  ]);

  // Resolve the question in scope, if the tutor was opened from one.
  let question: TutorQuestionSummary | null = null;
  if (searchParams.attemptId) {
    const attempt = await prisma.questionAttempt.findFirst({
      where: { id: searchParams.attemptId, userId: user.id },
      include: { question: true },
    });
    if (attempt) {
      question = {
        id: attempt.questionId,
        skill: attempt.question.skill,
        domain: attempt.question.domain,
        section: attempt.question.section,
        difficulty: attempt.question.difficulty,
        stem: attempt.question.stem,
        chosenAnswer: attempt.chosenAnswer || null,
        correctAnswer: attempt.question.correctAnswer,
        wasCorrect: attempt.isCorrect,
      };
    }
  } else if (searchParams.questionId) {
    const q = await prisma.question.findUnique({ where: { id: searchParams.questionId } });
    if (q) {
      question = {
        id: q.id,
        skill: q.skill,
        domain: q.domain,
        section: q.section,
        difficulty: q.difficulty,
        stem: q.stem,
        chosenAnswer: null,
        correctAnswer: q.correctAnswer,
        wasCorrect: null,
      };
    }
  }

  const suggestions = [
    "What should I study today?",
    ...weakest.map((w) => `Teach me ${w.skill}`),
    "Review my recent mistakes",
  ].slice(0, 4);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="AI Tutor"
        title="Ask about anything"
        description="The tutor already knows your diagnostic results, skill mastery, recent mistakes, plan, and test date. Pick a mode on the right — it changes what the tutor is allowed to do."
      />
      <TutorChat
        initialMessages={history.map((m) => ({
          id: m.id,
          role: m.role === "assistant" ? "assistant" : "user",
          mode: m.mode,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          generatedQuestion: parseGenerated(m.dataJson),
        }))}
        initialMode={mode}
        question={question}
        aiEnabled={isAiConfigured() && settings?.aiEnabled !== false}
        suggestions={suggestions}
      />
    </div>
  );
}
