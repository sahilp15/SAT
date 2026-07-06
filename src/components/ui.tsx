import React from "react";

// Small presentational primitives shared across pages. Colors flow through the
// design tokens so everything works in both light and dark themes.

export function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="text-sm font-medium" style={{ color: "var(--ink-faint)" }}>
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums" style={{ color: "var(--ink)" }}>
        {value}
      </div>
      {sub ? (
        <div className="mt-1 text-xs" style={{ color: "var(--ink-faint)" }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, max === 0 ? 0 : (value / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--accent)" }} />
    </div>
  );
}

const DIFF_STYLES: Record<string, { bg: string; fg: string }> = {
  EASY: { bg: "var(--good-weak)", fg: "var(--good)" },
  MEDIUM: { bg: "color-mix(in srgb, var(--warn) 15%, var(--surface))", fg: "var(--warn)" },
  HARD: { bg: "var(--bad-weak)", fg: "var(--bad)" },
};

export function DifficultyChip({ difficulty }: { difficulty: string }) {
  const s = DIFF_STYLES[difficulty] ?? { bg: "var(--surface-2)", fg: "var(--ink-soft)" };
  return (
    <span className="chip" style={{ background: s.bg, color: s.fg }}>
      {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
    </span>
  );
}

export function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`chip ${className}`} style={{ background: "var(--surface-2)", color: "var(--ink-soft)" }}>
      {children}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center py-12 text-center">
      <div className="text-lg font-semibold" style={{ color: "var(--ink)" }}>
        {title}
      </div>
      {body ? (
        <div className="mt-2 max-w-md text-sm" style={{ color: "var(--ink-faint)" }}>
          {body}
        </div>
      ) : null}
    </div>
  );
}
