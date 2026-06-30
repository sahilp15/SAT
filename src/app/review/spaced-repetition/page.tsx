import { QuestionRunner } from "@/components/QuestionRunner";
import { getLocalUser } from "@/lib/user";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SpacedRepetitionPage() {
  const user = await getLocalUser();
  const now = new Date();
  const due = await prisma.srsItem.count({
    where: { userId: user.id, active: true, dueDate: { lte: now } },
  });
  const total = await prisma.srsItem.count({ where: { userId: user.id, active: true } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Spaced Repetition Review</h1>
        <p className="mt-1 text-slate-500">
          {due} due today · {total} total in your queue. Answer confidently and correctly to push
          items further out; miss one and it comes back sooner — with a fresh error log.
        </p>
      </div>
      <QuestionRunner config={{ mode: "srs" }} />
    </div>
  );
}
