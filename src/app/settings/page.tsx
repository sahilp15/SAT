import { getLocalUserWithProfile } from "@/lib/user";
import { getUpcomingSatDates } from "@/lib/satDates";
import { isAiConfigured } from "@/lib/ai";
import { SettingsForm } from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getLocalUserWithProfile();
  const dates = getUpcomingSatDates();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <SettingsForm
        dates={dates}
        initial={{
          satDateId: user.profile?.satDateId ?? null,
          targetScore: user.profile?.targetScore ?? null,
          defaultTimerSecs: user.settings?.defaultTimerSecs ?? 75,
          aiEnabled: user.settings?.aiEnabled ?? true,
          aiConfigured: isAiConfigured(),
        }}
      />
    </div>
  );
}
