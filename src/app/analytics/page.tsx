import { prisma } from "@/lib/db";
import { getLocalUserWithProfile } from "@/lib/user";
import { getOverview, readinessEstimate } from "@/lib/analytics";
import { SIGNAL_DESCRIPTIONS, SIGNAL_LABELS, type MasterySignal } from "@/lib/mastery";
import { practiceHref } from "@/lib/studyPlanner";
import {
  AccuracyOverTime,
  DifficultyProfile,
  MistakeTypes,
  VolumeOverTime,
} from "@/components/analytics/AnalyticsCharts";
import { DomainRadar } from "@/components/diagnostic/DiagnosticCharts";
import {
  ArrowLink,
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  IconChart,
  IconCheck,
  IconClock,
  IconLayers,
  IconTrendUp,
  MetricRow,
  PageHeader,
  ProgressBar,
  ProgressRing,
  Stat,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const SECTION_LABEL: Record<string, string> = {
  MATH: "Math",
  READING_WRITING: "Reading & Writing",
};

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

const SIGNAL_TONE: Record<MasterySignal, "good" | "bad" | "warn" | "accent" | "neutral"> = {
  STRONG: "good",
  IMPROVING: "good",
  HARD_ONLY: "warn",
  TIMING: "warn",
  CARELESS: "warn",
  CONCEPT_GAP: "bad",
  UNTESTED: "neutral",
};

export default async function AnalyticsPage() {
  const user = await getLocalUserWithProfile();
  const [overview, latestResult] = await Promise.all([
    getOverview(user.id),
    prisma.diagnosticResult.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const readiness = readinessEstimate(overview, user.profile?.targetScore ?? null);

  const improving = overview.topics.filter((t) => t.delta > 0.02).slice(0, 6);
  const declining = overview.topics
    .filter((t) => t.delta < -0.02)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 6);

  const domainsFor = (section: string) =>
    overview.byDomain
      .filter((d) => d.section === section)
      .map((d) => ({
        domain: d.domain,
        short: DOMAIN_SHORT[d.domain] ?? d.domain,
        accuracy: d.accuracy,
        correct: Math.round(d.accuracy * d.attempts),
        total: d.attempts,
      }));

  if (overview.answered === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Analytics" title="Progress" />
        <EmptyState
          icon={<IconChart size={18} />}
          title="No practice data yet"
          body="Analytics fill in as you answer questions. The fastest way to populate this page is the 20-question score predictor."
          action={
            <ButtonLink href="/diagnostic" variant="primary" size="sm">
              Take the score predictor
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Progress"
        description="Everything here is computed from your own attempts. Mastery is a difficulty-weighted, recency-decayed estimate — not raw accuracy."
        actions={<ButtonLink href="/errors">Error log</ButtonLink>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Questions answered"
          value={overview.answered}
          sub={`${overview.correct} correct · ${overview.missed} missed`}
          icon={<IconLayers size={13} />}
        />
        <Stat
          label="Overall accuracy"
          value={`${Math.round(overview.accuracy * 100)}%`}
          icon={<IconCheck size={13} />}
        />
        <Stat
          label="Avg time / question"
          value={overview.avgTimeSec != null ? `${overview.avgTimeSec}s` : "—"}
          sub="Across every recorded attempt"
          icon={<IconClock size={13} />}
        />
        <Stat
          label="Spaced review queue"
          value={overview.srsTotal}
          sub={`${overview.srsDue} due now`}
          tone={overview.srsDue > 0 ? "warn" : "good"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader title="Accuracy over time" eyebrow="Daily" />
          <div className="mt-3">
            <AccuracyOverTime data={overview.accuracyOverTime} />
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center lg:col-span-4">
          <ProgressRing value={readiness.pct} size={112} thickness={9} tone="accent">
            <span className="font-mono text-2xl font-semibold leading-none text-ink">
              {readiness.pct}%
            </span>
            <span className="mt-1 text-[0.6875rem] text-ink-3">{readiness.label}</span>
          </ProgressRing>
          <p className="mt-4 text-center text-[0.75rem] leading-relaxed text-ink-3">
            {readiness.note}
          </p>
          {latestResult ? (
            <p className="mt-3 border-t border-line pt-3 text-center text-[0.75rem] text-ink-3">
              Predicted score{" "}
              <strong className="font-mono text-ink">{latestResult.totalScore}</strong> (
              {latestResult.totalLow}–{latestResult.totalHigh})
            </p>
          ) : null}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Accuracy by difficulty"
            description="Falling off at hard is normal. Flat or inverted usually means careless slips."
          />
          <div className="mt-3">
            <DifficultyProfile data={overview.byDifficulty} />
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Practice volume"
            description="Questions per day over the last month. Consistency beats intensity."
          />
          <div className="mt-3">
            <VolumeOverTime data={overview.volumeOverTime} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(["MATH", "READING_WRITING"] as const).map((section) => {
          const rows = domainsFor(section);
          const stats = overview.bySection.find((s) => s.section === section);
          if (!rows.length) return null;
          return (
            <Card key={section}>
              <CardHeader
                title={`${SECTION_LABEL[section]} by domain`}
                eyebrow={
                  stats
                    ? `${stats.correct}/${stats.answered} · ${Math.round(stats.accuracy * 100)}%`
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
                    value={`${Math.round(d.accuracy * 100)}%`}
                    hint={`${d.total} question${d.total === 1 ? "" : "s"}`}
                    progress={d.accuracy * 100}
                    tone={d.accuracy >= 0.7 ? "good" : d.accuracy >= 0.4 ? "warn" : "bad"}
                  />
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader
          title="Skill mastery"
          eyebrow="Every skill you've attempted"
          description="Mastery is the modelled chance you'd answer a medium question on this skill correctly, weighted by difficulty and decayed toward your recent attempts."
          action={<ArrowLink href="/practice">Practice recommendations</ArrowLink>}
        />
        <div className="scroll-x mt-4">
          <table className="w-full min-w-[46rem] text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="pb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3">
                  Skill
                </th>
                <th className="pb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3">
                  Mastery
                </th>
                <th className="pb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3">
                  E / M / H
                </th>
                <th className="pb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3">
                  Avg time
                </th>
                <th className="pb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3">
                  Signal
                </th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {overview.topics.map((t) => (
                <tr key={`${t.section}-${t.skill}`} className="border-b border-line last:border-0">
                  <td className="py-2.5 pr-3">
                    <span className="block text-[0.8125rem] font-medium text-ink">{t.skill}</span>
                    <span className="block text-[0.6875rem] text-ink-3">
                      {SECTION_LABEL[t.section] ?? t.section} · {t.domain}
                    </span>
                  </td>
                  <td className="w-32 py-2.5 pr-3">
                    <span className="mb-1 block font-mono text-[0.75rem] text-ink">
                      {Math.round(t.mastery * 100)}%
                      {t.delta !== 0 ? (
                        <span className={t.delta > 0 ? "ml-1 text-good" : "ml-1 text-bad"}>
                          {t.delta > 0 ? "+" : ""}
                          {Math.round(t.delta * 100)}
                        </span>
                      ) : null}
                    </span>
                    <ProgressBar
                      value={t.mastery * 100}
                      size="sm"
                      tone={t.mastery >= 0.8 ? "good" : t.mastery >= 0.5 ? "warn" : "bad"}
                      label={`${t.skill} mastery`}
                    />
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-[0.75rem] text-ink-3">
                    {t.byDifficulty.easy.correct}/{t.byDifficulty.easy.total} ·{" "}
                    {t.byDifficulty.medium.correct}/{t.byDifficulty.medium.total} ·{" "}
                    {t.byDifficulty.hard.correct}/{t.byDifficulty.hard.total}
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-[0.75rem] text-ink-3">
                    {t.avgTimeMs ? `${Math.round(t.avgTimeMs / 1000)}s` : "—"}
                  </td>
                  <td className="py-2.5 pr-3">
                    <Badge tone={SIGNAL_TONE[t.signal]}>{SIGNAL_LABELS[t.signal]}</Badge>
                    <span className="mt-0.5 block max-w-[16rem] text-[0.6875rem] leading-snug text-ink-3">
                      {SIGNAL_DESCRIPTIONS[t.signal]}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <ButtonLink
                      href={practiceHref({
                        section: t.section,
                        skill: t.skill,
                        recommendedDifficulty: "MIXED",
                        recommendedQuestions: 10,
                      })}
                      variant="ghost"
                      size="sm"
                    >
                      Practice
                    </ButtonLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Improving" eyebrow="Mastery rising" />
          {improving.length ? (
            <ul className="mt-3 space-y-2.5">
              {improving.map((t) => (
                <li key={t.skill} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[0.8125rem] text-ink-2">{t.skill}</span>
                  <span className="shrink-0 font-mono text-[0.8125rem] font-semibold text-good">
                    +{Math.round(t.delta * 100)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[0.8125rem] text-ink-3">
              Nothing has moved enough to call a trend yet.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader title="Slipping" eyebrow="Mastery falling" />
          {declining.length ? (
            <ul className="mt-3 space-y-2.5">
              {declining.map((t) => (
                <li key={t.skill} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[0.8125rem] text-ink-2">{t.skill}</span>
                  <span className="shrink-0 font-mono text-[0.8125rem] font-semibold text-bad">
                    {Math.round(t.delta * 100)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 text-[0.8125rem] text-ink-3">
              <IconTrendUp size={13} className="text-good" />
              Nothing is going backwards.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader title="Why you miss questions" eyebrow="Mistake types" />
          <div className="mt-2">
            <MistakeTypes data={overview.mistakeTypes} />
          </div>
        </Card>
      </div>
    </div>
  );
}
