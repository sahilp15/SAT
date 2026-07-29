"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Two small trend charts for the dashboard. Both are deliberately sparse — the
// point is the direction of travel, not precise readings.

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: "0.625rem",
  fontSize: "0.8125rem",
  color: "var(--ink)",
  boxShadow: "var(--shadow-pop)",
};

export function AccuracyTrend({
  data,
}: {
  data: { date: string; accuracy: number; count: number }[];
}) {
  if (data.length < 2) {
    return (
      <p className="py-10 text-center text-[0.8125rem] text-ink-3">
        Practice on more than one day to see a trend.
      </p>
    );
  }
  const rows = data.map((d) => ({
    date: d.date.slice(5),
    pct: Math.round(d.accuracy * 100),
    count: d.count,
  }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={rows} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="accFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="date" fontSize={11} stroke="var(--ink-3)" tickLine={false} minTickGap={24} />
        <YAxis
          domain={[0, 100]}
          fontSize={11}
          stroke="var(--ink-3)"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number, _n, item) => {
            const p = item?.payload as { count: number } | undefined;
            return [`${value}%${p ? ` over ${p.count} questions` : ""}`, "Accuracy"];
          }}
        />
        <Area
          type="monotone"
          dataKey="pct"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#accFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: "var(--accent)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ScoreHistory({
  data,
  target,
}: {
  data: { date: string; total: number }[];
  target: number | null;
}) {
  if (data.length < 2) {
    return (
      <p className="py-10 text-center text-[0.8125rem] text-ink-3">
        Retake the score predictor later to plot progress against your target.
      </p>
    );
  }
  const rows = data.map((d) => ({ date: d.date.slice(5), total: d.total }));
  const min = Math.min(...rows.map((r) => r.total), target ?? 1600) - 60;
  const max = Math.max(...rows.map((r) => r.total), target ?? 400) + 60;
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={rows} margin={{ top: 8, right: 6, left: -14, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="date" fontSize={11} stroke="var(--ink-3)" tickLine={false} />
        <YAxis
          domain={[Math.max(400, min), Math.min(1600, max)]}
          fontSize={11}
          stroke="var(--ink-3)"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Predicted total"]} />
        <Line
          type="monotone"
          dataKey="total"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
