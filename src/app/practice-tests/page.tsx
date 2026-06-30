import { getLocalUser } from "@/lib/user";
import { prisma } from "@/lib/db";
import { PracticeTestManager } from "@/components/PracticeTestManager";

export const dynamic = "force-dynamic";

export default async function PracticeTestsPage() {
  const user = await getLocalUser();
  const scheduled = await prisma.practiceTestSchedule.findMany({
    where: { userId: user.id, completed: false },
    orderBy: { scheduledFor: "asc" },
  });
  const results = await prisma.practiceTestResult.findMany({
    where: { userId: user.id },
    orderBy: { takenOn: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Practice Test Planner</h1>
        <p className="mt-1 text-slate-500">
          Schedule and log full-length Bluebook practice tests. Reserve official tests for realistic
          diagnostics — the schedule spaces them strategically before your SAT.
        </p>
      </div>
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
