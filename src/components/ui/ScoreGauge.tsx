import { cx } from "./primitives";

// The signature element of the app: a single instrument that shows where the
// score estimate sits, how uncertain it is, and how far the target still is.
// Pure SVG with no client state, so it renders on the server and cannot cause a
// hydration mismatch.

function polar(cx0: number, cy0: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx0 + r * Math.cos(rad), y: cy0 + r * Math.sin(rad) };
}

/** Arc path across the top half-circle, angles measured 180deg -> 360deg. */
function arcPath(cx0: number, cy0: number, r: number, fromDeg: number, toDeg: number) {
  const start = polar(cx0, cy0, r, fromDeg);
  const end = polar(cx0, cy0, r, toDeg);
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

export function ScoreGauge({
  score,
  low,
  high,
  target,
  min = 400,
  max = 1600,
  size = 260,
  label = "Predicted total",
  caption,
  className,
}: {
  score: number;
  low?: number;
  high?: number;
  target?: number | null;
  min?: number;
  max?: number;
  size?: number;
  label?: string;
  caption?: React.ReactNode;
  className?: string;
}) {
  const thickness = Math.max(10, Math.round(size * 0.055));
  const r = (size - thickness) / 2 - 2;
  const cx0 = size / 2;
  const cy0 = size / 2;
  const height = Math.round(size / 2 + thickness / 2 + 4);

  const toAngle = (v: number) => 180 + 180 * ((clamp(v, min, max) - min) / (max - min));

  const scoreAngle = toAngle(score);
  const bandFrom = low != null ? toAngle(low) : scoreAngle;
  const bandTo = high != null ? toAngle(high) : scoreAngle;
  const dot = polar(cx0, cy0, r, scoreAngle);

  const targetAngle = target != null ? toAngle(target) : null;
  const targetOuter = targetAngle != null ? polar(cx0, cy0, r + thickness / 2 + 3, targetAngle) : null;
  const targetInner = targetAngle != null ? polar(cx0, cy0, r - thickness / 2 - 3, targetAngle) : null;

  return (
    <figure className={cx("m-0 flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height }}>
        <svg
          width={size}
          height={height}
          viewBox={`0 0 ${size} ${height}`}
          role="img"
          aria-label={`${label}: ${score}${low != null && high != null ? `, estimated range ${low} to ${high}` : ""}${
            target != null ? `, target ${target}` : ""
          }`}
        >
          {/* Track */}
          <path
            d={arcPath(cx0, cy0, r, 180, 360)}
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth={thickness}
            strokeLinecap="round"
          />
          {/* Confidence band */}
          {low != null && high != null && bandTo > bandFrom ? (
            <path
              d={arcPath(cx0, cy0, r, bandFrom, bandTo)}
              fill="none"
              stroke="var(--accent-weak)"
              strokeWidth={thickness}
              strokeLinecap="round"
            />
          ) : null}
          {/* Filled progress up to the estimate */}
          <path
            d={arcPath(cx0, cy0, r, 180, scoreAngle)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={thickness}
            strokeLinecap="round"
            opacity={0.9}
          />
          {/* Estimate marker */}
          <circle
            cx={dot.x}
            cy={dot.y}
            r={thickness / 2 + 2}
            fill="var(--surface)"
            stroke="var(--accent)"
            strokeWidth={3}
          />
          {/* Target tick */}
          {targetOuter && targetInner ? (
            <line
              x1={targetInner.x}
              y1={targetInner.y}
              x2={targetOuter.x}
              y2={targetOuter.y}
              stroke="var(--gold)"
              strokeWidth={3}
              strokeLinecap="round"
            />
          ) : null}
        </svg>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center">
          <div
            className="font-mono font-semibold leading-none tracking-tight text-ink"
            style={{ fontSize: size * 0.19, fontVariantNumeric: "tabular-nums" }}
          >
            {score}
          </div>
          <div className="eyebrow mt-2">{label}</div>
        </div>
      </div>

      <div className="mt-1 flex w-full items-center justify-between px-1 font-mono text-[0.6875rem] text-ink-3">
        <span>{min}</span>
        <span>{max}</span>
      </div>

      {caption ? (
        <figcaption className="mt-3 text-center text-[0.8125rem] leading-relaxed text-ink-3">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/**
 * Compact horizontal score range — used for section scores where a full gauge
 * would be too heavy.
 */
export function ScoreRange({
  label,
  score,
  low,
  high,
  target,
  min = 200,
  max = 800,
}: {
  label: string;
  score: number;
  low: number;
  high: number;
  target?: number | null;
  min?: number;
  max?: number;
}) {
  const pct = (v: number) => ((clamp(v, min, max) - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.8125rem] font-medium text-ink-2">{label}</span>
        <span className="font-mono text-lg font-semibold leading-none text-ink">{score}</span>
      </div>
      <div className="relative mt-2.5 h-1.5 w-full rounded-full bg-surface-3">
        <div
          className="absolute inset-y-0 rounded-full bg-accent-weak"
          style={{ left: `${pct(low)}%`, width: `${Math.max(1, pct(high) - pct(low))}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-surface"
          style={{ left: `${pct(score)}%` }}
        />
        {target != null ? (
          <div
            className="absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 rounded-full bg-gold"
            style={{ left: `${pct(target)}%` }}
            aria-hidden="true"
          />
        ) : null}
      </div>
      <div className="mt-1.5 font-mono text-[0.6875rem] text-ink-3">
        Range {low}–{high}
        {target != null ? ` · target ${target}` : ""}
      </div>
    </div>
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
