import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { getUpcomingSatDates } from "@/lib/satDates";
import { getLocalUserWithProfile } from "@/lib/user";

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

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { restart?: string };
}) {
  const user = await getLocalUserWithProfile();
  const profile = user.profile;

  // Already set up? Go straight to the dashboard unless explicitly restarting.
  if (profile?.onboardingComplete && searchParams.restart !== "1") redirect("/dashboard");

  const dates = getUpcomingSatDates();

  return (
    <OnboardingFlow
      dates={dates}
      initialStep={profile?.onboardingStep ?? 0}
      initialValues={{
        ...(profile?.testDate ? { testDate: profile.testDate } : {}),
        ...(profile?.satDateId ? { satDateId: profile.satDateId } : {}),
        ...(profile?.targetScore ? { targetScore: profile.targetScore } : {}),
        ...(profile?.priorTestType
          ? { priorTestType: profile.priorTestType as "SAT" | "PSAT" | "PRACTICE" | "NONE" }
          : {}),
        ...(profile?.lastTotalScore ? { lastTotalScore: String(profile.lastTotalScore) } : {}),
        ...(profile?.lastMathScore ? { lastMathScore: String(profile.lastMathScore) } : {}),
        ...(profile?.lastRwScore ? { lastRwScore: String(profile.lastRwScore) } : {}),
        ...(profile?.strongerSection
          ? { strongerSection: profile.strongerSection as "MATH" | "READING_WRITING" | "BALANCED" }
          : {}),
        ...(profile?.weakerSection
          ? { weakerSection: profile.weakerSection as "MATH" | "READING_WRITING" | "BALANCED" }
          : {}),
        ...(profile?.strugglingTopics
          ? { strugglingTopics: parseArray(profile.strugglingTopics) }
          : {}),
        ...(profile?.daysPerWeek ? { daysPerWeek: profile.daysPerWeek } : {}),
        ...(profile?.minutesPerDay ? { minutesPerDay: profile.minutesPerDay } : {}),
        ...(profile?.availableDays ? { availableDays: parseArray(profile.availableDays) } : {}),
        ...(profile?.preferredStudyTimes
          ? { preferredStudyTimes: parseArray(profile.preferredStudyTimes) }
          : {}),
        ...(profile?.studyStyle
          ? { studyStyle: profile.studyStyle as "STRUCTURED" | "FLEXIBLE" | "BOTH" }
          : {}),
        wantsReminders: profile?.wantsReminders ?? true,
        dailyGoalQuestions: profile?.dailyGoalQuestions ?? 20,
      }}
    />
  );
}
