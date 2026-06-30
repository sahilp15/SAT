import { prisma } from "@/lib/db";
import { Stat } from "@/components/ui";
import { ImportReview, type ReviewQuestion } from "@/components/ImportReview";

export const dynamic = "force-dynamic";

export default async function ImportAdminPage() {
  const [total, ok, needsReview, mathCount, rwCount] = await Promise.all([
    prisma.question.count(),
    prisma.question.count({ where: { reviewStatus: "OK" } }),
    prisma.question.count({ where: { reviewStatus: "NEEDS_REVIEW" } }),
    prisma.question.count({ where: { section: "MATH" } }),
    prisma.question.count({ where: { section: "READING_WRITING" } }),
  ]);

  const flagged = await prisma.question.findMany({
    where: { reviewStatus: "NEEDS_REVIEW" },
    orderBy: { importConfidence: "asc" },
    take: 200,
    include: { choices: { orderBy: { label: "asc" } } },
  });

  const questions: ReviewQuestion[] = flagged.map((q) => ({
    id: q.id,
    externalId: q.externalId,
    section: q.section,
    domain: q.domain,
    skill: q.skill,
    difficulty: q.difficulty,
    format: q.format,
    stimulus: q.stimulus,
    stem: q.stem,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    isBluebook: q.isBluebook,
    importNotes: q.importNotes,
    importConfidence: q.importConfidence,
    choices: q.choices.map((c) => ({
      label: c.label,
      content: c.content,
      isCorrect: c.isCorrect,
      rationaleWrong: c.rationaleWrong,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Import &amp; Review</h1>
        <p className="mt-1 text-slate-500">
          Add SAT Question Bank exports (<code>.pdf</code> or <code>.txt</code>) to{" "}
          <code>data/uploads/</code> and run <code>npm run import</code>. Items the parser
          couldn&apos;t fully trust — usually math rendered as images, missing choices, or figures —
          land here for a quick fix before they enter practice.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total questions" value={total} />
        <Stat label="Ready for practice" value={ok} />
        <Stat label="Needs review" value={needsReview} />
        <Stat label="Math / R&W" value={`${mathCount} / ${rwCount}`} />
      </div>

      <ImportReview questions={questions} />
    </div>
  );
}
