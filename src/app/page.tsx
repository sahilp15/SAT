import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocalUserWithProfile } from "@/lib/user";

export const dynamic = "force-dynamic";

const FEATURES = [
  ["Learn from every miss", "A required, AI-reviewed error log after every wrong answer — no skipping."],
  ["Spaced repetition", "Missed questions come back on a smart schedule until they stick."],
  ["Real SAT formatting", "Clean math notation with KaTeX, proper A–D choices, passages preserved."],
  ["Personalized plan", "A dynamic study plan and practice-test schedule built around your SAT date."],
];

export default async function Home() {
  const user = await getLocalUserWithProfile();
  if (user.profile?.onboardingComplete) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-3xl py-10 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">
        Study the SAT like you mean it.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
        A private, local-first SAT prep system for Reading &amp; Writing and Math — built around
        learning from your mistakes, not just answering questions.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/onboarding" className="btn-primary px-6 py-3 text-base">
          Get started
        </Link>
        <Link href="/dashboard" className="btn-secondary px-6 py-3 text-base">
          Go to dashboard
        </Link>
      </div>

      <div className="mt-12 grid gap-4 text-left sm:grid-cols-2">
        {FEATURES.map(([title, body]) => (
          <div key={title} className="card">
            <div className="font-semibold text-slate-900">{title}</div>
            <p className="mt-1 text-sm text-slate-600">{body}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-xs text-slate-400">
        Runs entirely on your machine. Your progress is stored locally and never leaves your
        computer. This tool maximizes your chances of hitting your target with consistent practice —
        it doesn&apos;t guarantee a score.
      </p>
    </div>
  );
}
