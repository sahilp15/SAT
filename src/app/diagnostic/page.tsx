import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { getActiveSession, getLatestResult } from "@/lib/diagnostic/session";
import { QUESTIONS_PER_STAGE, TOTAL_QUESTIONS } from "@/lib/diagnostic/form";
import {
  ArrowLink,
  Badge,
  ButtonLink,
  Card,
  IconAlert,
  IconCheck,
  IconClock,
  IconLayers,
  IconTarget,
  PageHeader,
  ScoreRange,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DiagnosticPage({
  searchParams,
}: {
  searchParams: { start?: string };
}) {
  const user = await getLocalUser();
  const [active, latest, reserved] = await Promise.all([
    getActiveSession(user.id),
    getLatestResult(user.id),
    prisma.question.count({ where: { isDiagnostic: true } }),
  ]);

  const bankReady = reserved >= TOTAL_QUESTIONS;
  const answered = active?.responses.filter((r) => r.chosenAnswer).length ?? 0;
  const autoStart = searchParams.start === "1";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Score Predictor"
        title="A 20-question adaptive diagnostic"
        description="Ten Math and ten Reading & Writing questions that adapt to how you're doing. It produces an estimated score with an honest confidence range — and, more usefully, the exact skills to fix first."
      />

      {!bankReady ? (
        <Card className="border-bad">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-bad">
              <IconAlert size={18} />
            </span>
            <div>
              <h2 className="text-[0.9375rem] font-semibold text-ink">
                The diagnostic question set isn&apos;t loaded
              </h2>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-3">
                Only {reserved} of {TOTAL_QUESTIONS} reserved questions are in the database. Run{" "}
                <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.75rem]">
                  npm run db:seed
                </code>{" "}
                to load the question bank, then reload this page.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {active ? (
        <Card className="border-accent">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge tone="accent">In progress</Badge>
              <h2 className="mt-2 text-lg text-ink">Pick up where you left off</h2>
              <p className="mt-1 text-[0.8125rem] text-ink-3">
                {answered} of {TOTAL_QUESTIONS} answered · started{" "}
                {active.startedAt.toLocaleDateString()}
              </p>
            </div>
            <ButtonLink href="/diagnostic/run" variant="primary" size="lg">
              Resume diagnostic
            </ButtonLink>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <h2 className="text-[0.9375rem] font-semibold text-ink">How it works</h2>
          <ol className="mt-4 space-y-4">
            {[
              {
                icon: <IconLayers size={15} />,
                title: `Routing stage — ${QUESTIONS_PER_STAGE} questions per section`,
                body: "A fixed set spanning all four content domains, ramping from easy to hard. Everyone sees the same routing questions, which is what makes the estimate comparable across attempts.",
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
            </ul>
            <div className="mt-5">
              <ButtonLink
                href="/diagnostic/run"
                variant="primary"
                size="lg"
                className="w-full"
                prefetch={autoStart}
              >
                {active ? "Resume diagnostic" : "Start the diagnostic"}
              </ButtonLink>
            </div>
          </Card>

          {latest ? (
            <Card>
              <h2 className="text-[0.9375rem] font-semibold text-ink">Your last result</h2>
              <p className="mt-1 text-[0.75rem] text-ink-3">
                {latest.createdAt.toLocaleDateString()} ·{" "}
                {latest.confidence.toLowerCase()} confidence
              </p>
              <div className="mt-4 font-mono text-3xl font-semibold text-ink">
                {latest.totalScore}
              </div>
              <p className="font-mono text-[0.75rem] text-ink-3">
                range {latest.totalLow}–{latest.totalHigh}
              </p>
              <div className="mt-4 space-y-3.5">
                <ScoreRange
                  label="Reading & Writing"
                  score={latest.rwScore}
                  low={latest.rwLow}
                  high={latest.rwHigh}
                />
                <ScoreRange
                  label="Math"
                  score={latest.mathScore}
                  low={latest.mathLow}
                  high={latest.mathHigh}
                />
              </div>
              <div className="mt-4">
                <ArrowLink href="/diagnostic/results">See the full breakdown</ArrowLink>
              </div>
            </Card>
          ) : null}

          <p className="text-[0.75rem] leading-relaxed text-ink-3">
            The predicted score is an estimate from 20 questions, not an official score. Read{" "}
            <Link href="/diagnostic/results" className="font-medium text-accent hover:underline">
              how it&apos;s calculated
            </Link>{" "}
            after you take it.
          </p>
        </div>
      </div>
    </div>
  );
}
