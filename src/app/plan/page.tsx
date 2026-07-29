import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { getUpcomingPlan, readWeeklyGoals } from "@/lib/planning";
import { PHASE_BLURBS, PHASE_LABELS, type PlanPhase } from "@/lib/studyPlanner";
import { resolveTestDate, startOfDay, toIsoDate } from "@/lib/testDate";
import { PlanDayRow } from "@/components/plan/PlanDayRow";
import { RegeneratePlanButton } from "@/components/plan/RegeneratePlanButton";
import {
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  IconCalendar,
  IconCheck,
  IconClock,
  IconTarget,
  MetricRow,
  PageHeader,
  ProgressBar,
  Stat,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const HORIZON_DAYS = 21;

export default async function PlanPage() {
  const user = await getLocalUser();
  const now = new Date();

  const [profile, plan, days, latestResult, upcomingTests] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId: user.id } }),
    prisma.studyPlan.findFirst({
      where: { userId: user.id, active: true },
      include: { tasks: { orderBy: { orderIndex: "asc" } } },
    }),
    getUpcomingPlan(user.id, HORIZON_DAYS, now),
    prisma.diagnosticResult.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.practiceTestSchedule.findMany({
      where: { userId: user.id, completed: false },
      orderBy: { scheduledFor: "asc" },
      take: 4,
    }),
  ]);

  const resolved = resolveTestDate(profile, now);
  const weeklyGoals = plan ? readWeeklyGoals(plan.tasks) : [];
  const todayIso = toIsoDate(startOfDay(now));
  const phase = (plan?.phase as PlanPhase | undefined) ?? null;

  const totalPlanned = await prisma.studyPlanDay.count({
    where: { userId: user.id, kind: { not: "REST" } },
  });
  const completedDays = await prisma.studyPlanDay.count({
    where: { userId: user.id, completed: true },
  });

  const thisWeek = days.filter((d) => {
    const diff = Math.round(
      (startOfDay(d.date).getTime() - startOfDay(now).getTime()) / 86_400_000
    );
    return diff >= 0 && diff < 7;
  });
  const weekMinutes = thisWeek.reduce((s, d) => s + d.targetMinutes, 0);
  const weekQuestions = thisWeek.reduce((s, d) => s + d.targetQuestions, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={phase ? `Phase · ${PHASE_LABELS[phase]}` : "Study plan"}
        title={
          resolved
            ? `${Math.max(0, resolved.daysRemaining)} days to ${resolved.label}`
            : "Your study plan"
        }
        description={plan?.summary ?? "Set a test date in your profile and the plan will build itself."}
        actions={
          <>
            <RegeneratePlanButton />
            <ButtonLink href="/profile" variant="secondary">
              Change availability
            </ButtonLink>
          </>
        }
      />

      {!resolved ? (
        <EmptyState
          icon={<IconCalendar size={18} />}
          title="No test date set"
          body="The whole schedule is built backwards from test day. Add yours and the plan appears immediately."
          action={
            <ButtonLink href="/profile" variant="primary" size="sm">
              Set my test date
            </ButtonLink>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat
              label="Days remaining"
              value={Math.max(0, resolved.daysRemaining)}
              sub={resolved.label}
              icon={<IconCalendar size={13} />}
              tone={resolved.daysRemaining <= 14 ? "bad" : undefined}
            />
            <Stat
              label="This week"
              value={`${Math.round(weekMinutes / 60)}h`}
              sub={`${weekQuestions} questions planned`}
              icon={<IconClock size={13} />}
            />
            <Stat
              label="Days completed"
              value={`${completedDays}/${totalPlanned}`}
              sub="Marked done in the schedule"
              icon={<IconCheck size={13} />}
            />
            <Stat
              label="Score gap"
              value={
                latestResult && profile?.targetScore
                  ? Math.max(0, profile.targetScore - latestResult.totalScore)
                  : "—"
              }
              tone="gold"
              sub={
                latestResult && profile?.targetScore
                  ? `${latestResult.totalScore} → ${profile.targetScore}`
                  : "Take the diagnostic for a baseline"
              }
              icon={<IconTarget size={13} />}
            />
          </div>

          {phase ? (
            <Card>
              <CardHeader
                title={`Right now: ${PHASE_LABELS[phase]}`}
                eyebrow="Current phase"
                action={<Badge tone="accent">{PHASE_LABELS[phase]}</Badge>}
              />
              <p className="mt-2.5 text-[0.875rem] leading-relaxed text-ink-2">
                {PHASE_BLURBS[phase]}
              </p>
              <p className="mt-3 border-t border-line pt-3 text-[0.75rem] leading-relaxed text-ink-3">
                Phases advance automatically as test day approaches: broad coverage first, then
                targeted skill work, then timed practice and full-length tests, then a taper. The
                plan is rebuilt whenever your performance data changes — no plan can guarantee a
                score, but following one consistently is what moves them.
              </p>
            </Card>
          ) : null}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
            <section>
              <h2 className="mb-3 text-xl text-ink">Next {HORIZON_DAYS} days</h2>
              {days.length === 0 ? (
                <EmptyState
                  title="No days scheduled"
                  body="Rebuild the plan to generate the schedule."
                  action={<RegeneratePlanButton />}
                />
              ) : (
                <ul className="space-y-2.5">
                  {days.map((day) => (
                    <PlanDayRow
                      key={day.id}
                      day={day}
                      isToday={toIsoDate(startOfDay(day.date)) === todayIso}
                      isPast={startOfDay(day.date) < startOfDay(now)}
                    />
                  ))}
                </ul>
              )}
            </section>

            <div className="space-y-5">
              <Card>
                <CardHeader
                  title="Weekly score checkpoints"
                  eyebrow="Targets, not promises"
                  description="A realistic path from your current estimate to your target, front-loaded because early gaps close fastest."
                />
                {weeklyGoals.length ? (
                  <ul className="mt-4 space-y-3.5">
                    {weeklyGoals.slice(0, 6).map((goal) => (
                      <li key={goal.weekIndex}>
                        <MetricRow
                          label={
                            goal.weekIndex === 0 ? "This week" : `Week ${goal.weekIndex + 1}`
                          }
                          value={goal.scoreTarget ? `${goal.scoreTarget}` : "—"}
                          hint={`${goal.focus} · ${goal.targetQuestions} questions`}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-[0.8125rem] text-ink-3">
                    Take the score predictor to generate weekly checkpoints.
                  </p>
                )}
              </Card>

              <Card>
                <CardHeader
                  title="Full-length tests"
                  eyebrow="Stamina"
                  description="Spaced so you don't burn through official tests early, and never in the last four days."
                />
                {upcomingTests.length ? (
                  <ul className="mt-3 space-y-2">
                    {upcomingTests.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2"
                      >
                        <span className="min-w-0 truncate text-[0.8125rem] text-ink-2">
                          {t.testLabel}
                        </span>
                        <span className="shrink-0 font-mono text-[0.75rem] text-ink-3">
                          {t.scheduledFor.toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-[0.8125rem] text-ink-3">
                    No tests scheduled — there isn&apos;t enough time left before your test date.
                  </p>
                )}
                <div className="mt-3">
                  <ButtonLink href="/practice-tests" variant="secondary" size="sm">
                    Manage practice tests
                  </ButtonLink>
                </div>
              </Card>

              <Card>
                <CardHeader title="Plan completion" eyebrow="Consistency" />
                <div className="mt-3">
                  <ProgressBar
                    value={completedDays}
                    max={Math.max(1, totalPlanned)}
                    tone="good"
                    label="Study days completed"
                  />
                </div>
                <p className="mt-2 text-[0.75rem] leading-relaxed text-ink-3">
                  {completedDays} of {totalPlanned} scheduled study days marked complete. Marking
                  days honestly is what keeps the phase logic accurate.
                </p>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
