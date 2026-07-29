"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Charts for the diagnostic result. Colors are CSS variables, so both themes
// are handled by the token set rather than by JS branching. Each chart answers
// one question — nothing here is decorative.

const AXIS = { fontSize: 11, stroke: "var(--ink-3)" };

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: "0.625rem",
  fontSize: "0.8125rem",
  color: "var(--ink)",
  boxShadow: "var(--shadow-pop)",
};

export interface DomainPoint {
  domain: string;
  short: string;
  accuracy: number;
  correct: number;
  total: number;
}

/** Accuracy across the four content domains of a section. */
export function DomainRadar({ data, label }: { data: DomainPoint[]; label: string }) {
  if (data.length < 3) {
    return (
      <p className="py-8 text-center text-[0.8125rem] text-ink-3">
        Not enough domain coverage to plot a shape for {label}.
      </p>
    );
  }
  const rows = data.map((d) => ({ ...d, pct: Math.round(d.accuracy * 100) }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={rows} outerRadius="72%">
        <PolarGrid stroke="var(--line)" />
        <PolarAngleAxis dataKey="short" tick={{ fill: "var(--ink-3)", fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number, _n, item) => {
            const p = item?.payload as DomainPoint | undefined;
            return [`${value}%${p ? ` (${p.correct}/${p.total})` : ""}`, "Accuracy"];
          }}
          labelFormatter={(_l, payload) => {
            const p = payload?.[0]?.payload as DomainPoint | undefined;
            return p?.domain ?? "";
          }}
        />
        <Radar
          name={label}
          dataKey="pct"
          stroke="var(--accent)"
          fill="var(--accent)"
          fillOpacity={0.18}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export interface DifficultyPoint {
  difficulty: string;
  accuracy: number;
  correct: number;
  total: number;
}

/**
 * Accuracy by difficulty. A flat or inverted profile here is the signal that
 * separates careless slips from genuine gaps.
 */
export function DifficultyBars({ data }: { data: DifficultyPoint[] }) {
  if (!data.length) {
    return <p className="py-8 text-center text-[0.8125rem] text-ink-3">No data yet.</p>;
  }
  const rows = data.map((d) => ({
    name: d.difficulty.charAt(0) + d.difficulty.slice(1).toLowerCase(),
    pct: Math.round(d.accuracy * 100),
    correct: d.correct,
    total: d.total,
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
          formatter={(value: number, _n, item) => {
            const p = item?.payload as { correct: number; total: number } | undefined;
            return [`${value}%${p ? ` (${p.correct}/${p.total})` : ""}`, "Accuracy"];
          }}
        />
        <Bar dataKey="pct" radius={[5, 5, 0, 0]} maxBarSize={54}>
          {rows.map((row) => (
            <Cell key={row.name} fill={row.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface TimingPoint {
  label: string;
  seconds: number;
  target: number;
  correct: boolean;
}

/**
 * Time spent per question against its target. Bars above the line are where the
 * clock was lost; very short bars on missed questions are likely guesses.
 */
export function TimingChart({ data }: { data: TimingPoint[] }) {
  if (!data.length) {
    return <p className="py-8 text-center text-[0.8125rem] text-ink-3">No timing data.</p>;
  }
  const rows = data.map((d) => ({
    ...d,
    fill: d.correct ? "var(--good)" : "var(--bad)",
    over: d.seconds > d.target * 2,
  }));
  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis dataKey="label" {...AXIS} tickLine={false} interval={0} />
        <YAxis {...AXIS} tickLine={false} axisLine={false} unit="s" />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          contentStyle={tooltipStyle}
          formatter={(value: number, _n, item) => {
            const p = item?.payload as TimingPoint | undefined;
            return [
              `${value}s (target ${p?.target ?? "—"}s) · ${p?.correct ? "correct" : "missed"}`,
              "Time",
            ];
          }}
        />
        <Bar dataKey="seconds" radius={[4, 4, 0, 0]} maxBarSize={28}>
          {rows.map((row, i) => (
            <Cell key={i} fill={row.fill} fillOpacity={row.over ? 1 : 0.75} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
