import Link from "next/link";
import React from "react";
import { IconArrowRight, IconSpinner } from "./icons";

// Presentational primitives shared by every page. All colors come from design
// tokens, so a component written once works in light and dark with no branching.

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Card({
  children,
  className,
  as: Tag = "div",
  padded = true,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  padded?: boolean;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cx("card", padded && "p-5", className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  eyebrow,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow ? <div className="eyebrow mb-1.5">{eyebrow}</div> : null}
        <h2 className="text-[0.9375rem] font-semibold leading-snug text-ink">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-prose text-[0.8125rem] leading-relaxed text-ink-3">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <div className="eyebrow mb-2">{eyebrow}</div> : null}
        <h1 className="text-2xl leading-tight text-ink sm:text-[1.75rem]">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-3">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

// ---------------------------------------------------------------------------
// Buttons & links
// ---------------------------------------------------------------------------

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};
const SIZE_CLASS: Record<ButtonSize, string> = { sm: "btn-sm", md: "", lg: "btn-lg" };

export function buttonClass(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  className?: string
): string {
  return cx("btn", VARIANT_CLASS[variant], SIZE_CLASS[size], className);
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <IconSpinner /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "secondary",
  size = "md",
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

/** Inline "go here" link with a trailing arrow. */
export function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-accent transition-colors hover:text-accent-hover"
    >
      {children}
      <IconArrowRight
        size={14}
        className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
      />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export type Tone = "neutral" | "accent" | "good" | "bad" | "warn" | "gold";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-2",
  accent: "bg-accent-weak text-accent",
  good: "bg-good-weak text-good",
  bad: "bg-bad-weak text-bad",
  warn: "bg-warn-weak text-warn",
  gold: "bg-gold-weak text-gold",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return <span className={cx("chip", TONE_CLASS[tone], className)}>{children}</span>;
}

const DIFFICULTY_TONE: Record<string, Tone> = {
  EASY: "good",
  MEDIUM: "warn",
  HARD: "bad",
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const tone = DIFFICULTY_TONE[difficulty] ?? "neutral";
  const label = difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
  return <Badge tone={tone}>{label}</Badge>;
}

export function SectionBadge({ section }: { section: string }) {
  return (
    <Badge tone={section === "MATH" ? "accent" : "neutral"}>
      {section === "MATH" ? "Math" : "Reading & Writing"}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Data display
// ---------------------------------------------------------------------------

export function Stat({
  label,
  value,
  sub,
  tone,
  icon,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: Tone;
  icon?: React.ReactNode;
  className?: string;
}) {
  const valueColor =
    tone === "good"
      ? "text-good"
      : tone === "bad"
        ? "text-bad"
        : tone === "accent"
          ? "text-accent"
          : tone === "gold"
            ? "text-gold"
            : "text-ink";
  return (
    <div className={cx("card p-4", className)}>
      <div className="flex items-center gap-1.5 text-[0.75rem] font-medium text-ink-3">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cx(
          "mt-1.5 font-mono text-[1.625rem] font-semibold leading-none tracking-tight",
          valueColor
        )}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </div>
      {sub ? <div className="mt-1.5 text-[0.75rem] leading-snug text-ink-3">{sub}</div> : null}
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  tone = "accent",
  size = "md",
  label,
}: {
  value: number;
  max?: number;
  tone?: Tone;
  size?: "sm" | "md";
  label?: string;
}) {
  const pct = max === 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  const fill =
    tone === "good"
      ? "var(--good)"
      : tone === "bad"
        ? "var(--bad)"
        : tone === "warn"
          ? "var(--warn)"
          : tone === "gold"
            ? "var(--gold)"
            : "var(--accent)";
  return (
    <div
      className={cx("w-full overflow-hidden rounded-full bg-surface-3", size === "sm" ? "h-1" : "h-1.5")}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%`, background: fill }}
      />
    </div>
  );
}

/** Circular progress indicator. `size` is the outer diameter in px. */
export function ProgressRing({
  value,
  max = 100,
  size = 64,
  thickness = 6,
  tone = "accent",
  children,
  label,
}: {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  tone?: Tone;
  children?: React.ReactNode;
  label?: string;
}) {
  const pct = max === 0 ? 0 : Math.max(0, Math.min(1, value / max));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const stroke =
    tone === "good"
      ? "var(--good)"
      : tone === "bad"
        ? "var(--bad)"
        : tone === "warn"
          ? "var(--warn)"
          : tone === "gold"
            ? "var(--gold)"
            : "var(--accent)";
  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${Math.round(pct * 100)} percent`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      {children ? (
        <span className="absolute inset-0 flex flex-col items-center justify-center">{children}</span>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong px-6 py-12 text-center",
        className
      )}
    >
      {icon ? (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink-3">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {body ? <p className="mt-1.5 max-w-sm text-[0.8125rem] leading-relaxed text-ink-3">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} aria-hidden="true" />;
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-5" aria-busy="true">
      <Skeleton className="h-3.5 w-28" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cx("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

export function InlineAlert({
  tone = "warn",
  title,
  children,
  action,
}: {
  tone?: Tone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const border =
    tone === "bad"
      ? "border-bad"
      : tone === "good"
        ? "border-good"
        : tone === "accent"
          ? "border-accent"
          : "border-warn";
  const bg =
    tone === "bad"
      ? "bg-bad-weak"
      : tone === "good"
        ? "bg-good-weak"
        : tone === "accent"
          ? "bg-accent-weak"
          : "bg-warn-weak";
  return (
    <div
      className={cx("flex flex-wrap items-start gap-3 rounded-md border p-3.5", border, bg)}
      role={tone === "bad" ? "alert" : "status"}
    >
      <div className="min-w-0 flex-1">
        {title ? <p className="text-[0.8125rem] font-semibold text-ink">{title}</p> : null}
        {children ? (
          <div className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-2">{children}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Key/value row used across analytics and review surfaces. */
export function MetricRow({
  label,
  value,
  hint,
  progress,
  tone,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  progress?: number;
  tone?: Tone;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[0.8125rem] text-ink-2">{label}</span>
        <span className="shrink-0 font-mono text-[0.8125rem] font-semibold text-ink">{value}</span>
      </div>
      {progress !== undefined ? (
        <div className="mt-1.5">
          <ProgressBar value={progress} tone={tone} size="sm" />
        </div>
      ) : null}
      {hint ? <p className="mt-1 text-[0.75rem] text-ink-3">{hint}</p> : null}
    </div>
  );
}
