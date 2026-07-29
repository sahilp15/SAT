"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconAlert, IconSpinner } from "@/components/ui/icons";
import { Card, CardHeader } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";

export interface SettingsInitial {
  defaultTimerSecs: number;
  aiEnabled: boolean;
  aiConfigured: boolean;
  aiModel: string | null;
  dailyGoalQuestions: number;
  wantsReminders: boolean;
  requestsToday: number;
  questionCount: number;
}

export function SettingsForm({ initial }: { initial: SettingsInitial }) {
  const router = useRouter();
  const toast = useToast();
  const [timer, setTimer] = useState(initial.defaultTimerSecs);
  const [aiEnabled, setAiEnabled] = useState(initial.aiEnabled);
  const [dailyGoal, setDailyGoal] = useState(initial.dailyGoalQuestions);
  const [reminders, setReminders] = useState(initial.wantsReminders);
  const [saving, setSaving] = useState(false);
  const [resetScope, setResetScope] = useState<"progress" | "all" | null>(null);
  const [resetting, setResetting] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultTimerSecs: timer,
          aiEnabled,
          dailyGoalQuestions: dailyGoal,
          wantsReminders: reminders,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved");
      router.refresh();
    } catch {
      toast.error("Couldn't save settings");
    } finally {
      setSaving(false);
    }
  }

  async function runReset() {
    if (!resetScope) return;
    setResetting(true);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: resetScope }),
      });
      if (!res.ok) throw new Error();
      toast.success(resetScope === "all" ? "Everything reset" : "Progress cleared");
      if (resetScope === "all") router.push("/onboarding");
      else router.refresh();
    } catch {
      toast.error("Reset failed");
    } finally {
      setResetting(false);
      setResetScope(null);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Practice preferences"
          description="How practice sessions behave by default."
        />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="timer" className="label">
              Timed mode: seconds per question
            </label>
            <input
              id="timer"
              type="number"
              min={15}
              max={600}
              className="input max-w-[8rem] font-mono"
              value={timer}
              onChange={(e) => setTimer(Number.parseInt(e.target.value || "75", 10))}
            />
            <p className="hint mt-1.5">
              The real test averages about 95s per Math question and 71s per Reading &amp; Writing
              question.
            </p>
          </div>
          <div>
            <label htmlFor="daily-goal" className="label">
              Daily question goal
            </label>
            <input
              id="daily-goal"
              type="number"
              min={0}
              max={200}
              className="input max-w-[8rem] font-mono"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number.parseInt(e.target.value || "0", 10))}
            />
            <p className="hint mt-1.5">Shown as the ring on your dashboard.</p>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-3">
          <input
            id="reminders"
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            checked={reminders}
            onChange={(e) => setReminders(e.target.checked)}
          />
          <label htmlFor="reminders" className="text-[0.8125rem] leading-relaxed text-ink-2">
            <span className="block font-semibold text-ink">Daily goals and nudges</span>
            Show streaks, daily targets, and reminders about what&apos;s due.
          </label>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="AI features"
          description="AI enhances the app but never gates it: scoring, practice, the error log, and your plan all work without it."
        />
        <div className="mt-4 flex items-start gap-3">
          <input
            id="ai-enabled"
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            checked={aiEnabled}
            disabled={!initial.aiConfigured}
            onChange={(e) => setAiEnabled(e.target.checked)}
          />
          <label htmlFor="ai-enabled" className="text-[0.8125rem] leading-relaxed text-ink-2">
            <span className="block font-semibold text-ink">
              Enable AI tutoring, mistake analysis, and coaching
            </span>
            Turning this off keeps everything local and makes zero API requests.
          </label>
        </div>

        <div className="mt-4 rounded-md border border-line bg-surface-2 p-3.5">
          <p className="text-[0.8125rem] font-semibold text-ink">
            {initial.aiConfigured ? "An API key is configured" : "No API key configured"}
          </p>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-2">
            {initial.aiConfigured ? (
              <>
                Using model <code className="font-mono">{initial.aiModel}</code>. The key is read
                only inside server routes and is never sent to your browser, written to the
                database, or included in any API response.{" "}
                {initial.requestsToday} request{initial.requestsToday === 1 ? "" : "s"} made since
                this server started.
              </>
            ) : (
              <>
                Add <code className="font-mono">OPENAI_API_KEY</code> to your{" "}
                <code className="font-mono">.env</code> file and restart the dev server. See{" "}
                <code className="font-mono">.env.example</code> for every supported variable,
                including timeout, retry, and daily request caps.
              </>
            )}
          </p>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? <IconSpinner /> : null}
          Save settings
        </button>
      </div>

      <Card className="border-bad">
        <CardHeader
          title="Reset local data"
          description={`Your progress lives in a local SQLite file. The question bank (${initial.questionCount} questions) is never touched by either reset.`}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setResetScope("progress")}
          >
            Clear progress, keep my profile
          </button>
          <button type="button" className="btn btn-danger" onClick={() => setResetScope("all")}>
            <IconAlert size={14} />
            Reset everything
          </button>
        </div>
      </Card>

      <ConfirmDialog
        open={resetScope !== null}
        onClose={() => setResetScope(null)}
        onConfirm={runReset}
        busy={resetting}
        destructive
        title={resetScope === "all" ? "Reset everything?" : "Clear all progress?"}
        confirmLabel={resetScope === "all" ? "Reset everything" : "Clear progress"}
        body={
          resetScope === "all" ? (
            <>
              This permanently deletes every attempt, error log, diagnostic result, mastery record,
              recommendation, plan day, and tutor message — and resets your profile so onboarding
              runs again. The question bank is kept. This cannot be undone.
            </>
          ) : (
            <>
              This permanently deletes every attempt, error log, diagnostic result, mastery record,
              recommendation, and plan day. Your profile, test date, and target score are kept. This
              cannot be undone.
            </>
          )
        }
      />
    </div>
  );
}
