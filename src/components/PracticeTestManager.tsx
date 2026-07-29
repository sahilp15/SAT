"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCalendar, IconSpinner } from "@/components/ui/icons";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";

interface ScheduledTest {
  id: string;
  testLabel: string;
  scheduledFor: string;
  kind: string;
  completed: boolean;
}

interface TestResult {
  id: string;
  testLabel: string;
  takenOn: string;
  totalScore: number | null;
  mathScore: number | null;
  rwScore: number | null;
}

export function PracticeTestManager({
  scheduled,
  results,
}: {
  scheduled: ScheduledTest[];
  results: TestResult[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    testLabel: scheduled[0]?.testLabel ?? "Official Practice Test 1 (Bluebook)",
    totalScore: "",
    mathScore: "",
    rwScore: "",
    notes: "",
    scheduleId: scheduled[0]?.id ?? "",
  });
  const [saving, setSaving] = useState(false);

  const num = (v: string) => (v.trim() === "" ? null : Number.parseInt(v, 10));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/practice-tests/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testLabel: form.testLabel,
          totalScore: num(form.totalScore),
          mathScore: num(form.mathScore),
          rwScore: num(form.rwScore),
          notes: form.notes || undefined,
          scheduleId: form.scheduleId || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Result saved", "Your study plan has been rebuilt around it.");
      setForm((f) => ({ ...f, totalScore: "", mathScore: "", rwScore: "", notes: "" }));
      router.refresh();
    } catch {
      toast.error("Couldn't save that result");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader
          title="Recommended schedule"
          description="Spaced so you don't burn through official tests early, and never in the final four days."
        />
        {scheduled.length ? (
          <ul className="mt-4 space-y-2">
            {scheduled.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-md border border-line px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[0.8125rem] font-medium text-ink">{t.testLabel}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[0.6875rem] text-ink-3">
                    <IconCalendar size={11} />
                    {new Date(t.scheduledFor).toLocaleDateString()}
                  </p>
                </div>
                {t.kind === "DIAGNOSTIC" ? <Badge tone="accent">Diagnostic</Badge> : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            className="mt-4"
            title="No tests scheduled"
            body="Set a test date in your profile — the schedule spaces full-length tests automatically once there's enough runway."
          />
        )}

        {results.length ? (
          <div className="mt-5 border-t border-line pt-4">
            <p className="eyebrow mb-2">History</p>
            <ul className="space-y-1.5">
              {results.map((r) => (
                <li key={r.id} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[0.8125rem] text-ink-2">
                    {r.testLabel}
                  </span>
                  <span className="shrink-0 font-mono text-[0.8125rem] text-ink">
                    {r.totalScore ?? "—"}
                    <span className="ml-2 text-[0.6875rem] text-ink-3">
                      {new Date(r.takenOn).toLocaleDateString()}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card>
        <CardHeader
          title="Log a completed test"
          description="Entering scores updates your baseline and re-plans the remaining schedule."
        />
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="test-label" className="label">
              Test
            </label>
            <input
              id="test-label"
              className="input"
              required
              value={form.testLabel}
              onChange={(e) => setForm((f) => ({ ...f, testLabel: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="t-total" className="label">
                Total
              </label>
              <input
                id="t-total"
                className="input font-mono"
                type="number"
                min={400}
                max={1600}
                value={form.totalScore}
                onChange={(e) => setForm((f) => ({ ...f, totalScore: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="t-rw" className="label">
                R&amp;W
              </label>
              <input
                id="t-rw"
                className="input font-mono"
                type="number"
                min={200}
                max={800}
                value={form.rwScore}
                onChange={(e) => setForm((f) => ({ ...f, rwScore: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="t-math" className="label">
                Math
              </label>
              <input
                id="t-math"
                className="input font-mono"
                type="number"
                min={200}
                max={800}
                value={form.mathScore}
                onChange={(e) => setForm((f) => ({ ...f, mathScore: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label htmlFor="t-notes" className="label">
              What went wrong? (optional)
            </label>
            <textarea
              id="t-notes"
              className="input"
              rows={3}
              placeholder="Pacing, specific topics, stamina — anything worth remembering."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={saving}>
            {saving ? <IconSpinner /> : null}
            Save result and re-plan
          </button>
        </form>
      </Card>
    </div>
  );
}
