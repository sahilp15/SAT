import { OnboardingForm } from "@/components/OnboardingForm";
import { getUpcomingSatDates } from "@/lib/satDates";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  const dates = getUpcomingSatDates();
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Let&apos;s personalize your prep</h1>
        <p className="mt-1 text-slate-500">
          A few questions so your dashboard, study plan, and practice can be tailored to you. You can
          change all of this later in Settings.
        </p>
      </div>
      <OnboardingForm dates={dates} />
    </div>
  );
}
