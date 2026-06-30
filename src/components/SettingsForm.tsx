"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SatDate } from "@/lib/satDates";

interface Props {
  dates: SatDate[];
  initial: {
    satDateId: string | null;
    targetScore: number | null;
    defaultTimerSecs: number;
    aiEnabled: boolean;
    aiConfigured: boolean;
  };
}

export function SettingsForm({ dates, initial }: Props) {
  const router = useRouter();
  const [satDateId, setSatDateId] = useState(initial.satDateId ?? "");
  const [targetScore, setTargetScore] = useState(initial.targetScore?.toString() ?? "");
  const [timer, setTimer] = useState(initial.defaultTimerSecs);
  const [aiEnabled, setAiEnabled] = useState(initial.aiEnabled);
  const [savedMsg, setSavedMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setSavedMsg("");
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          satDateId: satDateId || null,
          targetScore: targetScore ? parseInt(targetScore, 10) : null,
          defaultTimerSecs: timer,
          aiEnabled,
        }),
      });
      // Regenerate the plan so a changed SAT date/target reflects immediately.
      await fetch("/api/study-plan", { method: "POST" });
      setSavedMsg("Saved.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function reset(scope: "progress" | "all") {
    const msg =
      scope === "all"
        ? "Erase ALL progress AND reset your profile/onboarding? Questions are kept."
        : "Erase all attempts, error logs, spaced-repetition, and plans? Your profile is kept.";
    if (!confirm(msg)) return;
    await fetch("/api/admin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope }),
    });
    if (scope === "all") router.push("/onboarding");
    else router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <h2 className="font-semibold text-slate-900">Test & goals</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">SAT date</label>
            <select className="input" value={satDateId} onChange={(e) => setSatDateId(e.target.value)}>
              <option value="">Not set</option>
              {dates.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} ({d.date})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Target total score</label>
            <input
              type="number"
              className="input"
              value={targetScore}
              onChange={(e) => setTargetScore(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Default timed seconds / question</label>
            <input
              type="number"
              className="input"
              min={15}
              max={600}
              value={timer}
              onChange={(e) => setTimer(parseInt(e.target.value || "75", 10))}
            />
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold text-slate-900">AI feedback</h2>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={aiEnabled}
            onChange={(e) => setAiEnabled(e.target.checked)}
          />
          Enable AI review of error logs and study plans
        </label>
        <p className="text-xs text-slate-500">
          {initial.aiConfigured
            ? "An OpenAI key is configured on the server. The key is used only in server-side API routes and is never sent to your browser."
            : "No OpenAI key is configured. Add OPENAI_API_KEY to your .env to turn on AI review. Until then, error logs still require a complete reflection."}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
        {savedMsg ? <span className="text-sm text-emerald-600">{savedMsg}</span> : null}
      </div>

      <div className="card border-rose-200 bg-rose-50/40">
        <h2 className="font-semibold text-rose-700">Reset local data</h2>
        <p className="mt-1 text-sm text-slate-600">
          Your progress lives in a local SQLite database. You can clear it here at any time.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => reset("progress")}>
            Reset progress (keep profile)
          </button>
          <button
            className="btn border border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
            onClick={() => reset("all")}
          >
            Reset everything
          </button>
        </div>
      </div>
    </div>
  );
}
