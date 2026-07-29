"use client";

import { useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconCheck, IconSpinner } from "@/components/ui/icons";
import { Badge, cx } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import type { PlanDayView } from "@/lib/planning";

const KIND_TONE: Record<string, "accent" | "gold" | "good" | "neutral" | "warn"> = {
  SKILL: "accent",
  MIXED: "accent",
  TIMED: "warn",
  FULL_TEST: "gold",
  ERROR_REVIEW: "neutral",
  LIGHT: "neutral",
  REST: "neutral",
  FINAL_WEEK: "gold",
  TEST_DAY: "gold",
};

export function PlanDayRow({
  day,
  isToday,
  isPast,
}: {
  day: PlanDayView;
  isToday: boolean;
  isPast: boolean;
}) {
  const toast = useToast();
  const [completed, setCompleted] = useState(day.completed);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !completed;
    setCompleted(next);
    setBusy(true);
    try {
      const res = await fetch("/api/plan/day", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayId: day.id, completed: next }),
      });
      if (!res.ok) throw new Error();
      if (next) toast.success("Day marked complete");
    } catch {
      setCompleted(!next);
      toast.error("Couldn't update that day");
    } finally {
      setBusy(false);
    }
  }

  const isRest = day.kind === "REST";
  const date = new Date(day.date);

  return (
    <li
      className={cx(
        "rounded-lg border p-4 transition-colors",
        isToday ? "border-accent bg-accent-weak" : "border-line bg-surface",
        isPast && !completed && !isRest && "opacity-70",
        completed && "opacity-75"
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="w-14 shrink-0 text-center">
          <p className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
            {date.toLocaleDateString("en-US", { weekday: "short" })}
          </p>
          <p
            className={cx(
              "font-mono text-xl font-semibold leading-none",
              isToday ? "text-accent" : "text-ink"
            )}
          >
            {date.getDate()}
          </p>
          <p className="font-mono text-[0.625rem] text-ink-3">
            {date.toLocaleDateString("en-US", { month: "short" })}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[0.875rem] font-semibold text-ink">{day.title}</h3>
            <Badge tone={KIND_TONE[day.kind] ?? "neutral"}>
              {day.kind.replace(/_/g, " ").toLowerCase()}
            </Badge>
            {isToday ? <Badge tone="accent">Today</Badge> : null}
            {completed ? <Badge tone="good">Done</Badge> : null}
          </div>

          {day.items.length ? (
            <ul className="mt-2.5 space-y-1.5">
              {day.items.map((item, i) => (
                <li key={`${item.label}-${i}`}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="group flex items-start gap-2 text-[0.8125rem] text-ink-2 transition-colors hover:text-accent"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-3 transition-colors group-hover:bg-accent" />
                      <span className="min-w-0">
                        {item.label}
                        <span className="ml-1.5 font-mono text-[0.6875rem] text-ink-3">
                          {item.minutes}m{item.questions ? ` · ${item.questions}q` : ""}
                        </span>
                      </span>
                      <IconArrowRight
                        size={12}
                        className="mt-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </Link>
                  ) : (
                    <span className="flex items-start gap-2 text-[0.8125rem] text-ink-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                      <span className="min-w-0">
                        {item.label}
                        {item.detail ? (
                          <span className="mt-0.5 block text-[0.75rem] text-ink-3">
                            {item.detail}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-[0.8125rem] text-ink-3">
              Rest day — recovery is part of the plan.
            </p>
          )}
        </div>

        {!isRest ? (
          <button
            type="button"
            onClick={toggle}
            disabled={busy}
            aria-pressed={completed}
            className={cx(
              "btn btn-sm shrink-0",
              completed ? "border-good bg-good-weak text-good" : "btn-secondary"
            )}
          >
            {busy ? <IconSpinner size={13} /> : <IconCheck size={13} />}
            <span className="hidden sm:inline">{completed ? "Done" : "Mark done"}</span>
          </button>
        ) : null}
      </div>
    </li>
  );
}
