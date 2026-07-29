"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "@/components/ui/icons";

type Theme = "light" | "dark";

/**
 * Stamps data-theme on <html>, which overrides the prefers-color-scheme default
 * in both directions. The initial value is applied by an inline script in the
 * root layout, so this only needs to reflect and update it.
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("sat-theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }
    setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("sat-theme", next);
    } catch {
      /* private mode — the choice just won't persist */
    }
  }

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-ghost btn-icon text-ink-3 hover:text-ink"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
    >
      {/* Render nothing until mounted so the markup matches the server output. */}
      {theme === null ? (
        <span className="block h-[17px] w-[17px]" />
      ) : isDark ? (
        <IconSun size={17} />
      ) : (
        <IconMoon size={17} />
      )}
      {compact ? null : <span className="sr-only">Toggle theme</span>}
    </button>
  );
}
