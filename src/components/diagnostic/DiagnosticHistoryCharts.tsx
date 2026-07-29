"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Progress charts for the diagnostics hub.
//
// The band around the line is the point of these charts: a single estimate from
// 20 questions carries a wide confidence range, and a rise that stays inside the
// previous range is not yet evidence of improvement. Plotting the range makes
// that visible instead of leaving it in a footnote.

const AXIS = { fontSize: 11, stroke: "var(--ink-3)" };

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: "0.625rem",
  fontSize: "0.8125rem",
  color: "var(--ink)",
  boxShadow: "var(--shadow-pop)",
};

export interface HistoryPoint {
  /** Short x-axis label, e.g. "#3". */
  label: string;
  /** Human date for the tooltip. */
  date: string;
  formId: number;
  total: number;
  low: number;
  high: number;
  math: number;
  rw: number;
}

function TotalTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: HistoryPoint }[];
}) {
  const point = active ? payload?.[0]?.payload : null;
  if (!point) return null;
  return (
    <div style={tooltipStyle} className="px-3 py-2">
      <p className="font-semibold text-ink">
        {point.total} <span className="font-normal text-ink-3">predicted</span>
      </p>
      <p className="mt-0.5 font-mono text-[0.75rem] text-ink-3">
        range {point.low}–{point.high}
      </p>
      <p className="mt-1 text-[0.75rem] text-ink-3">
        Diagnostic {point.formId} · {point.date}
      </p>
    </div>
  );
}

/** Predicted total over time, with the confidence band drawn around it. */
export function ScoreHistoryChart({
  data,
  target,
}: {
  data: HistoryPoint[];
  target?: number | null;
}) {
  if (data.length < 2) {
    return (
      <p className="py-10 text-center text-[0.8125rem] text-ink-3">
        Take a second diagnostic and your score trend appears here.
      </p>
    );
  }

  // A range area: each point carries [low, high] rather than a single value, so
  // the band is drawn between the bounds instead of up from a zero baseline.
  const rows = data.map((d) => ({ ...d, band: [d.low, d.high] as [number, number] }));
  const lows = rows.map((r) => r.low);
  const highs = rows.map((r) => r.high);
  const floor = Math.max(400, Math.floor((Math.min(...lows) - 40) / 50) * 50);
  const ceiling = Math.min(
    1600,
    Math.ceil((Math.max(...highs, target ?? 0) + 40) / 50) * 50
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={rows} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="label" {...AXIS} tickLine={false} />
        <YAxis domain={[floor, ceiling]} {...AXIS} tickLine={false} axisLine={false} />
        <Tooltip content={<TotalTooltip />} cursor={{ stroke: "var(--line-strong)" }} />
        {target != null ? (
          <ReferenceLine
            y={target}
            stroke="var(--gold)"
            strokeDasharray="4 4"
            label={{
              value: `target ${target}`,
              position: "insideTopRight",
              fill: "var(--gold)",
              fontSize: 11,
            }}
          />
        ) : null}
        <Area
          dataKey="band"
          stroke="none"
          fill="var(--accent)"
          fillOpacity={0.14}
          isAnimationActive={false}
          activeDot={false}
        />
        <Line
          dataKey="total"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={{ r: 3.5, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Section estimates over time on the 200–800 scale. */
export function SectionHistoryChart({ data }: { data: HistoryPoint[] }) {
  if (data.length < 2) return null;
  const values = data.flatMap((d) => [d.math, d.rw]);
  const floor = Math.max(200, Math.floor((Math.min(...values) - 40) / 50) * 50);
  const ceiling = Math.min(800, Math.ceil((Math.max(...values) + 40) / 50) * 50);

  return (
    <ResponsiveContainer width="100%" height={190}>
      <LineChart data={data} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="label" {...AXIS} tickLine={false} />
        <YAxis domain={[floor, ceiling]} {...AXIS} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ stroke: "var(--line-strong)" }}
          labelFormatter={(_l, payload) => {
            const p = payload?.[0]?.payload as HistoryPoint | undefined;
            return p ? `Diagnostic ${p.formId} · ${p.date}` : "";
          }}
        />
        <Line
          name="Math"
          dataKey="math"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={{ r: 3 }}
          isAnimationActive={false}
        />
        <Line
          name="Reading & Writing"
          dataKey="rw"
          stroke="var(--gold)"
          strokeWidth={2}
          dot={{ r: 3 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
