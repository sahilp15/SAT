import { getLocalUserWithProfile } from "@/lib/user";
import { getUpcomingSatDates } from "@/lib/satDates";
import { resolveTestDate } from "@/lib/testDate";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ArrowLink, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

function parseArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export default async function ProfilePage() {
  const user = await getLocalUserWithProfile();
  const profile = user.profile;
  const dates = getUpcomingSatDates();
  const resolved = resolveTestDate(profile);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Your study profile"
        description={
          resolved
            ? `Everything the plan is built from. ${Math.max(0, resolved.daysRemaining)} days until ${resolved.label}.`
            : "Everything the plan is built from. Saving rebuilds your schedule."
        }
        actions={<ArrowLink href="/onboarding?restart=1">Run setup again</ArrowLink>}
      />
      <ProfileForm
        dates={dates}
        initial={{
          testDate: profile?.testDate ?? dates[0]?.date ?? "2026-08-22",
          satDateId: profile?.satDateId ?? null,
          targetScore: profile?.targetScore ?? 1600,
          strongerSection: profile?.strongerSection ?? "BALANCED",
          weakerSection: profile?.weakerSection ?? "BALANCED",
          strugglingTopics: parseArray(profile?.strugglingTopics),
          daysPerWeek: profile?.daysPerWeek ?? 5,
          minutesPerDay: profile?.minutesPerDay ?? 60,
          availableDays: parseArray(profile?.availableDays),
          preferredStudyTimes: parseArray(profile?.preferredStudyTimes),
          studyStyle: profile?.studyStyle ?? "BOTH",
          priorTestType: profile?.priorTestType ?? "NONE",
          lastTotalScore: profile?.lastTotalScore ? String(profile.lastTotalScore) : "",
          lastMathScore: profile?.lastMathScore ? String(profile.lastMathScore) : "",
          lastRwScore: profile?.lastRwScore ? String(profile.lastRwScore) : "",
        }}
      />
    </div>
  );
}
