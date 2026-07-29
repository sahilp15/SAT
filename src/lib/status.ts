// Cross-cutting numbers the app chrome needs on every page: the countdown, the
// study streak, how many reviews are due, and the current score estimate.

import { prisma } from "./db";
import { resolveTestDate } from "./testDate";

export interface AppStatus {
  daysRemaining: number | null;
  testLabel: string | null;
  streakDays: number;
  dueCount: number;
  predictedTotal: number | null;
  targetScore: number | null;
  onboardingComplete: boolean;
  hasDiagnostic: boolean;
}

/**
 * Consecutive days ending today (or yesterday) with at least one attempt.
 * Counting from yesterday keeps a streak alive until the end of the next day,
 * which is what a student expects at 8am before they've practiced.
 */
export function computeStreak(days: string[], today: string, yesterday: string): number {
  const set = new Set(days);
  let cursor: Date;
  if (set.has(today)) cursor = new Date(`${today}T00:00:00`);
  else if (set.has(yesterday)) cursor = new Date(`${yesterday}T00:00:00`);
  else return 0;

  let streak = 0;
  for (;;) {
    const key = toKey(cursor);
    if (!set.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getAppStatus(userId: string, now: Date = new Date()): Promise<AppStatus> {
  const [profile, result, due, attempts] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId } }),
    prisma.diagnosticResult.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.srsItem.count({ where: { userId, active: true, dueDate: { lte: now } } }),
    prisma.questionAttempt.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  const resolved = resolveTestDate(profile, now);
  const yesterday = new Date(now.getTime() - 86_400_000);
  const streakDays = computeStreak(
    attempts.map((a) => toKey(a.createdAt)),
    toKey(now),
    toKey(yesterday)
  );

  return {
    daysRemaining: resolved ? resolved.daysRemaining : null,
    testLabel: resolved ? resolved.label : null,
    streakDays,
    dueCount: due,
    predictedTotal: result?.totalScore ?? profile?.lastTotalScore ?? null,
    targetScore: profile?.targetScore ?? null,
    onboardingComplete: profile?.onboardingComplete ?? false,
    hasDiagnostic: !!result,
  };
}
