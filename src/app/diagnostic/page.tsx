import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { getDiagnosticHistory, scoreTrend } from "@/lib/diagnostic/history";
import { resolveTestDate } from "@/lib/testDate";
import {
  FORM_COUNT,
  QUESTIONS_PER_STAGE,
  TOTAL_QUESTIONS,
  diagnosticExternalIds,
} from "@/lib/diagnostic/form";
import {
  ScoreHistoryChart,
  SectionHistoryChart,
  type HistoryPoint,
} from "@/components/diagnostic/DiagnosticHistoryCharts";
import {
  ArrowLink,
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  IconAlert,
  IconCheck,
  IconClock,
  IconLayers,
  IconPlay,
  IconTarget,
  IconTrendDown,
  IconTrendUp,
  PageHeader,
  ProgressBar,
  ScoreRange,
  Stat,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Diagnostics — SAT Studio",
};

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export default async function DiagnosticPage() {
  const user = await getLocalUser();
  const [history, profile, loaded] = await Promise.all([
    getDiagnosticHistory(user.id),
    prisma.studentProfile.findUnique({ where: { userId: user.id } }),
    prisma.question.count({ where: { isDiagnostic: true } }),
  ]);

  const reservedTotal = diagnosticExternalIds().length;
  // A single form only needs its own 40 slots, but a partial seed means later
  // forms would fail mid-test, so the honest check is the whole reserved set.
  const bankReady = loaded >= reservedTotal;

  const target = profile?.targetScore ?? null;
  const remaining = history.totalForms - history.completedCount;
  const trend = scoreTrend(history.timeline);
  const testDate = resolveTestDate(profile);
  const daysLeft = testDate && !testDate.isPast ? testDate.daysRemaining : null;

  const points: HistoryPoint[] = history.timeline.map((a, i) => ({
    label: `#${i + 1}`,
    date: dateFmt.format(a.takenAt),
    formId: a.formId,
    total: a.totalScore,
    low: a.totalLow,
    high: a.totalHigh,
    math: a.mathScore,
    rw: a.rwScore,
  }));

  const first = history.timeline[0] ?? null;
  const latest = history.latest;
  const sinceFirst =
    first && latest && history.timeline.length > 1 ? latest.totalScore - first.totalScore : null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Score Predictor"
        title={`${FORM_COUNT} adaptive diagnostics`}
        description={`Each one is ${TOTAL_QUESTIONS} questions — ten Math, ten Reading & Writing — built on the same blueprint but drawn from different questions. That's what makes the scores comparable: when the estimate moves, it's you that changed, not the test.`}
        actions={
          <ButtonLink
            href={`/diagnostic/run?form=${history.nextFormId}`}
            variant="primary"
            size="lg"
          >
            <IconPlay size={15} />
            {history.activeSessionId
              ? `Resume diagnostic ${history.activeFormId}`
              : history.completedCount === 0
                ? "Start diagnostic 1"
                : `Take diagnostic ${history.nextFormId}`}
          </ButtonLink>
        }
      />

      {!bankReady ? (
        <Card className="border-bad">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-bad">
              <IconAlert size={18} />
            </span>
            <div>
              <h2 className="text-[0.9375rem] font-semibold text-ink">
                The diagnostic question set isn&apos;t fully loaded
              </h2>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-3">
                {loaded} of {reservedTotal} reserved questions are in the database. Run{" "}
                <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.75rem]">
                  npm run db:seed
                </code>{" "}
                to load the rest, then reload this page. Diagnostics whose questions are missing
                will refuse to start rather than score you on a partial form.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {/* --- Progress at a glance ---------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Latest estimate"
          value={latest ? latest.totalScore : "—"}
          sub={
            latest
              ? `range ${latest.totalLow}–${latest.totalHigh} · diagnostic ${latest.formId}`
              : "Take your first diagnostic"
          }
          icon={<IconTarget size={13} />}
        />
        <Stat
          label="Best so far"
          value={history.best ? history.best.totalScore : "—"}
          tone={history.best ? "good" : undefined}
          sub={
            history.best
              ? `diagnostic ${history.best.formId} · ${dateFmt.format(history.best.takenAt)}`
              : "No results yet"
          }
          icon={<IconTrendUp size={13} />}
        />
        <Stat
          label="Change since first"
          value={sinceFirst == null ? "—" : sinceFirst > 0 ? `+${sinceFirst}` : String(sinceFirst)}
          tone={sinceFirst == null ? undefined : sinceFirst > 0 ? "good" : sinceFirst < 0 ? "bad" : undefined}
          sub={
            // Two points restate the delta rather than establishing a trend, and
            // a single 20-question estimate swings ~60 points on its own.
            history.timeline.length >= 3 && trend != null
              ? `${trend > 0 ? "+" : ""}${trend} pts per attempt on average`
              : history.timeline.length === 2
                ? "One more attempt before this counts as a trend"
                : "Needs at least two attempts"
          }
          icon={sinceFirst != null && sinceFirst < 0 ? <IconTrendDown size={13} /> : <IconTrendUp size={13} />}
        />
        <Stat
          label="Completed"
          value={`${history.completedCount}/${history.totalForms}`}
          sub={
            remaining > 0
              ? `${remaining} left${daysLeft != null ? ` · ${daysLeft} days to test day` : ""}`
              : "Every form taken — they cycle from the oldest"
          }
          icon={<IconLayers size={13} />}
        />
      </div>

      {/* --- Trend -------------------------------------------------------- */}
      {history.timeline.length >= 2 ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardHeader
              title="Predicted score over time"
              eyebrow={`${history.timeline.length} attempts`}
              description="The shaded band is the confidence range. A rise that stays inside the previous band isn't proof of improvement yet — it takes a few attempts before the trend outruns the noise."
            />
            <div className="mt-4">
              <ScoreHistoryChart data={points} target={target} />
            </div>
          </Card>
          <Card>
            <CardHeader title="By section" eyebrow="200–800 each" />
            <div className="mt-4">
              <SectionHistoryChart data={points} />
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-[0.75rem] text-ink-3">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full bg-accent" /> Math
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full bg-gold" /> Reading &amp; Writing
              </span>
            </div>
            {latest ? (
              <div className="mt-5 space-y-3.5 border-t border-line pt-4">
                <ScoreRange
                  label="Reading & Writing"
                  score={latest.rwScore}
                  low={latest.rwLow}
                  high={latest.rwHigh}
                  target={target ? Math.round(target / 2 / 10) * 10 : null}
                />
                <ScoreRange
                  label="Math"
                  score={latest.mathScore}
                  low={latest.mathLow}
                  high={latest.mathHigh}
                  target={target ? Math.round(target / 2 / 10) * 10 : null}
                />
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}

      {/* --- The form list ------------------------------------------------ */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl text-ink">All {FORM_COUNT} diagnostics</h2>
            <p className="mt-1 max-w-2xl text-[0.8125rem] leading-relaxed text-ink-3">
              Take them in any order. Two or three a week is a sensible cadence — often enough to
              see movement, rare enough that the practice in between is what moves it. Every
              Reading &amp; Writing question is unique across all {FORM_COUNT} forms; Math questions
              are spaced at least three forms apart.
            </p>
          </div>
          <ProgressPill done={history.completedCount} total={history.totalForms} />
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {history.forms.map((form) => (
            <FormCard key={form.id} form={form} />
          ))}
        </ul>
      </section>

      {/* --- How it works ------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="How each diagnostic works" />
          <ol className="mt-4 space-y-4">
            {[
              {
                icon: <IconLayers size={15} />,
                title: `Routing stage — ${QUESTIONS_PER_STAGE} questions per section`,
                body: "A fixed set spanning all four content domains, ramping from easy to hard. Every form uses the same structure at the same difficulties, which is what makes attempts comparable.",
              },
              {
                icon: <IconTarget size={15} />,
                title: `Adaptive stage — ${QUESTIONS_PER_STAGE} more per section`,
                body: "Your routing performance selects one of three tracks. Strong performance routes into hard questions to find your ceiling; a weaker routing stage routes into easier items, which pin down exactly which methods are missing. Math and Reading & Writing route independently.",
              },
              {
                icon: <IconClock size={15} />,
                title: "Untimed, but timed",
                body: "There's no countdown — but time per question is recorded, because rushing and stalling are both diagnostic. Answer at the pace you'd use on test day.",
              },
              {
                icon: <IconCheck size={15} />,
                title: "Results only at the end",
                body: "You won't see whether an answer was right until you submit. Then you get predicted scores, a confidence range, a breakdown by domain and skill, and an analysis of every question you missed.",
              },
            ].map((step) => (
              <li key={step.title} className="flex gap-3.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-weak text-accent">
                  {step.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[0.875rem] font-semibold text-ink">{step.title}</p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-3">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-5">
          <Card>
            <h2 className="text-[0.9375rem] font-semibold text-ink">Before you start</h2>
            <ul className="mt-3 space-y-2.5 text-[0.8125rem] leading-relaxed text-ink-2">
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                Set aside about 25 minutes and do it in one sitting if you can. Progress is saved
                after every answer, so you can stop and resume.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                A Desmos calculator is available on Math questions, exactly as on the real test.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                Don&apos;t look anything up. An inflated estimate produces a study plan aimed at the
                wrong problems.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                Starting a different diagnostic discards an unfinished one. Finish what you started
                first — a half-answered form scores as blanks.
              </li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-[0.9375rem] font-semibold text-ink">Why the number moves around</h2>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-3">
              Twenty questions cannot pin a score to ten points, so consecutive attempts will bounce
              by 30–60 points on their own. Trust the direction across several attempts, not the
              difference between two. The skill breakdown underneath each result is the part that
              tells you what to do tomorrow.
            </p>
            <div className="mt-3">
              <ArrowLink href="/plan">See how this feeds your plan</ArrowLink>
            </div>
          </Card>

          <p className="text-[0.75rem] leading-relaxed text-ink-3">
            Predicted scores are estimates from a 20-question diagnostic, not official College Board
            scores. The methodology is documented in{" "}
            <code className="rounded bg-surface-2 px-1 py-0.5 font-mono">docs/SCORING.md</code>, and{" "}
            <Link href="/practice" className="font-medium text-accent hover:underline">
              targeted practice
            </Link>{" "}
            is what actually moves them.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgressPill({ done, total }: { done: number; total: number }) {
  return (
    <div className="min-w-[11rem]">
      <div className="mb-1 flex items-baseline justify-between font-mono text-[0.6875rem] text-ink-3">
        <span>{done} completed</span>
        <span>{total - done} left</span>
      </div>
      <ProgressBar value={done} max={total} label="Diagnostics completed" />
    </div>
  );
}

function FormCard({
  form,
}: {
  form: Awaited<ReturnType<typeof getDiagnosticHistory>>["forms"][number];
}) {
  const { result, progress } = form;
  const delta = result?.delta ?? null;

  return (
    <Card as="li" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-3">
            Diagnostic
          </p>
          <p className="text-lg font-semibold leading-tight text-ink">{form.id}</p>
        </div>
        {form.status === "COMPLETED" ? (
          <Badge tone="good">
            <IconCheck size={11} />
            {form.attempts > 1 ? `Taken ${form.attempts}×` : "Completed"}
          </Badge>
        ) : form.status === "IN_PROGRESS" ? (
          <Badge tone="accent">In progress</Badge>
        ) : (
          <Badge>Not taken</Badge>
        )}
      </div>

      {result ? (
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold text-ink">{result.totalScore}</span>
            {delta != null ? (
              <span
                className={`font-mono text-[0.8125rem] font-semibold ${
                  delta > 0 ? "text-good" : delta < 0 ? "text-bad" : "text-ink-3"
                }`}
              >
                {delta > 0 ? `+${delta}` : delta === 0 ? "±0" : delta}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 font-mono text-[0.75rem] text-ink-3">
            {result.totalLow}–{result.totalHigh} · M {result.mathScore} · RW {result.rwScore}
          </p>
          <p className="mt-1 text-[0.75rem] text-ink-3">
            {dateFmt.format(result.takenAt)} · {Math.round(result.accuracyPct)}% accuracy
          </p>
        </div>
      ) : progress ? (
        <div>
          <p className="font-mono text-[0.8125rem] text-ink-2">
            {progress.answered}/{progress.total} answered
          </p>
          <div className="mt-2">
            <ProgressBar
              value={progress.answered}
              max={progress.total}
              label={`Diagnostic ${form.id} progress`}
            />
          </div>
        </div>
      ) : (
        <p className="text-[0.8125rem] leading-relaxed text-ink-3">
          {TOTAL_QUESTIONS} questions · about 25 minutes
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {form.status === "COMPLETED" && result ? (
          <>
            <ButtonLink href={`/diagnostic/results?result=${result.resultId}`} size="sm">
              Review
            </ButtonLink>
            <ButtonLink href={`/diagnostic/run?form=${form.id}`} variant="ghost" size="sm">
              Retake
            </ButtonLink>
          </>
        ) : (
          <ButtonLink href={`/diagnostic/run?form=${form.id}`} variant="primary" size="sm">
            {form.status === "IN_PROGRESS" ? "Resume" : "Start"}
          </ButtonLink>
        )}
      </div>
    </Card>
  );
}
