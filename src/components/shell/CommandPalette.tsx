"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { IconArrowRight, IconSearch } from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";
import { NAV } from "./nav";

export interface CommandAction {
  id: string;
  label: string;
  hint?: string;
  group: string;
  href: string;
  keywords?: string[];
}

/** Fuzzy-ish scoring: exact prefix beats word start beats substring. */
function score(action: CommandAction, query: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const label = action.label.toLowerCase();
  if (label.startsWith(q)) return 100;
  if (label.includes(q)) return 60;
  if (action.hint?.toLowerCase().includes(q)) return 40;
  if (action.keywords?.some((k) => k.toLowerCase().includes(q))) return 30;
  // Loose subsequence match so "spr" finds "Spaced Repetition".
  let i = 0;
  for (const ch of label) {
    if (ch === q[i]) i += 1;
    if (i === q.length) return 10;
  }
  return 0;
}

export function CommandPalette({ extraActions = [] }: { extraActions?: CommandAction[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [mounted, setMounted] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => setMounted(true), []);

  const actions = useMemo<CommandAction[]>(() => {
    const navActions = NAV.map<CommandAction>((n) => ({
      id: `nav:${n.href}`,
      label: n.label,
      group: n.group,
      href: n.href,
      keywords: n.keywords,
    }));
    return [...navActions, ...extraActions];
  }, [extraActions]);

  const results = useMemo(() => {
    return actions
      .map((a) => ({ a, s: score(a, query) }))
      .filter((r) => r.s > 0)
      .sort((x, y) => y.s - x.s)
      .slice(0, 12)
      .map((r) => r.a);
  }, [actions, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setCursor(0);
  }, []);

  const run = useCallback(
    (action: CommandAction) => {
      close();
      router.push(action.href);
    },
    [close, router]
  );

  // Global shortcut. Ignored while typing in a field so it never steals input.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  useEffect(() => setCursor(0), [query]);

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (results.length ? (c + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (results.length ? (c - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[cursor];
      if (target) run(target);
    }
  }

  let lastGroup = "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-8 items-center gap-2 rounded-md border border-line-strong bg-surface px-2.5 text-[0.8125rem] text-ink-3 transition-colors hover:border-ink-3 hover:text-ink"
        aria-label="Open command palette"
      >
        <IconSearch size={14} />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="ml-1 hidden rounded border border-line px-1 font-mono text-[0.625rem] text-ink-3 sm:inline">
          ⌘K
        </kbd>
      </button>

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]">
              <div
                className="absolute inset-0 bg-[rgb(10_12_16/0.5)] animate-fade-in"
                onClick={close}
                aria-hidden="true"
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                className="relative w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-scale-in"
              >
                <div className="flex items-center gap-2.5 border-b border-line px-3.5">
                  <IconSearch size={16} className="shrink-0 text-ink-3" />
                  {/* eslint-disable-next-line jsx-a11y/no-autofocus -- the palette exists to receive typing immediately */}
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onInputKey}
                    placeholder="Jump to a page or action…"
                    aria-label="Search commands"
                    aria-controls="command-results"
                    className="w-full bg-transparent py-3 text-sm text-ink outline-none placeholder:text-ink-3"
                  />
                  <kbd className="shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[0.625rem] text-ink-3">
                    esc
                  </kbd>
                </div>

                <ul
                  id="command-results"
                  ref={listRef}
                  role="listbox"
                  className="max-h-[min(24rem,55vh)] overflow-y-auto p-1.5"
                >
                  {results.length === 0 ? (
                    <li className="px-3 py-8 text-center text-[0.8125rem] text-ink-3">
                      No matches for “{query}”.
                    </li>
                  ) : (
                    results.map((action, i) => {
                      const showGroup = action.group !== lastGroup;
                      lastGroup = action.group;
                      return (
                        <li key={action.id}>
                          {showGroup ? (
                            <div className="eyebrow px-2.5 pb-1 pt-3 first:pt-1">{action.group}</div>
                          ) : null}
                          <button
                            type="button"
                            role="option"
                            aria-selected={i === cursor}
                            onMouseMove={() => setCursor(i)}
                            onClick={() => run(action)}
                            className={cx(
                              "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors",
                              i === cursor ? "bg-accent-weak text-accent" : "text-ink-2"
                            )}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[0.8125rem] font-medium">
                                {action.label}
                              </span>
                              {action.hint ? (
                                <span className="block truncate text-[0.75rem] text-ink-3">
                                  {action.hint}
                                </span>
                              ) : null}
                            </span>
                            <IconArrowRight size={14} className="shrink-0 opacity-60" />
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
