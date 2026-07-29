import { Suspense } from "react";
import { getLocalUser } from "@/lib/user";
import { getErrorLog, getErrorLogFacets, getErrorLogStats } from "@/lib/errorLog";
import { mistakeLabel } from "@/lib/taxonomy";
import { ErrorLogFilters } from "@/components/review/ErrorLogFilters";
import { MissedQuestionCard } from "@/components/review/MissedQuestionCard";
import {
  ButtonLink,
  Card,
  EmptyState,
  IconAlert,
  IconCheck,
  IconLayers,
  PageHeader,
  Stat,
} from "@/components/ui";

export const dynamic = "force-dynamic";

interface SearchParams {
  status?: string;
  section?: string;
  domain?: string;
  skill?: string;
  category?: string;
  difficulty?: string;
  origin?: string;
  days?: string;
}

export default async function ErrorLogPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getLocalUser();

  const days = Number.parseInt(searchParams.days ?? "", 10);
  const since = Number.isFinite(days) && days > 0 ? new Date(Date.now() - days * 86_400_000) : undefined;

  const status =
    searchParams.status === "RESOLVED"
      ? "RESOLVED"
      : searchParams.status === "ALL"
        ? "ALL"
        : "UNRESOLVED";
  const origin =
    searchParams.origin === "DIAGNOSTIC"
      ? "DIAGNOSTIC"
      : searchParams.origin === "PRACTICE"
        ? "PRACTICE"
        : "ALL";

  const [entries, facets, stats] = await Promise.all([
    getErrorLog(user.id, {
      status,
      origin,
      since,
      section: searchParams.section || undefined,
      domain: searchParams.domain || undefined,
      skill: searchParams.skill || undefined,
      category: searchParams.category || undefined,
      difficulty: searchParams.difficulty || undefined,
      limit: 100,
    }),
    getErrorLogFacets(user.id),
    getErrorLogStats(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Error log"
        title="Everything you've missed"
        description="Missed and flagged questions, with a diagnosis of why. Nothing disappears after one session — unresolved items keep resurfacing through spaced review until you close them out."
        actions={
          stats.dueForReview > 0 ? (
            <ButtonLink href="/review/spaced-repetition" variant="primary">
              Review {stats.dueForReview} due
            </ButtonLink>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total entries" value={stats.total} icon={<IconLayers size={13} />} />
        <Stat
          label="Unresolved"
          value={stats.unresolved}
          tone={stats.unresolved > 0 ? "bad" : "good"}
          icon={<IconAlert size={13} />}
        />
        <Stat
          label="Marked understood"
          value={stats.resolved}
          tone="good"
          icon={<IconCheck size={13} />}
        />
        <Stat
          label="Most common cause"
          value={stats.topCategory ? mistakeLabel(stats.topCategory) : "—"}
          className="[&_div:nth-child(2)]:text-base"
        />
      </div>

      {/* Filters read from useSearchParams, so they need a Suspense boundary. */}
      <Suspense fallback={<Card className="h-[4.5rem]"><span className="sr-only">Loading filters</span></Card>}>
        <ErrorLogFilters facets={facets} count={entries.length} />
      </Suspense>

      {entries.length === 0 ? (
        <EmptyState
          icon={<IconCheck size={18} />}
          title={
            stats.total === 0
              ? "Nothing in your error log yet"
              : "Nothing matches these filters"
          }
          body={
            stats.total === 0
              ? "Missed and flagged questions land here automatically, with an analysis of why you missed them and what to do about it."
              : "Try widening the filters, or switch the status tab to 'All'."
          }
          action={
            stats.total === 0 ? (
              <ButtonLink href="/practice" variant="primary" size="sm">
                Start practicing
              </ButtonLink>
            ) : null
          }
        />
      ) : (
        <div className="space-y-2.5">
          {entries.map((entry) => (
            <MissedQuestionCard key={entry.attemptId} item={entry} />
          ))}
        </div>
      )}

      {entries.length >= 100 ? (
        <p className="text-center text-[0.75rem] text-ink-3">
          Showing the 100 most recent entries. Narrow the filters to see older ones.
        </p>
      ) : null}
    </div>
  );
}
