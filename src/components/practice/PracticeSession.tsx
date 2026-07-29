"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PracticeRunner, type ClientQuestion } from "./PracticeRunner";
import { EmptyState } from "@/components/ui/primitives";
import { IconAlert } from "@/components/ui/icons";

// Loads a fixed practice set (what a recommendation's "Start" button opens) and
// hands it to the runner. Fetching happens client-side so the loading state is
// visible and a failure degrades to a clear message rather than a broken page.

export function PracticeSession({
  section,
  skill,
  difficulty,
  count,
  title,
}: {
  section?: string;
  skill?: string;
  difficulty?: string;
  count: number;
  title: string;
}) {
  const [questions, setQuestions] = useState<ClientQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const params = new URLSearchParams({ count: String(count) });
        if (section) params.set("section", section);
        if (skill) params.set("skill", skill);
        if (difficulty) params.set("difficulty", difficulty);
        const res = await fetch(`/api/practice/set?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("load failed");
        const data = (await res.json()) as { questions: ClientQuestion[] };
        setQuestions(data.questions);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError("We couldn't build this practice set.");
      }
    })();
    return () => controller.abort();
  }, [section, skill, difficulty, count]);

  if (error) {
    return (
      <EmptyState
        icon={<IconAlert size={18} />}
        title={error}
        body="The question bank may not be loaded. Run npm run db:seed and try again."
        action={
          <Link href="/practice" className="btn btn-secondary">
            Back to practice
          </Link>
        }
      />
    );
  }

  if (!questions) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="skeleton h-10 w-full rounded-md" />
        <div className="card space-y-3 p-6">
          <div className="skeleton h-3.5 w-full" />
          <div className="skeleton h-3.5 w-10/12" />
          <div className="pt-3" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <EmptyState
        title="No questions matched this set"
        body="There aren't any unseen questions left for this skill and difficulty. Try widening the difficulty, or practice a related skill."
        action={
          <Link href="/practice" className="btn btn-secondary">
            Choose another set
          </Link>
        }
      />
    );
  }

  return (
    <PracticeRunner
      config={{
        section: section === "MATH" || section === "READING_WRITING" ? section : undefined,
        skill,
        difficulty,
        mode: "practice",
      }}
      questions={questions}
      title={title}
    />
  );
}
