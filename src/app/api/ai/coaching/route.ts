import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLocalUser } from "@/lib/user";
import { dailyCoaching, isAiConfigured } from "@/lib/ai";
import { getTodayPlan } from "@/lib/planning";
import { getAppStatus } from "@/lib/status";
import { toIsoDate } from "@/lib/testDate";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * A short daily coaching note for the dashboard. Loaded client-side after the
 * page renders so a slow or missing AI service never delays the dashboard.
 */
export async function GET() {
  const user = await getLocalUser();
  const settings = await prisma.settings.findUnique({ where: { userId: user.id } });

  if (!isAiConfigured() || settings?.aiEnabled === false) {
    return NextResponse.json({ available: false, reason: "NOT_CONFIGURED" });
  }

  const [status, today, mastery, weekAttempts] = await Promise.all([
    getAppStatus(user.id),
    getTodayPlan(user.id),
    prisma.topicMastery.findMany({
      where: { userId: user.id, attempts: { gte: 2 } },
      orderBy: { mastery: "asc" },
      take: 3,
    }),
    prisma.questionAttempt.findMany({
      where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
      select: { isCorrect: true },
    }),
  ]);

  const correct = weekAttempts.filter((a) => a.isCorrect).length;

  const result = await dailyCoaching(
    {
      daysUntilTest: status.daysRemaining,
      targetScore: status.targetScore,
      predictedTotal: status.predictedTotal,
      streakDays: status.streakDays,
      todayKind: today?.kind ?? "open",
      todayFocus: today?.items.map((i) => i.label) ?? [],
      weakestSkills: mastery.map((m) => m.skill),
      recentAccuracy: weekAttempts.length ? correct / weekAttempts.length : 0,
      questionsThisWeek: weekAttempts.length,
    },
    // One note per day per plan-state — keeps cost near zero on refreshes.
    `coach:${toIsoDate(new Date())}:${status.streakDays}:${weekAttempts.length}`
  );

  if (!result.ok) {
    return NextResponse.json({ available: false, reason: result.reason });
  }
  return NextResponse.json({ available: true, ...result.data, cached: result.cached });
}
