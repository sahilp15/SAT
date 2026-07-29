// Resolving "when is my test?".
//
// A student's test date can come from two places: an entry in
// config/sat-dates.json (picked from a list) or an explicit ISO date they typed.
// The explicit date always wins, and everything downstream — countdown, study
// plan, phase selection — goes through here so there is exactly one answer.

import { getSatDateById, type SatDate } from "./satDates";

export interface ResolvedTestDate {
  /** Midnight local time on test day. */
  date: Date;
  iso: string; // YYYY-MM-DD
  label: string;
  /** Whole days from today; negative once the date has passed. */
  daysRemaining: number;
  weeksRemaining: number;
  isPast: boolean;
}

export interface TestDateSource {
  testDate?: string | null;
  satDateId?: string | null;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d.getTime());
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Parse "YYYY-MM-DD" as a local midnight, not a UTC instant. */
export function parseIsoDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + days);
  return x;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000);
}

/** Nicely formatted long date, stable between server and client renders. */
export function formatLongDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: undefined,
  });
}

export function resolveTestDate(
  source: TestDateSource | null | undefined,
  now: Date = new Date()
): ResolvedTestDate | null {
  if (!source) return null;

  let date: Date | null = null;
  let label: string | null = null;

  if (source.testDate) {
    date = parseIsoDate(source.testDate);
    if (date) label = formatLongDate(date);
  }
  if (!date && source.satDateId) {
    const configured: SatDate | null = getSatDateById(source.satDateId);
    if (configured) {
      date = parseIsoDate(configured.date);
      label = configured.label;
    }
  }
  if (!date) return null;

  const daysRemaining = daysBetween(now, date);
  return {
    date,
    iso: toIsoDate(date),
    label: label ?? formatLongDate(date),
    daysRemaining,
    weeksRemaining: Math.max(0, Math.floor(daysRemaining / 7)),
    isPast: daysRemaining < 0,
  };
}
