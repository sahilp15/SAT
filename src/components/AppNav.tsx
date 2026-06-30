"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/practice/reading-writing", label: "Reading & Writing" },
  { href: "/practice/math", label: "Math" },
  { href: "/review/spaced-repetition", label: "Review" },
  { href: "/analytics", label: "Analytics" },
  { href: "/practice-tests", label: "Tests" },
  { href: "/admin/import", label: "Import" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();
  // Hide chrome on the landing + onboarding pages for a cleaner first run.
  if (pathname === "/" || pathname === "/onboarding") return null;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="mr-3 shrink-0 font-bold text-brand-700">
          SAT&nbsp;Prep
        </Link>
        <div className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
