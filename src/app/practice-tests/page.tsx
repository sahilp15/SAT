import { getLocalUser } from "@/lib/user";
import { prisma } from "@/lib/db";
import { PracticeTestManager } from "@/components/PracticeTestManager";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PracticeTestsPage() {
  const user = await getLocalUser();
  const [scheduled, results] = await Promise.all([
    prisma.practiceTestSchedule.findMany({
      where: { userId: user.id, completed: false },
      orderBy: { scheduledFor: "asc" },
    }),
    prisma.practiceTestResult.findMany({
      where: { userId: user.id },
      orderBy: { takenOn: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Practice tests"
        title="Full-length tests"
        description="The score predictor estimates from 20 questions; a full-length test is the only thing that measures stamina and real pacing. Take these in Bluebook under test conditions and log the results here — your plan re-plans around them."
      />
      <PracticeTestManager
        scheduled={scheduled.map((t) => ({
          id: t.id,
          testLabel: t.testLabel,
          scheduledFor: t.scheduledFor.toISOString(),
          kind: t.kind,
          completed: t.completed,
        }))}
        results={results.map((r) => ({
          id: r.id,
          testLabel: r.testLabel,
          takenOn: r.takenOn.toISOString(),
          totalScore: r.totalScore,
          mathScore: r.mathScore,
          rwScore: r.rwScore,
        }))}
      />
    </div>
  );
}
