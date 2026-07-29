"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconRefresh, IconSpinner } from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";

/**
 * Rebuilds the plan from the latest performance data. The plan also regenerates
 * automatically after a diagnostic, a practice test, or a profile change — this
 * is for when you just want it refreshed now.
 */
export function RegeneratePlanButton() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function regenerate() {
    setBusy(true);
    try {
      const res = await fetch("/api/plan/regenerate", { method: "POST" });
      const data = (await res.json()) as { daysGenerated?: number; recommendations?: number };
      if (!res.ok) throw new Error();
      toast.success(
        "Plan rebuilt",
        `${data.daysGenerated ?? 0} days scheduled from ${data.recommendations ?? 0} prioritized skills.`
      );
      router.refresh();
    } catch {
      toast.error("Couldn't rebuild the plan", "Check that a test date is set in your profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="btn btn-secondary" onClick={regenerate} disabled={busy}>
      {busy ? <IconSpinner size={14} /> : <IconRefresh size={14} />}
      Rebuild plan
    </button>
  );
}
