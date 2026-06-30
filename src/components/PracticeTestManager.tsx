"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [form, setForm] = useState({
    testLabel: scheduled[0]?.testLabel ?? "Official Practice Test 1 (Bluebook)",
    totalScore: "",
    mathScore: "",
    rwScore: "",
    notes: "",
    scheduleId: scheduled[0]?.id ?? "",
  });
  const [saving, setSaving] = useState(false);
  const num = (v: string) => (v.trim() === "" ? null : parseInt(v, 10));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/practice-tests/result", {
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
      router.refresh();
      setForm((f) => ({ ...f, totalScore: "", mathScore: "", rwScore: "", notes: "" }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card">
        <h2 className="font-semibold text-slate-900">Recommended schedule</h2>
        <p className="mt-1 text-sm text-slate-500">
          Spaced so you don&apos;t burn through official tests too early. Regenerated from your SAT
          date and progress.
        </p>
        <ul className="mt-3 space-y-2">
          {scheduled.length ? (
            scheduled.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium text-slate-800">{t.testLabel}</div>
                  <div className="text-xs text-slate-500">
                    {t.kind === "DIAGNOSTIC" ? "Diagnostic · " : ""}
                    {new Date(t.scheduledFor).toLocaleDateString()}
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="text-sm text-slate-400">
              No tests scheduled — set a SAT date in Settings to generate a plan.
            </li>
          )}
        </ul>
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-900">Record a completed test</h2>
        <p className="mt-1 text-sm text-slate-500">
          After each practice test, enter your scores. Your study plan updates automatically.
        </p>
        <form onSubmit={submit} className="mt-3 space-y-3">
          <div>
            <label className="label">Test</label>
            <input
              className="input"
              value={form.testLabel}
              onChange={(e) => setForm((f) => ({ ...f, testLabel: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Total</label>
              <input
                className="input"
                type="number"
                value={form.totalScore}
                onChange={(e) => setForm((f) => ({ ...f, totalScore: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Math</label>
              <input
                className="input"
                type="number"
                value={form.mathScore}
                onChange={(e) => setForm((f) => ({ ...f, mathScore: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">R&amp;W</label>
              <input
                className="input"
                type="number"
                value={form.rwScore}
                onChange={(e) => setForm((f) => ({ ...f, rwScore: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label">Notes / categories you missed (optional)</label>
            <textarea
              className="input"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <button className="btn-primary w-full" disabled={saving}>
            {saving ? "Saving…" : "Save result & update plan"}
          </button>
        </form>

        {results.length ? (
          <div className="mt-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              History
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {results.map((r) => (
                <li key={r.id} className="flex justify-between">
                  <span className="truncate pr-2 text-slate-700">{r.testLabel}</span>
                  <span className="text-slate-500">
                    {r.totalScore ?? "—"} ({new Date(r.takenOn).toLocaleDateString()})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
