"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  IconAlert,
  IconBook,
  IconCalendar,
  IconChart,
  IconChevronLeft,
  IconClose,
  IconFlame,
  IconGauge,
  IconLayers,
  IconMenu,
  IconSettings,
  IconSparkle,
  IconTarget,
  IconUser,
} from "@/components/ui/icons";
import { cx } from "@/components/ui/primitives";
import { CommandPalette } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";
import { NAV, PRIMARY_NAV, activeHref, isBareRoute, type NavIconName } from "./nav";

const ICONS: Record<NavIconName, (p: { size?: number }) => JSX.Element> = {
  gauge: IconGauge,
  target: IconTarget,
  book: IconBook,
  alert: IconAlert,
  calendar: IconCalendar,
  chart: IconChart,
  sparkle: IconSparkle,
  layers: IconLayers,
  settings: IconSettings,
  user: IconUser,
};

export interface ShellStatus {
  daysRemaining: number | null;
  testLabel: string | null;
  streakDays: number;
  dueCount: number;
  predictedTotal: number | null;
  targetScore: number | null;
}

export function AppShell({
  children,
  status,
}: {
  children: React.ReactNode;
  status: ShellStatus;
}) {
  const pathname = usePathname();
  const [railed, setRailed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Reflect the pre-paint rail state that the inline script applied.
  useEffect(() => {
    setRailed(document.documentElement.getAttribute("data-rail") === "1");
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const toggleRail = useCallback(() => {
    setRailed((prev) => {
      const next = !prev;
      document.documentElement.setAttribute("data-rail", next ? "1" : "0");
      try {
        localStorage.setItem("sat-rail", next ? "1" : "0");
      } catch {
        /* persistence is a nicety, not a requirement */
      }
      return next;
    });
  }, []);

  if (isBareRoute(pathname)) return <>{children}</>;

  const current = activeHref(pathname);

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-pop"
      >
        Skip to content
      </a>

      {/* --- Desktop sidebar ------------------------------------------- */}
      <aside
        className="app-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface lg:flex"
        aria-label="Main navigation"
      >
        <SidebarContent
          current={current}
          status={status}
          railed={railed}
          onToggleRail={toggleRail}
        />
      </aside>

      {/* --- Mobile drawer ---------------------------------------------- */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[rgb(10_12_16/0.5)] animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute inset-y-0 left-0 flex w-[17rem] flex-col border-r border-line bg-surface shadow-pop"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <SidebarContent
              current={current}
              status={status}
              railed={false}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {/* --- Main column ------------------------------------------------- */}
      <div className="app-main flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="btn btn-ghost btn-icon lg:hidden"
              aria-label="Open navigation menu"
            >
              <IconMenu size={18} />
            </button>

            <CountdownPill status={status} />

            <div className="ml-auto flex items-center gap-2">
              {status.streakDays > 0 ? (
                <span
                  className="hidden items-center gap-1.5 rounded-md bg-gold-weak px-2.5 py-1 text-[0.75rem] font-semibold text-gold sm:inline-flex"
                  title={`${status.streakDays}-day study streak`}
                >
                  <IconFlame size={13} />
                  {status.streakDays}
                </span>
              ) : null}
              <CommandPalette />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-[86rem] flex-1 px-4 pb-24 pt-6 sm:px-6 lg:pb-10 lg:pt-8"
        >
          {children}
        </main>

        <Footer />
      </div>

      <MobileTabBar current={current} />
    </div>
  );
}

function SidebarContent({
  current,
  status,
  railed,
  onToggleRail,
  onClose,
}: {
  current: string | null;
  status: ShellStatus;
  railed: boolean;
  onToggleRail?: () => void;
  onClose?: () => void;
}) {
  const groups = ["Study", "Review", "Account"] as const;

  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line px-3">
        <Link
          href="/dashboard"
          className="rail-center flex min-w-0 items-center gap-2.5 rounded-md px-1 py-1"
        >
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent font-display text-[0.9375rem] font-semibold text-accent-contrast"
          >
            S
          </span>
          <span className="rail-hide min-w-0">
            <span className="block truncate font-display text-[0.9375rem] font-semibold leading-tight text-ink">
              SAT Studio
            </span>
            <span className="block truncate font-mono text-[0.625rem] uppercase tracking-wider text-ink-3">
              Personal prep
            </span>
          </span>
        </Link>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon ml-auto"
            aria-label="Close navigation menu"
          >
            <IconClose size={18} />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {groups.map((group) => {
          const entries = NAV.filter((n) => n.group === group);
          if (!entries.length) return null;
          return (
            <div key={group} className="mb-4 last:mb-0">
              <div className="eyebrow rail-hide mb-1.5 px-2">{group}</div>
              <ul className="space-y-0.5">
                {entries.map((entry) => {
                  const Icon = ICONS[entry.icon];
                  const active = current === entry.href;
                  const badge =
                    entry.href === "/review/spaced-repetition" && status.dueCount > 0
                      ? status.dueCount
                      : null;
                  return (
                    <li key={entry.href}>
                      <Link
                        href={entry.href}
                        aria-current={active ? "page" : undefined}
                        className="nav-item rail-center"
                        title={railed ? entry.label : undefined}
                      >
                        <Icon size={17} />
                        <span className="rail-hide min-w-0 flex-1 truncate">{entry.label}</span>
                        {badge ? (
                          <span className="rail-hide shrink-0 rounded-full bg-accent px-1.5 font-mono text-[0.625rem] font-semibold text-accent-contrast">
                            {badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-line p-2.5">
        <div className="rail-hide mb-2 rounded-md bg-surface-2 p-3">
          <div className="eyebrow">Goal</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-semibold leading-none text-ink">
              {status.predictedTotal ?? "—"}
            </span>
            <span className="text-[0.75rem] text-ink-3">
              → {status.targetScore ?? "set a target"}
            </span>
          </div>
          <p className="mt-1.5 text-[0.6875rem] leading-snug text-ink-3">
            {status.predictedTotal
              ? "Current estimate vs. target"
              : "Take the score predictor for a baseline"}
          </p>
        </div>
        {onToggleRail ? (
          <button
            type="button"
            onClick={onToggleRail}
            className="nav-item rail-center w-full"
            aria-label={railed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <IconChevronLeft
              size={16}
              className={cx("transition-transform duration-200", railed && "rotate-180")}
            />
            <span className="rail-hide">Collapse</span>
          </button>
        ) : null}
      </div>
    </>
  );
}

function CountdownPill({ status }: { status: ShellStatus }) {
  if (status.daysRemaining == null) {
    return (
      <Link href="/profile" className="text-[0.8125rem] font-medium text-ink-3 hover:text-ink">
        Set your test date →
      </Link>
    );
  }
  const urgent = status.daysRemaining <= 14;
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={cx(
          "font-mono text-[0.9375rem] font-semibold leading-none",
          urgent ? "text-bad" : "text-ink"
        )}
      >
        {Math.max(0, status.daysRemaining)}
      </span>
      <span className="min-w-0 truncate text-[0.75rem] leading-tight text-ink-3">
        {status.daysRemaining === 0 ? (
          "Test day"
        ) : (
          <>
            day{status.daysRemaining === 1 ? "" : "s"} to{" "}
            <span className="hidden sm:inline">{status.testLabel}</span>
            <span className="sm:hidden">test</span>
          </>
        )}
      </span>
    </div>
  );
}

function MobileTabBar({ current }: { current: string | null }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[color-mix(in_srgb,var(--surface)_94%,transparent)] backdrop-blur lg:hidden"
      aria-label="Primary"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {PRIMARY_NAV.map((entry) => {
          const Icon = ICONS[entry.icon];
          const active = current === entry.href;
          return (
            <li key={entry.href}>
              <Link
                href={entry.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex flex-col items-center gap-1 py-2.5 text-[0.625rem] font-medium transition-colors",
                  active ? "text-accent" : "text-ink-3"
                )}
              >
                <Icon size={19} />
                {entry.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line px-4 py-6 sm:px-6">
      <p className="mx-auto max-w-[86rem] text-[0.6875rem] leading-relaxed text-ink-3">
        <strong className="font-semibold">Disclaimer:</strong> SAT&reg; is a trademark registered by
        the College Board. Official College Board questions and materials used here are the property
        of the College Board and are used solely for personal, private study. This project is an
        independent study tool and is not affiliated with, authorized, sponsored, or endorsed by the
        College Board. Predicted scores are estimates from a short diagnostic, not official scores.
        All data stays on your machine.
      </p>
    </footer>
  );
}
