import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { PracticeRunner } from "@/components/practice/PracticeRunner";
import { INTERVAL_LADDER_DAYS } from "@/lib/srs";
import { ButtonLink, Card, CardHeader, EmptyState, IconLayers, PageHeader, Stat } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SpacedRepetitionPage() {
  const user = await getLocalUser();
  const now = new Date();

  const [due, total, graduated, nextDue] = await Promise.all([
    prisma.srsItem.count({ where: { userId: user.id, active: true, dueDate: { lte: now } } }),
    prisma.srsItem.count({ where: { userId: user.id, active: true } }),
    prisma.srsItem.count({ where: { userId: user.id, active: false } }),
    prisma.srsItem.findFirst({
      where: { userId: user.id, active: true, dueDate: { gt: now } },
      orderBy: { dueDate: "asc" },
      select: { dueDate: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Review"
        title="Spaced repetition"
        description="Questions you've missed come back on a widening schedule until they stick. Answer correctly and confidently to push an item further out; miss it and it comes back sooner, with a fresh error log."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Due now" value={due} tone={due > 0 ? "warn" : "good"} />
        <Stat label="In the queue" value={total} icon={<IconLayers size={13} />} />
        <Stat label="Graduated" value={graduated} tone="good" sub="Mastered the full ladder" />
        <Stat
          label="Next due"
          value={nextDue ? nextDue.dueDate.toLocaleDateString() : "—"}
          className="[&_div:nth-child(2)]:text-base"
        />
      </div>

      {due === 0 ? (
        <EmptyState
          icon={<IconLayers size={18} />}
          title={total === 0 ? "Nothing in your review queue" : "Nothing due right now"}
          body={
            total === 0
              ? "Questions you miss are added here automatically and resurface on a schedule."
              : `${total} item${total === 1 ? "" : "s"} are scheduled for later. Come back when they're due, or work through your error log in the meantime.`
          }
          action={
            <ButtonLink href={total === 0 ? "/practice" : "/errors"} variant="primary" size="sm">
              {total === 0 ? "Start practicing" : "Open error log"}
            </ButtonLink>
          }
        />
      ) : (
        <PracticeRunner config={{ mode: "srs" }} title="Spaced review" />
      )}

      <Card>
        <CardHeader
          title="How the schedule works"
          description="A simple, inspectable interval ladder — no black-box algorithm."
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {INTERVAL_LADDER_DAYS.map((days, i) => (
            <div key={i} className="rounded-md border border-line bg-surface-2 px-3 py-2 text-center">
              <p className="font-mono text-[0.6875rem] text-ink-3">rung {i}</p>
              <p className="font-mono text-[0.9375rem] font-semibold text-ink">
                {days === 0 ? "same day" : `${days}d`}
              </p>
            </div>
          ))}
        </div>
        <ul className="mt-4 space-y-1.5 text-[0.8125rem] leading-relaxed text-ink-2">
          <li>Correct and confident moves an item up one rung.</li>
          <li>Correct but unsure holds it at the same interval — a shaky win isn&apos;t mastery.</li>
          <li>A miss drops it back two rungs and requires a new error log.</li>
          <li>Clearing the top rung confidently graduates the item out of the queue.</li>
        </ul>
      </Card>
    </div>
  );
}
