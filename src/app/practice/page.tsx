import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { practiceHref } from "@/lib/studyPlanner";
import { SIGNAL_DESCRIPTIONS, SIGNAL_LABELS, type MasterySignal } from "@/lib/mastery";
import {
  Badge,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  IconBook,
  IconLayers,
  IconTarget,
  PageHeader,
  ProgressBar,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const SECTION_LABEL: Record<string, string> = {
  MATH: "Math",
  READING_WRITING: "Reading & Writing",
};

const PRIORITY_TONE = {
  CRITICAL: "bad",
  HIGH: "warn",
  MEDIUM: "accent",
  LOW: "neutral",
} as const;

export default async function PracticeHubPage() {
  const user = await getLocalUser();
  const [recommendations, dueCount, unresolved] = await Promise.all([
    prisma.skillRecommendation.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { priority: "asc" },
    }),
    prisma.srsItem.count({ where: { userId: user.id, active: true, dueDate: { lte: new Date() } } }),
    prisma.questionAttempt.count({
      where: { userId: user.id, resolved: false, OR: [{ isCorrect: false }, { flagged: true }] },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Practice"
        title="What to work on"
        description="Recommendations are ranked by how much of the test the skill covers, how far your mastery is from your target, and what kind of problem the data says it is."
        actions={
          <>
            <ButtonLink href="/practice/math">Math</ButtonLink>
            <ButtonLink href="/practice/reading-writing">Reading &amp; Writing</ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickCard
          href="/review/spaced-repetition"
          icon={<IconLayers size={17} />}
          title="Spaced review"
          value={dueCount}
          label={dueCount === 1 ? "question due" : "questions due"}
          tone={dueCount > 0 ? "accent" : "neutral"}
        />
        <QuickCard
          href="/errors"
          icon={<IconTarget size={17} />}
          title="Unresolved mistakes"
          value={unresolved}
          label={unresolved === 1 ? "still open" : "still open"}
          tone={unresolved > 0 ? "bad" : "neutral"}
        />
        <QuickCard
          href="/practice/regression"
          icon={<IconBook size={17} />}
          title="Regression trainer"
          value="Desmos"
          label="scatterplot & model fitting"
          tone="neutral"
        />
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl text-ink">Recommended practice sets</h2>
            <p className="mt-1 text-[0.8125rem] text-ink-3">
              Each set is sized to close a specific gap. Starting one records the results straight
              into your mastery model.
            </p>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <EmptyState
            icon={<IconTarget size={18} />}
            title="No recommendations yet"
            body="Take the score predictor to generate a prioritized list, or just start practicing a section and the engine will learn from the results."
            action={
              <ButtonLink href="/diagnostic" variant="primary" size="sm">
                Take the score predictor
              </ButtonLink>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recommendations.map((r) => {
              const signal = (r.signal as MasterySignal) ?? "UNTESTED";
              return (
                <li key={r.id}>
                  <Card as="article" className="flex h-full flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[0.6875rem] font-semibold text-ink-3">
                        #{r.priority}
                      </span>
                      <Badge
                        tone={PRIORITY_TONE[r.priorityLabel as keyof typeof PRIORITY_TONE] ?? "neutral"}
                      >
                        {r.priorityLabel}
                      </Badge>
                      <Badge>{SECTION_LABEL[r.section] ?? r.section}</Badge>
                    </div>

                    <h3 className="mt-2.5 text-[0.9375rem] font-semibold leading-snug text-ink">
                      {r.skill}
                    </h3>
                    <p className="mt-0.5 text-[0.75rem] text-ink-3">{r.domain}</p>

                    <div className="mt-3 rounded-md bg-surface-2 p-2.5">
                      <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3">
                        {SIGNAL_LABELS[signal]}
                      </p>
                      <p className="mt-0.5 text-[0.75rem] leading-relaxed text-ink-2">
                        {SIGNAL_DESCRIPTIONS[signal]}
                      </p>
                    </div>

                    <p className="mt-3 flex-1 text-[0.8125rem] leading-relaxed text-ink-3">
                      {r.reason}
                    </p>

                    <div className="mt-4">
                      <div className="mb-1 flex justify-between font-mono text-[0.6875rem] text-ink-3">
                        <span>now {Math.round(r.currentMastery * 100)}%</span>
                        <span>target {Math.round(r.targetMastery * 100)}%</span>
                      </div>
                      <ProgressBar
                        value={r.currentMastery * 100}
                        max={r.targetMastery * 100}
                        tone={r.currentMastery < r.targetMastery * 0.6 ? "bad" : "warn"}
                        label={`${r.skill} mastery`}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="chip">{r.recommendedQuestions} questions</span>
                      <span className="chip">~{r.estimatedMinutes} min</span>
                      <span className="chip">{r.recommendedDifficulty.toLowerCase()}</span>
                    </div>

                    <div className="mt-4">
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
                        className="w-full"
                      >
                        Start this set
                      </ButtonLink>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Card>
        <CardHeader
          title="Or build your own set"
          description="Pick a section, then filter by topic, difficulty, and mode."
        />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ButtonLink href="/practice/math" variant="secondary" className="justify-start">
            Math — 19 skills across four domains
          </ButtonLink>
          <ButtonLink
            href="/practice/reading-writing"
            variant="secondary"
            className="justify-start"
          >
            Reading &amp; Writing — 10 skills across four domains
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}

function QuickCard({
  href,
  icon,
  title,
  value,
  label,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  label: string;
  tone: "accent" | "bad" | "neutral";
}) {
  const toneClass =
    tone === "accent" ? "text-accent" : tone === "bad" ? "text-bad" : "text-ink";
  return (
    <a
      href={href}
      className="card flex items-center gap-4 p-4 transition-colors hover:border-accent hover:bg-accent-weak"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.8125rem] font-semibold text-ink">{title}</span>
        <span className={`mt-0.5 block font-mono text-lg font-semibold leading-none ${toneClass}`}>
          {value}
        </span>
        <span className="mt-0.5 block text-[0.75rem] text-ink-3">{label}</span>
      </span>
    </a>
  );
}
