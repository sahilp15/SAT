import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocalUserWithProfile } from "@/lib/user";
import { prisma } from "@/lib/db";
import { IconArrowRight, IconTarget } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

const PILLARS = [
  {
    title: "A score you can actually act on",
    body: "A 20-question adaptive diagnostic that routes independently in Math and Reading & Writing, then reports a predicted score with an honest confidence range — and the exact skills behind it.",
  },
  {
    title: "Mistakes that don't get away",
    body: "Every miss is classified by likely cause — concept gap, misread, careless slip, timing — using your answer, your pace, and your history. Unresolved ones resurface on a spaced schedule.",
  },
  {
    title: "A plan sized to your real life",
    body: "A day-by-day schedule through test day, built from the days and minutes you actually have, weighted toward the gaps that cost the most points.",
  },
];

export default async function LandingPage() {
  const user = await getLocalUserWithProfile();
  if (user.profile?.onboardingComplete) redirect("/dashboard");

  const questionCount = await prisma.question.count();

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto grid grid-cols-1 min-h-screen max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-24">
        <div>
          <div className="mb-8 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent font-display text-base font-semibold text-accent-contrast">
              S
            </span>
            <span className="font-display text-base font-semibold text-ink">SAT Studio</span>
          </div>

          <h1 className="max-w-2xl text-[2.5rem] leading-[1.1] text-ink sm:text-[3.25rem]">
            Know exactly what to study,
            <br />
            <span className="text-accent">every single day.</span>
          </h1>

          <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-ink-2">
            A private, local-first SAT preparation system. It measures where you actually are,
            explains every mistake you make, and turns that into a schedule that runs all the way to
            test day.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/onboarding" className="btn btn-primary btn-lg">
              Set up my plan
              <IconArrowRight size={16} />
            </Link>
            <Link href="/dashboard" className="btn btn-secondary btn-lg">
              Go to dashboard
            </Link>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-8">
            <div>
              <dt className="eyebrow">Question bank</dt>
              <dd className="mt-1 font-mono text-xl font-semibold text-ink">{questionCount}</dd>
            </div>
            <div>
              <dt className="eyebrow">Diagnostic</dt>
              <dd className="mt-1 font-mono text-xl font-semibold text-ink">20 adaptive</dd>
            </div>
            <div>
              <dt className="eyebrow">Data</dt>
              <dd className="mt-1 font-mono text-xl font-semibold text-ink">100% local</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          {PILLARS.map((p, i) => (
            <section
              key={p.title}
              className="card animate-fade-up p-6"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-accent-weak font-mono text-[0.75rem] font-semibold text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="text-[1.0625rem] leading-snug text-ink">{p.title}</h2>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-3">{p.body}</p>
            </section>
          ))}

          <div className="flex items-start gap-3 rounded-lg border border-line bg-surface-2 p-4">
            <span className="mt-0.5 text-ink-3">
              <IconTarget size={16} />
            </span>
            <p className="text-[0.8125rem] leading-relaxed text-ink-3">
              Everything runs on your machine and your progress never leaves it. Predicted scores
              are estimates from a short diagnostic — this tool is built to give you the best shot
              at your target, not to guarantee a number.
            </p>
          </div>
        </div>
      </div>

      <footer className="border-t border-line px-6 py-6">
        <p className="mx-auto max-w-6xl text-[0.6875rem] leading-relaxed text-ink-3">
          SAT&reg; is a trademark registered by the College Board. Official College Board questions
          and materials used here are the property of the College Board and are used solely for
          personal, private study. This project is an independent study tool and is not affiliated
          with, authorized, sponsored, or endorsed by the College Board.
        </p>
      </footer>
    </main>
  );
}
