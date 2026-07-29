import { prisma } from "@/lib/db";
import { getLocalUserWithProfile } from "@/lib/user";
import { getAiModelLabel, getAiUsageSnapshot, isAiConfigured } from "@/lib/ai";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { ArrowLink, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getLocalUserWithProfile();
  const questionCount = await prisma.question.count();
  const usage = getAiUsageSnapshot();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Preferences and data"
        description="Test date, target score, and availability live in your profile."
        actions={<ArrowLink href="/profile">Edit profile</ArrowLink>}
      />
      <SettingsForm
        initial={{
          defaultTimerSecs: user.settings?.defaultTimerSecs ?? 75,
          aiEnabled: user.settings?.aiEnabled ?? true,
          aiConfigured: isAiConfigured(),
          aiModel: getAiModelLabel(),
          dailyGoalQuestions: user.profile?.dailyGoalQuestions ?? 20,
          wantsReminders: user.profile?.wantsReminders ?? true,
          requestsToday: usage.requestsToday,
          questionCount,
        }}
      />
    </div>
  );
}
