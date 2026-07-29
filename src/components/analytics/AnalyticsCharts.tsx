"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { mistakeLabel } from "@/lib/taxonomy";
import type { Overview } from "@/lib/analytics";

const AXIS = { fontSize: 11, stroke: "var(--ink-3)" };

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: "0.625rem",
  fontSize: "0.8125rem",
  color: "var(--ink)",
  boxShadow: "var(--shadow-pop)",
};

export function AccuracyOverTime({ data }: { data: Overview["accuracyOverTime"] }) {
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
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={rows} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="analyticsAcc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="date" {...AXIS} tickLine={false} minTickGap={20} />
        <YAxis domain={[0, 100]} {...AXIS} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number, _n, item) => {
            const p = item?.payload as { count: number } | undefined;
            return [`${v}%${p ? ` over ${p.count} questions` : ""}`, "Accuracy"];
          }}
        />
        <Area
          type="monotone"
          dataKey="pct"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#analyticsAcc)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function VolumeOverTime({ data }: { data: Overview["volumeOverTime"] }) {
  if (!data.length) {
    return <p className="py-10 text-center text-[0.8125rem] text-ink-3">No practice logged yet.</p>;
  }
  const rows = data.slice(-30).map((d) => ({ ...d, date: d.date.slice(5) }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="date" {...AXIS} tickLine={false} minTickGap={20} />
        <YAxis {...AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          contentStyle={tooltipStyle}
          formatter={(v: number, _n, item) => {
            const p = item?.payload as { minutes: number } | undefined;
            return [`${v} questions${p ? ` · ${p.minutes} min` : ""}`, "Volume"];
          }}
        />
        <Bar dataKey="questions" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DifficultyProfile({ data }: { data: Overview["byDifficulty"] }) {
  if (!data.length) {
    return <p className="py-10 text-center text-[0.8125rem] text-ink-3">No data yet.</p>;
  }
  const rows = data.map((d) => ({
    name: d.difficulty.charAt(0) + d.difficulty.slice(1).toLowerCase(),
    pct: Math.round(d.accuracy * 100),
    answered: d.answered,
    fill:
      d.difficulty === "EASY"
        ? "var(--good)"
        : d.difficulty === "MEDIUM"
          ? "var(--warn)"
          : "var(--bad)",
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="name" {...AXIS} tickLine={false} />
        <YAxis domain={[0, 100]} {...AXIS} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          contentStyle={tooltipStyle}
          formatter={(v: number, _n, item) => {
            const p = item?.payload as { answered: number } | undefined;
            return [`${v}%${p ? ` of ${p.answered}` : ""}`, "Accuracy"];
          }}
        />
        <Bar dataKey="pct" radius={[5, 5, 0, 0]} maxBarSize={56}>
          {rows.map((r) => (
            <Cell key={r.name} fill={r.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MistakeTypes({ data }: { data: Overview["mistakeTypes"] }) {
  if (!data.length) {
    return (
      <p className="py-10 text-center text-[0.8125rem] text-ink-3">
        No mistakes analyzed yet — they appear here as soon as you miss something.
      </p>
    );
  }
  const rows = data.slice(0, 8).map((d) => ({ type: mistakeLabel(d.type), count: d.count }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, rows.length * 34)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
        <XAxis type="number" allowDecimals={false} {...AXIS} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="type"
          width={150}
          fontSize={11}
          stroke="var(--ink-3)"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          contentStyle={tooltipStyle}
          formatter={(v: number) => [v, "Occurrences"]}
        />
        <Bar dataKey="count" fill="var(--warn)" radius={[0, 4, 4, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
