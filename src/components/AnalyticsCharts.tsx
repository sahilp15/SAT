"use client";

import {
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Overview } from "@/lib/analytics";

const pct = (v: number) => `${Math.round(v * 100)}%`;

export function AccuracyOverTime({ data }: { data: Overview["accuracyOverTime"] }) {
  if (data.length < 2) {
    return <p className="text-sm text-slate-400">Answer questions on more than one day to see a trend.</p>;
  }
  const rows = data.map((d) => ({ date: d.date.slice(5), accuracy: Math.round(d.accuracy * 100) }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" fontSize={12} stroke="#94a3b8" />
        <YAxis domain={[0, 100]} fontSize={12} stroke="#94a3b8" />
        <Tooltip formatter={(v) => `${v}%`} />
        <Line type="monotone" dataKey="accuracy" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AccuracyByDifficulty({ data }: { data: Overview["byDifficulty"] }) {
  if (!data.length) return <p className="text-sm text-slate-400">No data yet.</p>;
  const rows = data.map((d) => ({
    difficulty: d.difficulty.charAt(0) + d.difficulty.slice(1).toLowerCase(),
    accuracy: Math.round(d.accuracy * 100),
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="difficulty" fontSize={12} stroke="#94a3b8" />
        <YAxis domain={[0, 100]} fontSize={12} stroke="#94a3b8" />
        <Tooltip formatter={(v) => `${v}%`} />
        <Bar dataKey="accuracy" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MistakeTypes({ data }: { data: Overview["mistakeTypes"] }) {
  if (!data.length) return <p className="text-sm text-slate-400">No error logs yet.</p>;
  const rows = data.slice(0, 8).map((d) => ({
    type: d.type.replace(/_/g, " ").toLowerCase(),
    count: d.count,
  }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 34)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
        <XAxis type="number" allowDecimals={false} fontSize={12} stroke="#94a3b8" />
        <YAxis type="category" dataKey="type" width={120} fontSize={11} stroke="#94a3b8" />
        <Tooltip />
        <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export { pct };
