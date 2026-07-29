"use client";

import { useEffect, useState } from "react";
import { IconSparkle } from "@/components/ui/icons";

interface Coaching {
  greeting: string;
  focus: string;
  encouragement: string;
  watchOut: string;
}

/**
 * The optional AI coaching note. Fetched after the dashboard has already
 * rendered, so a slow, rate-limited, or missing AI service never delays the page
 * or leaves an empty hole in the layout — the card simply doesn't appear.
 */
export function CoachingNote() {
  const [data, setData] = useState<Coaching | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/ai/coaching", { signal: controller.signal });
        const json = (await res.json()) as { available?: boolean } & Partial<Coaching>;
        if (json.available && json.greeting && json.focus && json.encouragement && json.watchOut) {
          setData({
            greeting: json.greeting,
            focus: json.focus,
            encouragement: json.encouragement,
            watchOut: json.watchOut,
          });
        }
      } catch {
        // Aborted or offline: the card stays hidden.
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="card p-5" aria-busy="true">
        <div className="skeleton h-3 w-24" />
        <div className="mt-3 space-y-2">
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-4/5" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="card animate-fade-in p-5">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-accent">
          <IconSparkle size={15} />
        </span>
        <span className="eyebrow">Today&apos;s coaching</span>
      </div>
      <p className="text-[0.875rem] font-semibold text-ink">{data.greeting}</p>
      <dl className="mt-3 space-y-2.5 text-[0.8125rem] leading-relaxed">
        <div>
          <dt className="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3">
            Focus
          </dt>
          <dd className="text-ink-2">{data.focus}</dd>
        </div>
        <div>
          <dt className="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-3">
            Watch out for
          </dt>
          <dd className="text-ink-2">{data.watchOut}</dd>
        </div>
      </dl>
      <p className="mt-3 border-t border-line pt-3 text-[0.8125rem] italic leading-relaxed text-ink-3">
        {data.encouragement}
      </p>
    </div>
  );
}
