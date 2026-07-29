import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLocalUserWithProfile } from "@/lib/user";
import { getDashboardData } from "@/lib/dashboard";
import { practiceHref, PHASE_LABELS, type PlanPhase } from "@/lib/studyPlanner";
import { SIGNAL_LABELS } from "@/lib/mastery";
import { AccuracyTrend, ScoreHistory } from "@/components/dashboard/DashboardCharts";
import { CoachingNote } from "@/components/dashboard/CoachingNote";
import {
  ArrowLink,
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  IconAlert,
  IconArrowRight,
  IconBook,
  IconCheck,
  IconClock,
  IconFlame,
  IconLayers,
  IconTarget,
  IconTrendDown,
  IconTrendUp,
  MetricRow,
  PageHeader,
  ProgressBar,
  ProgressRing,
  ScoreGauge,
  Stat,
  cx,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const SECTION_LABEL: Record<string, string> = {
  MATH: "Math",
  READING_WRITING: "Reading & Writing",
};

const KIND_TONE: Record<string, "accent" | "gold" | "good" | "neutral"> = {
  FULL_TEST: "gold",
  TIMED: "gold",
  SKILL: "accent",
  MIXED: "accent",
  ERROR_REVIEW: "neutral",
  LIGHT: "neutral",
  REST: "neutral",
  FINAL_WEEK: "gold",
  TEST_DAY: "gold",
};

export default async function DashboardPage() {
  const user = await getLocalUserWithProfile();
  if (!user.profile?.onboardingComplete) redirect("/onboarding");

  const [data, recommendations] = await Promise.all([
    getDashboardData(user.id),
    prisma.skillRecommendation.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { priority: "asc" },
      take: 4,
    }),
  ]);

  const { status } = data;
  const gap =
    status.targetScore != null && status.predictedTotal != null
      ? status.targetScore - status.predictedTotal
      : null;
  const goalPct = data.dailyGoalQuestions
    ? Math.min(100, (data.questionsToday / data.dailyGoalQuestions) * 100)
    : 0;
  const accuracyDelta =
    data.accuracyThisWeek != null && data.accuracyPrevWeek != null
      ? data.accuracyThisWeek - data.accuracyPrevWeek
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          data.planPhase
            ? `Phase · ${PHASE_LABELS[data.planPhase as PlanPhase] ?? data.planPhase}`
            : "Dashboard"
        }
        title={greeting()}
        description={
          status.daysRemaining != null
            ? `${Math.max(0, status.daysRemaining)} day${status.daysRemaining === 1 ? "" : "s"} until ${status.testLabel}.`
            : "Set your test date to get a schedule."
        }
        actions={
          <>
            <ButtonLink href={data.nextAction.href} variant="primary">
              {data.nextAction.label}
              <IconArrowRight size={15} />
            </ButtonLink>
            <ButtonLink href="/practice" variant="secondary">
              Practice
            </ButtonLink>
          </>
        }
      />

      {/* --- Diagnostic prompt: prominent until taken, then gone ---------- */}
      {!status.hasDiagnostic ? <DiagnosticPrompt /> : null}

      {/* --- Bento: the instrument + today ------------------------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="flex flex-col items-center justify-center lg:col-span-4">
          {status.predictedTotal != null ? (
            <>
              <ScoreGauge
                score={status.predictedTotal}
                target={status.targetScore}
                size={220}
                label="Current estimate"
                caption={
                  gap != null && gap > 0 ? (
                    <>
                      <strong className="font-mono text-ink">{gap} points</strong> from your{" "}
                      {status.targetScore} target
                    </>
                  ) : gap != null ? (
                    <>Estimating at or above your {status.targetScore} target</>
                  ) : (
                    "Set a target score in your profile"
                  )
                }
              />
              <div className="mt-4 grid w-full grid-cols-2 gap-3 border-t border-line pt-4">
                <div>
                  <p className="eyebrow">R&amp;W</p>
                  <p className="mt-0.5 font-mono text-lg font-semibold text-ink">
                    {data.predictedSection.rw ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="eyebrow">Math</p>
                  <p className="mt-0.5 font-mono text-lg font-semibold text-ink">
                    {data.predictedSection.math ?? "—"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<IconTarget size={18} />}
              title="No score estimate yet"
              body="The score predictor takes about 25 minutes and drives everything else in the app."
              action={
                <ButtonLink href="/diagnostic" variant="primary" size="sm">
                  Take the diagnostic
                </ButtonLink>
              }
            />
          )}
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader
            eyebrow={data.today ? data.today.title : "Today"}
            title="Today's plan"
            description={
              data.today
                ? `${data.today.targetMinutes} min · ${data.today.targetQuestions} questions`
                : undefined
            }
            action={
              data.today ? (
                <Badge tone={KIND_TONE[data.today.kind] ?? "neutral"}>
                  {data.today.kind.replace(/_/g, " ").toLowerCase()}
                </Badge>
              ) : null
            }
          />
          {data.today && data.today.items.length ? (
            <ul className="mt-4 space-y-2.5">
              {data.today.items.map((item, i) => (
                <li key={`${item.label}-${i}`}>
                  <Link
                    href={item.href ?? "/practice"}
                    className="group flex items-start gap-3 rounded-md border border-line p-3 transition-colors hover:border-accent hover:bg-accent-weak"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-[0.6875rem] font-semibold text-ink-2">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.875rem] font-medium text-ink">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-[0.75rem] text-ink-3">
                        {item.minutes} min
                        {item.questions ? ` · ${item.questions} questions` : ""}
                        {item.section ? ` · ${SECTION_LABEL[item.section] ?? item.section}` : ""}
                      </span>
                    </span>
                    <IconArrowRight
                      size={14}
                      className="mt-1 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              className="mt-4"
              icon={<IconLayers size={18} />}
              title={data.today ? "Rest day" : "No plan for today"}
              body={
                data.today
                  ? "Recovery is part of the schedule. Ten minutes of due reviews is plenty if you want to keep the streak."
                  : "Generate a plan from the Study Plan page and today will fill in."
              }
              action={
                <ButtonLink href="/plan" variant="secondary" size="sm">
                  Open study plan
                </ButtonLink>
              }
            />
          )}
          <div className="mt-4 border-t border-line pt-4">
            <ArrowLink href="/plan">See the full schedule</ArrowLink>
          </div>
        </Card>

        <div className="grid gap-4 lg:col-span-3">
          <Card className="flex items-center gap-4">
            <ProgressRing
              value={goalPct}
              size={64}
              tone={goalPct >= 100 ? "good" : "accent"}
              label={`${data.questionsToday} of ${data.dailyGoalQuestions} questions today`}
            >
              <span className="font-mono text-[0.9375rem] font-semibold leading-none text-ink">
                {data.questionsToday}
              </span>
              <span className="mt-0.5 font-mono text-[0.5625rem] text-ink-3">
                /{data.dailyGoalQuestions}
              </span>
            </ProgressRing>
            <div className="min-w-0">
              <p className="text-[0.8125rem] font-semibold text-ink">Today&apos;s goal</p>
              <p className="mt-0.5 text-[0.75rem] leading-snug text-ink-3">
                {goalPct >= 100
                  ? "Goal met — anything else is a bonus."
                  : `${data.dailyGoalQuestions - data.questionsToday} to go · ${data.minutesToday} min so far`}
              </p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <span
              className={cx(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-full",
                status.streakDays > 0 ? "bg-gold-weak text-gold" : "bg-surface-2 text-ink-3"
              )}
            >
              <IconFlame size={24} />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-2xl font-semibold leading-none text-ink">
                {status.streakDays}
              </p>
              <p className="mt-1 text-[0.75rem] leading-snug text-ink-3">
                day streak ·{" "}
                {status.streakDays > 0 ? "keep it alive" : "answer one question to start"}
              </p>
            </div>
          </Card>

          <Card>
            <p className="eyebrow">Next best action</p>
            <p className="mt-1.5 text-[0.875rem] font-semibold text-ink">{data.nextAction.label}</p>
            <p className="mt-1 text-[0.75rem] leading-relaxed text-ink-3">
              {data.nextAction.detail}
            </p>
            <div className="mt-3">
              <ButtonLink href={data.nextAction.href} variant="primary" size="sm">
                Start
              </ButtonLink>
            </div>
          </Card>
        </div>
      </div>

      {/* --- Weekly numbers ---------------------------------------------- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Questions this week"
          value={data.questionsThisWeek}
          sub={data.weeklyGoal ? `Goal ${data.weeklyGoal.targetQuestions}` : "No weekly goal set"}
          icon={<IconBook size={13} />}
        />
        <Stat
          label="Minutes studied"
          value={data.minutesThisWeek}
          sub={data.weeklyGoal ? `Planned ${data.weeklyGoal.targetMinutes} min` : "This week"}
          icon={<IconClock size={13} />}
        />
        <Stat
          label="Accuracy this week"
          value={
            data.accuracyThisWeek != null ? `${Math.round(data.accuracyThisWeek * 100)}%` : "—"
          }
          tone={accuracyDelta == null ? undefined : accuracyDelta >= 0 ? "good" : "bad"}
          sub={
            accuracyDelta == null ? (
              "No prior week to compare"
            ) : (
              <span className="inline-flex items-center gap-1">
                {accuracyDelta >= 0 ? <IconTrendUp size={11} /> : <IconTrendDown size={11} />}
                {accuracyDelta >= 0 ? "+" : ""}
                {Math.round(accuracyDelta * 100)} pts vs last week
              </span>
            )
          }
        />
        <Stat
          label="Unresolved mistakes"
          value={data.unresolvedErrors}
          tone={data.unresolvedErrors > 0 ? "bad" : "good"}
          sub={
            data.unresolvedErrors > 0 ? "Waiting in your error log" : "Nothing outstanding — good"
          }
          icon={<IconAlert size={13} />}
        />
      </div>

      {/* --- Trends + skills --------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader title="Accuracy trend" eyebrow="Last 30 days" />
          <div className="mt-3">
            <AccuracyTrend data={data.accuracyTrend} />
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Improving" eyebrow="Mastery rising" />
          {data.improving.length ? (
            <ul className="mt-3 space-y-3">
              {data.improving.map((s) => (
                <li key={`${s.section}-${s.skill}`}>
                  <MetricRow
                    label={s.skill}
                    value={
                      <span className="text-good">
                        +{Math.round(s.delta * 100)}%
                      </span>
                    }
                    progress={s.mastery * 100}
                    tone="good"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-3">
              Nothing has enough recent data to show a trend yet. Mastery updates after a few
              attempts on a skill.
            </p>
          )}
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader
            title="Needs attention"
            eyebrow="Lowest mastery"
            action={<ArrowLink href="/analytics">All skills</ArrowLink>}
          />
          {data.needsAttention.length ? (
            <ul className="mt-3 space-y-3">
              {data.needsAttention.map((s) => (
                <li key={`${s.section}-${s.skill}`}>
                  <MetricRow
                    label={s.skill}
                    value={`${Math.round(s.mastery * 100)}%`}
                    // "Not enough data" next to a specific percentage reads as a
                    // contradiction, so low-evidence skills report the count instead.
                    hint={
                      s.signal === "UNTESTED"
                        ? `${s.attempts} attempt${s.attempts === 1 ? "" : "s"} so far`
                        : SIGNAL_LABELS[s.signal]
                    }
                    progress={s.mastery * 100}
                    tone={s.mastery < 0.4 ? "bad" : "warn"}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-3">
              No weak skills identified yet. Take the diagnostic or log more practice.
            </p>
          )}
        </Card>
      </div>

      {/* --- Recommendations + coaching ---------------------------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recommended practice"
            eyebrow="Highest impact first"
            action={<ArrowLink href="/practice">All recommendations</ArrowLink>}
          />
          {recommendations.length ? (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recommendations.map((r) => (
                <li key={r.id} className="rounded-md border border-line p-3.5">
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={
                        r.priorityLabel === "CRITICAL"
                          ? "bad"
                          : r.priorityLabel === "HIGH"
                            ? "warn"
                            : "neutral"
                      }
                    >
                      {r.priorityLabel}
                    </Badge>
                    <span className="font-mono text-[0.6875rem] text-ink-3">
                      {r.recommendedQuestions}q · {r.estimatedMinutes}m
                    </span>
                  </div>
                  <p className="mt-2 text-[0.8125rem] font-semibold text-ink">{r.skill}</p>
                  <div className="mt-2">
                    <ProgressBar
                      value={r.currentMastery * 100}
                      max={r.targetMastery * 100}
                      tone={r.currentMastery < r.targetMastery * 0.6 ? "bad" : "warn"}
                      size="sm"
                      label={`${r.skill} mastery`}
                    />
                  </div>
                  <div className="mt-3">
                    <ButtonLink
                      href={practiceHref({
                        section: r.section,
                        skill: r.skill,
                        recommendedDifficulty:
                          r.recommendedDifficulty as "EASY" | "MEDIUM" | "HARD" | "MIXED",
                        recommendedQuestions: r.recommendedQuestions,
                      })}
                      variant="secondary"
                      size="sm"
                    >
                      Start set
                    </ButtonLink>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              className="mt-4"
              icon={<IconCheck size={18} />}
              title="No recommendations yet"
              body="Take the score predictor, or answer a few practice questions, and the engine will start prioritizing."
              action={
                <ButtonLink href="/diagnostic" variant="primary" size="sm">
                  Take the diagnostic
                </ButtonLink>
              }
            />
          )}
        </Card>

        <div className="space-y-4">
          <CoachingNote />
          {data.scoreHistory.length > 1 ? (
            <Card>
              <CardHeader title="Predicted score over time" eyebrow="Diagnostic history" />
              <div className="mt-3">
                <ScoreHistory data={data.scoreHistory} target={status.targetScore} />
              </div>
            </Card>
          ) : null}
          {data.planSummary ? (
            <Card>
              <CardHeader title="Your plan right now" eyebrow="Strategy" />
              <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-ink-2">
                {data.planSummary}
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DiagnosticPrompt() {
  return (
    <div className="card overflow-hidden border-accent">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-weak text-accent">
          <IconTarget size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-accent">Recommended next step</p>
          <h2 className="mt-1 text-[1.0625rem] text-ink">
            Take the 20-question score predictor
          </h2>
          <p className="mt-1 max-w-2xl text-[0.8125rem] leading-relaxed text-ink-3">
            About 25 minutes. It establishes your baseline, finds the exact skills costing you the
            most points, and rebuilds your study plan around them. Until then, everything here is
            based on your own self-assessment.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <ButtonLink href="/diagnostic" variant="primary">
            Start
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

/**
 * Time-of-day greeting. Computed on the server from the server's clock; the
 * dashboard is force-dynamic so this never gets baked into a stale render.
 */
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
