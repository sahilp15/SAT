"use client";

import { useId, useRef, useState } from "react";
import { cx } from "./primitives";

// Accessible tab list with an indicator that slides between tabs. Follows the
// ARIA tabs pattern: arrow keys move focus and selection, Home/End jump to the
// ends, and only the active tab is in the tab order.

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
  size = "md",
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = Math.max(
    0,
    items.findIndex((i) => i.value === value)
  );

  function onKeyDown(e: React.KeyboardEvent) {
    const last = items.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = activeIndex === last ? 0 : activeIndex + 1;
    else if (e.key === "ArrowLeft") next = activeIndex === 0 ? last : activeIndex - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    onChange(items[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Sections"
      onKeyDown={onKeyDown}
      className={cx(
        "relative inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-md border border-line bg-surface-2 p-1",
        className
      )}
    >
      {items.map((item, i) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${id}-tab-${item.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cx(
              "relative shrink-0 whitespace-nowrap rounded-[0.4375rem] font-medium transition-colors duration-200 ease-out",
              size === "sm" ? "px-2.5 py-1 text-[0.8125rem]" : "px-3.5 py-1.5 text-sm",
              active
                ? "bg-surface text-ink shadow-xs"
                : "text-ink-3 hover:text-ink"
            )}
          >
            {item.label}
            {item.count !== undefined ? (
              <span
                className={cx(
                  "ml-1.5 font-mono text-[0.6875rem]",
                  active ? "text-ink-3" : "text-ink-3"
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Simple controlled panel that pairs with <Tabs>. */
export function TabPanel({
  when,
  value,
  children,
}: {
  when: string;
  value: string;
  children: React.ReactNode;
}) {
  if (when !== value) return null;
  return (
    <div role="tabpanel" className="animate-fade-in">
      {children}
    </div>
  );
}

/** Uncontrolled convenience wrapper. */
export function useTabs(initial: string) {
  const [value, setValue] = useState(initial);
  return { value, setValue } as const;
}
