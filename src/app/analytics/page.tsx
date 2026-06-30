import { getLocalUserWithProfile } from "@/lib/user";
import { getOverview, readinessEstimate } from "@/lib/analytics";
import { Card, Stat, ProgressBar } from "@/components/ui";
import {
  AccuracyOverTime,
  AccuracyByDifficulty,
  MistakeTypes,
} from "@/components/AnalyticsCharts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await getLocalUserWithProfile();
  const o = await getOverview(user.id);
  const readiness = readinessEstimate(o, user.profile?.targetScore ?? null);

  const improving = o.byTopic.filter((t) => t.trend > 0.02).slice(0, 5);
  const declining = o.byTopic.filter((t) => t.trend < -0.02).slice(0, 5);
  const srsSuccess =
    o.srsTotal + o.srsDue > 0
      ? Math.round(((o.srsTotal - o.srsDue) / Math.max(1, o.srsTotal)) * 100)
      : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Progress &amp; Analytics</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Overall accuracy" value={`${Math.round(o.accuracy * 100)}%`} sub={`${o.correct}/${o.answered}`} />
        <Stat label="Error logs" value={o.errorLogsCompleted} />
        <Stat label="Avg time / Q" value={o.avgTimeSec != null ? `${o.avgTimeSec}s` : "—"} />
        <Stat label="Readiness" value={`${readiness.pct}%`} sub={readiness.label} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">Accuracy over time</h2>
          <AccuracyOverTime data={o.accuracyOverTime} />
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">Accuracy by difficulty</h2>
          <AccuracyByDifficulty data={o.byDifficulty} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">Most common mistake types</h2>
          <MistakeTypes data={o.mistakeTypes} />
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">Accuracy by topic</h2>
          <div className="space-y-3">
            {o.byTopic.length ? (
              o.byTopic.slice(0, 10).map((t) => (
                <div key={`${t.section}-${t.skill}`}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="truncate pr-2 text-slate-600">{t.skill}</span>
                    <span className="font-medium">
                      {Math.round(t.accuracy * 100)}% ({t.attempts})
                    </span>
                  </div>
                  <ProgressBar value={t.accuracy * 100} />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No topic data yet.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="mb-2 font-semibold text-emerald-700">Improving topics</h2>
          <ul className="space-y-1 text-sm">
            {improving.length ? (
              improving.map((t) => (
                <li key={t.skill} className="flex justify-between">
                  <span className="truncate pr-2 text-slate-700">{t.skill}</span>
                  <span className="text-emerald-600">+{Math.round(t.trend * 100)}%</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400">Keep practicing to see trends.</li>
            )}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold text-rose-700">Declining topics</h2>
          <ul className="space-y-1 text-sm">
            {declining.length ? (
              declining.map((t) => (
                <li key={t.skill} className="flex justify-between">
                  <span className="truncate pr-2 text-slate-700">{t.skill}</span>
                  <span className="text-rose-600">{Math.round(t.trend * 100)}%</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400">Nothing declining — nice.</li>
            )}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold text-slate-900">Spaced repetition</h2>
          <p className="text-sm text-slate-600">
            {o.srsTotal} active items · {o.srsDue} due now.
          </p>
          {srsSuccess != null ? (
            <p className="mt-1 text-sm text-slate-600">
              Roughly {srsSuccess}% of your queue is currently &quot;not due&quot; (on track).
            </p>
          ) : null}
          <p className="mt-3 text-xs text-slate-500">{readiness.note}</p>
        </Card>
      </div>
    </div>
  );
}
