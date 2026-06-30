// SAT date configuration loader.
// All upcoming SAT dates come from config/sat-dates.json (the single source of
// truth). Nothing else in the codebase should hard-code SAT dates. Later this
// can be backed by a DB table or an admin/settings page without changing callers.

import satDatesConfig from "../../config/sat-dates.json";

export interface SatDate {
  id: string;
  label: string;
  date: string; // ISO YYYY-MM-DD
  registrationDeadline?: string;
}

export function getAllSatDates(): SatDate[] {
  return satDatesConfig.dates as SatDate[];
}

/** SAT dates strictly after `from` (defaults to now), sorted ascending. */
export function getUpcomingSatDates(from: Date = new Date()): SatDate[] {
  const cutoff = startOfDay(from).getTime();
  return getAllSatDates()
    .filter((d) => new Date(d.date + "T00:00:00").getTime() >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getSatDateById(id: string | null | undefined): SatDate | null {
  if (!id) return null;
  return getAllSatDates().find((d) => d.id === id) ?? null;
}

/** Whole days from `now` until the given SAT date (negative if past). */
export function daysUntil(satDate: SatDate, now: Date = new Date()): number {
  const target = startOfDay(new Date(satDate.date + "T00:00:00")).getTime();
  const today = startOfDay(now).getTime();
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

export function weeksUntil(satDate: SatDate, now: Date = new Date()): number {
  return Math.max(0, Math.floor(daysUntil(satDate, now) / 7));
}

function startOfDay(d: Date): Date {
  const x = new Date(d.getTime());
  x.setHours(0, 0, 0, 0);
  return x;
}
