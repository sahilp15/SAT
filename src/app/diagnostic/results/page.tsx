import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { getErrorLog } from "@/lib/errorLog";
import { getDiagnosticHistory } from "@/lib/diagnostic/history";
import { practiceHref } from "@/lib/studyPlanner";
import { MissedQuestionCard } from "@/components/review/MissedQuestionCard";
import { DifficultyBars, DomainRadar, TimingChart } from "@/components/diagnostic/DiagnosticCharts";
import {
  ArrowLink,
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  IconAlert,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconTarget,
  IconTrendUp,
  InlineAlert,
  MetricRow,
  PageHeader,
  ProgressBar,
  ScoreGauge,
  ScoreRange,
  Stat,
} from "@/components/ui";
import type {
  DiagnosticBreakdown,
  ResponseFlag,
  SkillPerformance,
} from "@/lib/diagnostic/scoring";
import { TRACK_LABELS } from "@/lib/diagnostic/routing";
import type { DiagnosticTrack } from "@/lib/diagnostic/form";

export const dynamic = "force-dynamic";

const SECTION_LABEL: Record<string, string> = {
  MATH: "Math",
  READING_WRITING: "Reading & Writing",
};

const CONFIDENCE_TONE = { HIGH: "good", MODERATE: "warn", LOW: "bad" } as const;

/** Short axis labels so the radar chart stays readable. */
const DOMAIN_SHORT: Record<string, string> = {
  Algebra: "Algebra",
  "Advanced Math": "Advanced",
  "Problem-Solving and Data Analysis": "Data",
  "Geometry and Trigonometry": "Geometry",
  "Information and Ideas": "Info & Ideas",
  "Craft and Structure": "Craft",
  "Expression of Ideas": "Expression",
  "Standard English Conventions": "Conventions",
};

function parseBreakdown(json: string): (DiagnosticBreakdown & { confidenceNote?: string }) | null {
  try {
    return JSON.parse(json) as DiagnosticBreakdown & { confidenceNote?: string };
  } catch {
    return null;
  }
}

export default async function DiagnosticResultsPage({
  searchParams,
}: {
  searchParams: { result?: string };
}) {
  const user = await getLocalUser();
  const history = await getDiagnosticHistory(user.id);

  // `?result=<id>` opens a specific past attempt; the default is the newest.
  const attemptIndex = searchParams.result
    ? history.timeline.findIndex((a) => a.resultId === searchParams.result)
    : history.timeline.length - 1;
  if (attemptIndex < 0) redirect("/diagnostic");

  const attempt = history.timeline[attemptIndex];
  const result = await prisma.diagnosticResult.findFirst({
    where: { id: attempt.resultId, userId: user.id },
  });
  if (!result) redirect("/diagnostic");

  const isLatest = attemptIndex === history.timeline.length - 1;
  const previous = attemptIndex > 0 ? history.timeline[attemptIndex - 1] : null;
  const next = !isLatest ? history.timeline[attemptIndex + 1] : null;

  const [profile, recommendations, missed] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId: user.id } }),
    prisma.skillRecommendation.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { priority: "asc" },
      take: 6,
    }),
    getErrorLog(user.id, { sessionId: result.sessionId, limit: 20 }),
  ]);

  const breakdown = parseBreakdown(result.breakdownJson);
  const target = profile?.targetScore ?? null;
  const gap = target != null ? target - result.totalScore : null;

  const sections = breakdown?.sections ?? [];
  const mathSection = sections.find((s) => s.section === "MATH");
  const rwSection = sections.find((s) => s.section === "READING_WRITING");

  const domainsFor = (section: string) =>
    (breakdown?.domains ?? [])
      .filter((d) => d.section === section)
      .map((d) => ({
        domain: d.domain,
        short: DOMAIN_SHORT[d.domain] ?? d.domain,
        accuracy: d.accuracy,
        correct: d.correct,
        total: d.total,
      }));

  const difficultyRows = breakdown?.difficulties ?? [];
  const timeline = breakdown?.timeline ?? [];
  const strengths = breakdown?.strengths ?? [];
  const weaknesses = breakdown?.weaknesses ?? [];
  const flags = breakdown?.flags ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Diagnostic ${result.formId} · attempt ${attemptIndex + 1} of ${history.timeline.length} · ${result.createdAt.toLocaleDateString()}`}
        title="Your predicted score"
        description="An estimate built from 20 questions. Treat the range as the real answer and the single number as its midpoint."
        actions={
          <>
            <ButtonLink href="/plan">See my plan</ButtonLink>
            <ButtonLink href="/diagnostic" variant="secondary">
              All diagnostics
            </ButtonLink>
          </>
        }
      />

      {/* --- Attempt navigation ------------------------------------------- */}
      {history.timeline.length > 1 ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {previous ? (
              <ButtonLink href={`/diagnostic/results?result=${previous.resultId}`} size="sm">
                <IconChevronLeft size={14} />
                Attempt {attemptIndex}
              </ButtonLink>
            ) : null}
            {next ? (
              <ButtonLink href={`/diagnostic/results?result=${next.resultId}`} size="sm">
                Attempt {attemptIndex + 2}
                <IconChevronRight size={14} />
              </ButtonLink>
            ) : null}
            {!isLatest ? (
              <ButtonLink
                href={`/diagnostic/results?result=${history.timeline[history.timeline.length - 1].resultId}`}
                size="sm"
                variant="ghost"
              >
                Jump to latest
              </ButtonLink>
            ) : null}
          </div>
          {attempt.delta != null ? (
            <p className="text-[0.8125rem] text-ink-3">
              <span
                className={`font-mono font-semibold ${
                  attempt.delta > 0 ? "text-good" : attempt.delta < 0 ? "text-bad" : "text-ink"
                }`}
              >
                {attempt.delta > 0 ? `+${attempt.delta}` : attempt.delta === 0 ? "±0" : attempt.delta}
              </span>{" "}
              versus your previous attempt
              {Math.abs(attempt.delta) < 60
                ? " — inside the normal swing between two 20-question estimates, so read it as flat"
                : ""}
              .
            </p>
          ) : (
            <p className="text-[0.8125rem] text-ink-3">
              Your first attempt — the baseline everything else is measured against.
            </p>
          )}
        </Card>
      ) : null}

      {!isLatest ? (
        <InlineAlert tone="accent" title="You're looking at an older attempt">
          Scores, timing, and missed questions below are from this attempt. The recommendations and
          study plan elsewhere in the app reflect everything you&apos;ve done since.
        </InlineAlert>
      ) : null}

      {/* --- Headline ---------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[auto_1fr]">
        <Card className="flex flex-col items-center justify-center lg:w-[22rem]">
          <ScoreGauge
            score={result.totalScore}
            low={result.totalLow}
            high={result.totalHigh}
            target={target}
            caption={
              <>
                Estimated range{" "}
                <strong className="font-mono text-ink">
                  {result.totalLow}–{result.totalHigh}
                </strong>
                {target != null ? (
                  <>
                    {" "}
                    · target <strong className="font-mono text-gold">{target}</strong>
                  </>
                ) : null}
              </>
            }
          />
        </Card>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Card className="sm:col-span-2">
            <CardHeader
              title="Section estimates"
              eyebrow="200–800 each"
              action={
                <Badge tone={CONFIDENCE_TONE[result.confidence as keyof typeof CONFIDENCE_TONE]}>
                  {result.confidence.charAt(0) + result.confidence.slice(1).toLowerCase()}{" "}
                  confidence
                </Badge>
              }
            />
            <div className="mt-5 space-y-5">
              <ScoreRange
                label="Reading & Writing"
                score={result.rwScore}
                low={result.rwLow}
                high={result.rwHigh}
                target={target ? Math.round(target / 2 / 10) * 10 : null}
              />
              <ScoreRange
                label="Math"
                score={result.mathScore}
                low={result.mathLow}
                high={result.mathHigh}
                target={target ? Math.round(target / 2 / 10) * 10 : null}
              />
            </div>
            {breakdown?.confidenceNote ? (
              <p className="mt-5 border-t border-line pt-4 text-[0.8125rem] leading-relaxed text-ink-3">
                {breakdown.confidenceNote}
              </p>
            ) : null}
          </Card>

          <Stat
            label="Accuracy"
            value={`${Math.round(result.accuracyPct)}%`}
            sub={`${sections.reduce((s, x) => s + x.correct, 0)} of ${sections.reduce((s, x) => s + x.total, 0)} correct`}
            icon={<IconCheck size={13} />}
          />
          <Stat
            label={gap != null && gap > 0 ? "Points to target" : "Versus target"}
            value={gap == null ? "—" : gap > 0 ? `+${gap}` : "On target"}
            tone={gap != null && gap > 0 ? "gold" : "good"}
            sub={target ? `Target ${target}` : "Set a target in your profile"}
            icon={<IconTarget size={13} />}
          />
          <Stat
            label="Adaptive routing"
            value={
              mathSection?.track
                ? TRACK_LABELS[mathSection.track as DiagnosticTrack]
                : "—"
            }
            sub={
              rwSection?.track
                ? `Math · R&W routed to ${TRACK_LABELS[rwSection.track as DiagnosticTrack]}`
                : "Math track"
            }
          />
          <Stat
            label="Careless drag"
            value={
              breakdown?.carelessDragPoints ? `~${breakdown.carelessDragPoints} pts` : "None seen"
            }
            tone={breakdown?.carelessDragPoints ? "bad" : "good"}
            sub="Estimated points lost to avoidable slips on easier items"
            icon={<IconAlert size={13} />}
          />
        </div>
      </div>

      {/* --- What this means --------------------------------------------- */}
      <Card>
        <CardHeader
          title="What this estimate actually means"
          eyebrow="Read this once"
        />
        <div className="mt-4 grid grid-cols-1 gap-5 text-[0.8125rem] leading-relaxed text-ink-2 sm:grid-cols-3">
          <div>
            <p className="mb-1.5 font-semibold text-ink">It&apos;s a range, not a number</p>
            <p>
              Twenty questions cannot pin down a score to ten points. The honest answer is{" "}
              <strong className="font-mono">
                {result.totalLow}–{result.totalHigh}
              </strong>
              . The midpoint is the single best guess inside it, nothing more.
            </p>
          </div>
          <div>
            <p className="mb-1.5 font-semibold text-ink">It isn&apos;t an official score</p>
            <p>
              This is not equated to any real SAT form, and it has no way to model three hours of
              fatigue or test-day nerves. Use a full-length practice test for that.
            </p>
          </div>
          <div>
            <p className="mb-1.5 font-semibold text-ink">The breakdown is the valuable part</p>
            <p>
              Which skills failed, at which difficulty, and how fast you moved — that&apos;s what
              actually changes what you do tomorrow. The number is just a bookmark.
            </p>
          </div>
        </div>
        <p className="mt-4 border-t border-line pt-3.5 text-[0.75rem] text-ink-3">
          Method: a Rasch ability estimate weighted by item difficulty, response time, and
          completion, blended toward the official content blueprint, then mapped to the 200–800
          scale. The full methodology is documented in{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5 font-mono">docs/SCORING.md</code>.
        </p>
      </Card>

      {/* --- Domain performance ------------------------------------------ */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {(["MATH", "READING_WRITING"] as const).map((section) => {
          const rows = domainsFor(section);
          const est = sections.find((s) => s.section === section);
          return (
            <Card key={section}>
              <CardHeader
                title={`${SECTION_LABEL[section]} by content domain`}
                eyebrow={
                  est
                    ? `${est.correct}/${est.total} correct · routing ${Math.round(est.routingAccuracy * 100)}% → adaptive ${Math.round(est.adaptiveAccuracy * 100)}%`
                    : undefined
                }
              />
              <div className="mt-2">
                <DomainRadar data={rows} label={SECTION_LABEL[section]} />
              </div>
              <div className="mt-3 space-y-3">
                {rows.map((d) => (
                  <MetricRow
                    key={d.domain}
                    label={d.domain}
                    value={`${d.correct}/${d.total}`}
                    progress={d.accuracy * 100}
                    tone={d.accuracy >= 0.7 ? "good" : d.accuracy >= 0.4 ? "warn" : "bad"}
                  />
                ))}
                {rows.length === 0 ? (
                  <p className="text-[0.8125rem] text-ink-3">No data for this section.</p>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>

      {/* --- Difficulty + timing ------------------------------------------ */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Accuracy by difficulty"
            description="A profile that falls off steeply at hard is normal. A flat or inverted one usually means careless slips rather than missing knowledge."
          />
          <div className="mt-4">
            <DifficultyBars data={difficultyRows} />
          </div>
          <p className="mt-2 text-[0.75rem] text-ink-3">
            Consistency index{" "}
            <strong className="font-mono text-ink">
              {Math.round((breakdown?.consistencyIndex ?? 1) * 100)}%
            </strong>{" "}
            — how well your results line up with question difficulty. Lower values widen your
            confidence range.
          </p>
        </Card>

        <Card>
          <CardHeader
            title="Time management"
            description="Bars are seconds per question, colored by whether you got it right."
          />
          <div className="mt-4">
            <TimingChart
              data={timeline.map((t) => ({
                label: String(t.order),
                seconds: t.seconds,
                target: t.targetSeconds,
                correct: t.correct,
              }))}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(breakdown?.timing ?? []).map((t) => (
              <div key={t.section} className="card-inset p-3">
                <p className="text-[0.75rem] font-semibold text-ink">
                  {SECTION_LABEL[t.section]}
                </p>
                <p className="mt-1 font-mono text-lg font-semibold text-ink">{t.avgSec}s</p>
                <p className="text-[0.75rem] text-ink-3">
                  vs {t.recommendedAvgSec}s target ·{" "}
                  {t.verdict === "TOO_FAST"
                    ? "moving too fast"
                    : t.verdict === "TOO_SLOW"
                      ? "over budget"
                      : "on pace"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* --- Strengths / weaknesses / flags ------------------------------- */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Strongest areas" eyebrow="Keep, don't drill" />
          <SkillList items={strengths} tone="good" empty="Nothing hit 75% yet on this diagnostic." />
        </Card>
        <Card>
          <CardHeader title="Weakest areas" eyebrow="Where the points are" />
          <SkillList items={weaknesses} tone="bad" empty="No skill fell below 60% — nice." />
        </Card>
        <Card>
          <CardHeader title="Behavior flags" eyebrow="Beyond right and wrong" />
          <FlagList flags={flags} breakdown={breakdown} />
        </Card>
      </div>

      {/* --- Recommendations --------------------------------------------- */}
      <Card>
        <CardHeader
          title="Start here"
          eyebrow={isLatest ? "High-priority improvements" : "Current priorities, not this attempt's"}
          description={
            isLatest
              ? "Ranked by how much of the test the skill covers, how far you are from your target mastery, and what kind of problem it is."
              : "These reflect everything you've practiced since this attempt, not the state you were in when you took it."
          }
          action={<ArrowLink href="/practice">All recommendations</ArrowLink>}
        />
        {recommendations.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="No recommendations yet"
            body="Answer a few more questions and the engine will have enough signal to prioritize."
          />
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {recommendations.map((r) => (
              <li key={r.id} className="rounded-md border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[0.6875rem] font-semibold text-ink-3">
                    #{r.priority}
                  </span>
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
                  <Badge>{SECTION_LABEL[r.section] ?? r.section}</Badge>
                </div>
                <p className="mt-2 text-[0.875rem] font-semibold text-ink">{r.skill}</p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-3">{r.reason}</p>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between font-mono text-[0.6875rem] text-ink-3">
                    <span>mastery {Math.round(r.currentMastery * 100)}%</span>
                    <span>target {Math.round(r.targetMastery * 100)}%</span>
                  </div>
                  <ProgressBar
                    value={r.currentMastery * 100}
                    max={r.targetMastery * 100}
                    tone={r.currentMastery < r.targetMastery * 0.6 ? "bad" : "warn"}
                    label={`${r.skill} mastery`}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="chip">{r.recommendedQuestions} questions</span>
                  <span className="chip">~{r.estimatedMinutes} min</span>
                  <span className="chip">{r.recommendedDifficulty.toLowerCase()}</span>
                </div>

                <div className="mt-3.5">
                  <ButtonLink
                    href={practiceHref({
                      section: r.section,
                      skill: r.skill,
                      recommendedDifficulty:
                        r.recommendedDifficulty as "EASY" | "MEDIUM" | "HARD" | "MIXED",
                      recommendedQuestions: r.recommendedQuestions,
                    })}
                    variant="primary"
                    size="sm"
                  >
                    Start this practice set
                  </ButtonLink>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* --- Missed questions -------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl text-ink">Every question you missed</h2>
            <p className="mt-1 text-[0.8125rem] text-ink-3">
              With a diagnosis of the most likely reason, based on your answer, your timing, and
              your history — not just the correct answer.
            </p>
          </div>
          <ArrowLink href="/errors">Open the full error log</ArrowLink>
        </div>

        {missed.length === 0 ? (
          <EmptyState
            icon={<IconCheck size={18} />}
            title="You didn't miss anything"
            body="A clean sheet on the diagnostic. Take a full-length practice test for a sterner test of stamina."
          />
        ) : (
          <div className="space-y-2.5">
            {missed.map((m, i) => (
              <MissedQuestionCard key={m.attemptId} item={m} defaultOpen={i === 0} />
            ))}
          </div>
        )}
      </section>

      <p className="pb-2 text-center text-[0.75rem] text-ink-3">
        Predicted scores are estimates from a 20-question diagnostic and are not official College
        Board scores.{" "}
        {isLatest ? (
          <>
            <Link href="/plan" className="font-medium text-accent hover:underline">
              Your study plan
            </Link>{" "}
            has already been rebuilt around these results.
          </>
        ) : (
          <>
            <Link href="/diagnostic" className="font-medium text-accent hover:underline">
              The diagnostics hub
            </Link>{" "}
            shows how this attempt fits the rest of your history.
          </>
        )}
      </p>
    </div>
  );
}

function SkillList({
  items,
  tone,
  empty,
}: {
  items: SkillPerformance[];
  tone: "good" | "bad";
  empty: string;
}) {
  if (!items.length) {
    return <p className="mt-3 text-[0.8125rem] text-ink-3">{empty}</p>;
  }
  return (
    <ul className="mt-3 space-y-2.5">
      {items.map((s) => (
        <li key={`${s.section}-${s.skill}`}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-[0.8125rem] text-ink-2">{s.skill}</span>
            <span
              className={cxTone(tone)}
            >
              {s.correct}/{s.total}
            </span>
          </div>
          {s.subskill ? (
            <p className="truncate text-[0.6875rem] text-ink-3">{s.subskill}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function cxTone(tone: "good" | "bad"): string {
  return `shrink-0 font-mono text-[0.8125rem] font-semibold ${tone === "good" ? "text-good" : "text-bad"}`;
}

function FlagList({
  flags,
  breakdown,
}: {
  flags: ResponseFlag[];
  breakdown: DiagnosticBreakdown | null;
}) {
  const counts = new Map<string, number>();
  for (const f of flags) counts.set(f.kind, (counts.get(f.kind) ?? 0) + 1);

  const rows: { label: string; value: number; hint: string; icon: React.ReactNode }[] = [
    {
      label: "Answered very fast",
      value: breakdown?.rushedCount ?? 0,
      hint: "Under a quarter of the target time — likely guesses.",
      icon: <IconClock size={13} />,
    },
    {
      label: "Ran long",
      value: breakdown?.slowCount ?? 0,
      hint: "More than double the target time.",
      icon: <IconClock size={13} />,
    },
    {
      label: "Left blank",
      value: breakdown?.unanswered ?? 0,
      hint: "There is no guessing penalty on the SAT.",
      icon: <IconAlert size={13} />,
    },
    {
      label: "Answer changes",
      value: breakdown?.answerChanges ?? 0,
      hint: "High counts point at trouble eliminating choices.",
      icon: <IconTrendUp size={13} />,
    },
    {
      label: "Easy questions missed",
      value: counts.get("MISSED_EASY") ?? 0,
      hint: "The cheapest points to win back.",
      icon: <IconAlert size={13} />,
    },
  ];

  return (
    <ul className="mt-3 space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="flex min-w-0 items-center gap-1.5 text-[0.8125rem] text-ink-2">
              <span className="text-ink-3">{r.icon}</span>
              <span className="truncate">{r.label}</span>
            </span>
            <span
              className={`shrink-0 font-mono text-[0.8125rem] font-semibold ${r.value > 0 ? "text-ink" : "text-ink-3"}`}
            >
              {r.value}
            </span>
          </div>
          <p className="mt-0.5 text-[0.6875rem] leading-snug text-ink-3">{r.hint}</p>
        </li>
      ))}
    </ul>
  );
}

