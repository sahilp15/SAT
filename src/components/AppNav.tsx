"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/practice/reading-writing", label: "Reading & Writing" },
  { href: "/practice/math", label: "Math" },
  { href: "/practice/regression", label: "Regression" },
  { href: "/review/spaced-repetition", label: "Review" },
  { href: "/analytics", label: "Analytics" },
  { href: "/practice-tests", label: "Tests" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();
  // Hide chrome on the landing + onboarding pages for a cleaner first run.
  if (pathname === "/" || pathname === "/onboarding") return null;

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur"
      style={{ background: "color-mix(in srgb, var(--surface) 88%, transparent)", borderColor: "var(--border)" }}
    >
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="mr-2 flex shrink-0 items-center gap-2 font-bold" style={{ color: "var(--ink)" }}>
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black text-white"
            style={{ background: "var(--accent)" }}
          >
            S
          </span>
          <span className="hidden sm:inline">SAT&nbsp;Prep</span>
        </Link>
        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                style={
                  active
                    ? { background: "var(--accent-weak)", color: "var(--accent)" }
                    : { color: "var(--ink-soft)" }
                }
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
