import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocalUserWithProfile } from "@/lib/user";
import { prisma } from "@/lib/db";
import { getOverview, readinessEstimate } from "@/lib/analytics";
import { getSatDateById, daysUntil } from "@/lib/satDates";
import { PHASE_LABELS, type StudyPhase } from "@/lib/studyPlan";
import { Card, Stat, ProgressBar, Chip } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getLocalUserWithProfile();
  if (!user.profile?.onboardingComplete) redirect("/onboarding");

  const profile = user.profile;
  const overview = await getOverview(user.id);
  const plan = await prisma.studyPlan.findFirst({
    where: { userId: user.id, active: true },
    include: { tasks: { orderBy: { orderIndex: "asc" } } },
  });
  const upcomingTests = await prisma.practiceTestSchedule.findMany({
    where: { userId: user.id, completed: false },
    orderBy: { scheduledFor: "asc" },
    take: 4,
  });

  const satDate = getSatDateById(profile.satDateId);
  const countdown = satDate ? daysUntil(satDate) : null;
  const readiness = readinessEstimate(overview, profile.targetScore);

  const weekly = plan?.tasks.filter((t) => t.cadence === "weekly") ?? [];
  const daily = plan?.tasks.filter((t) => t.cadence === "daily") ?? [];

  const weakest = overview.byTopic.filter((t) => t.attempts >= 2).slice(0, 3);
  const strongest = [...overview.byTopic]
    .filter((t) => t.attempts >= 2)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">
            {plan?.phase ? (
              <>
                Current phase: <b>{PHASE_LABELS[plan.phase as StudyPhase] ?? plan.phase}</b>
              </>
            ) : (
              "Let's get to work."
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/review/spaced-repetition" className="btn-secondary">
            Review due ({overview.srsDue})
          </Link>
          <Link href="/practice/math" className="btn-primary">
            Practice now
          </Link>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat
          label="SAT countdown"
          value={countdown != null ? `${countdown}d` : "—"}
          sub={satDate?.label ?? "Set a date in Settings"}
        />
        <Stat
          label="Target score"
          value={profile.targetScore ?? "—"}
          sub={profile.lastTotalScore ? `Last: ${profile.lastTotalScore}` : "No baseline yet"}
        />
        <Stat
          label="Overall accuracy"
          value={`${Math.round(overview.accuracy * 100)}%`}
          sub={`${overview.correct}/${overview.answered} correct`}
        />
        <Stat
          label="Due for review"
          value={overview.srsDue}
          sub={`${overview.srsTotal} in queue`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Plan */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Your study plan</h2>
              <Chip>{plan?.generatedBy === "ai" ? "AI-personalized" : "Rule-based"}</Chip>
            </div>
            {plan?.summary ? (
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{plan.summary}</p>
            ) : null}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  This week
                </div>
                <ul className="mt-2 space-y-2">
                  {weekly.length ? (
                    weekly.map((t) => (
                      <li key={t.id} className="text-sm text-slate-700">
                        <span className="font-medium">{t.title}</span>
                        {t.description ? (
                          <div className="text-xs text-slate-500">{t.description}</div>
                        ) : null}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-400">No weekly tasks yet.</li>
                  )}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Today
                </div>
                <ul className="mt-2 space-y-2">
                  {daily.length ? (
                    daily.map((t) => (
                      <li key={t.id} className="text-sm text-slate-700">
                        <span className="font-medium">{t.title}</span>
                        {t.description ? (
                          <div className="text-xs text-slate-500">{t.description}</div>
                        ) : null}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-400">No daily tasks yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </Card>

          {/* Accuracy by section / difficulty */}
          <Card>
            <h2 className="font-semibold text-slate-900">Accuracy</h2>
            <div className="mt-3 space-y-3">
              {overview.bySection.map((s) => (
                <div key={s.section}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-600">
                      {s.section === "MATH" ? "Math" : "Reading & Writing"}
                    </span>
                    <span className="font-medium">
                      {Math.round(s.accuracy * 100)}% ({s.answered})
                    </span>
                  </div>
                  <ProgressBar value={s.accuracy * 100} />
                </div>
              ))}
              {overview.bySection.length === 0 ? (
                <p className="text-sm text-slate-400">No attempts yet — start practicing.</p>
              ) : null}
            </div>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-slate-900">Readiness</h2>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-3xl font-bold text-brand-600">{readiness.pct}%</span>
              <span className="mb-1 text-sm text-slate-500">{readiness.label}</span>
            </div>
            <div className="mt-2">
              <ProgressBar value={readiness.pct} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{readiness.note}</p>
          </Card>

          <Card>
            <h2 className="font-semibold text-slate-900">Strengths & weaknesses</h2>
            <div className="mt-3 text-sm">
              <div className="font-medium text-slate-500">Needs work</div>
              <ul className="mt-1 space-y-1">
                {weakest.length ? (
                  weakest.map((t) => (
                    <li key={t.skill} className="flex justify-between">
                      <span className="truncate pr-2 text-slate-700">{t.skill}</span>
                      <span className="text-rose-600">{Math.round(t.accuracy * 100)}%</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400">Not enough data yet.</li>
                )}
              </ul>
              <div className="mt-3 font-medium text-slate-500">Strong</div>
              <ul className="mt-1 space-y-1">
                {strongest.length ? (
                  strongest.map((t) => (
                    <li key={t.skill} className="flex justify-between">
                      <span className="truncate pr-2 text-slate-700">{t.skill}</span>
                      <span className="text-emerald-600">{Math.round(t.accuracy * 100)}%</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400">Not enough data yet.</li>
                )}
              </ul>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-slate-900">Upcoming tests</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {upcomingTests.length ? (
                upcomingTests.map((t) => (
                  <li key={t.id} className="flex items-center justify-between">
                    <span className="truncate pr-2 text-slate-700">{t.testLabel}</span>
                    <span className="shrink-0 text-slate-500">
                      {t.scheduledFor.toLocaleDateString()}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-slate-400">No tests scheduled.</li>
              )}
            </ul>
            <Link
              href="/practice-tests"
              className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
            >
              Manage practice tests →
            </Link>
          </Card>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        This plan is designed to maximize your chances of reaching your target if you follow it
        consistently. It is not a guarantee of any score.
      </p>

      {/* Quick numbers */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Questions completed" value={overview.answered} />
        <Stat label="Questions missed" value={overview.missed} />
        <Stat label="Error logs completed" value={overview.errorLogsCompleted} />
        <Stat
          label="Avg time / question"
          value={overview.avgTimeSec != null ? `${overview.avgTimeSec}s` : "—"}
        />
      </div>
    </div>
  );
}
