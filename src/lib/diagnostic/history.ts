// Reading the diagnostic history: which forms are done, what they scored, and
// how the estimate has moved.
//
// Every form is built on the same blueprint — same domains, same difficulty
// ramp, same routing structure — so scores across attempts are comparable and a
// trend line means something. Only the questions differ.

import { prisma } from "../db";
import { FORMS, FORM_COUNT, TOTAL_QUESTIONS, type DiagnosticForm } from "./form";

export type FormStatus = "COMPLETED" | "IN_PROGRESS" | "AVAILABLE";

export interface AttemptSummary {
  resultId: string;
  sessionId: string;
  formId: number;
  totalScore: number;
  totalLow: number;
  totalHigh: number;
  mathScore: number;
  mathLow: number;
  mathHigh: number;
  rwScore: number;
  rwLow: number;
  rwHigh: number;
  confidence: string;
  accuracyPct: number;
  takenAt: Date;
  /** Change in total versus the attempt taken immediately before this one. */
  delta: number | null;
}

export interface FormSummary {
  id: number;
  status: FormStatus;
  /** Most recent result for this form, if it has been submitted. */
  result: AttemptSummary | null;
  /** How many times this particular form has been submitted. */
  attempts: number;
  /** For an in-progress attempt: how far through it is. */
  progress: { sessionId: string; answered: number; total: number } | null;
}

export interface DiagnosticHistory {
  forms: FormSummary[];
  completedCount: number;
  totalForms: number;
  /** Every submitted attempt, oldest first — the series behind the chart. */
  timeline: AttemptSummary[];
  latest: AttemptSummary | null;
  best: AttemptSummary | null;
  /** The form the primary "Start" button should open. */
  nextFormId: number;
  activeSessionId: string | null;
  activeFormId: number | null;
}

export async function getDiagnosticHistory(userId: string): Promise<DiagnosticHistory> {
  const [results, active] = await Promise.all([
    prisma.diagnosticResult.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.diagnosticSession.findMany({
      where: { userId, status: "IN_PROGRESS" },
      orderBy: { startedAt: "desc" },
      include: { responses: { select: { chosenAnswer: true } } },
    }),
  ]);

  // Oldest first, so index === attempt number - 1 and delta is a real "since
  // last time" figure rather than a comparison with an arbitrary neighbour.
  const timeline: AttemptSummary[] = results.map((r, i) => ({
    resultId: r.id,
    sessionId: r.sessionId,
    formId: r.formId,
    totalScore: r.totalScore,
    totalLow: r.totalLow,
    totalHigh: r.totalHigh,
    mathScore: r.mathScore,
    mathLow: r.mathLow,
    mathHigh: r.mathHigh,
    rwScore: r.rwScore,
    rwLow: r.rwLow,
    rwHigh: r.rwHigh,
    confidence: r.confidence,
    accuracyPct: r.accuracyPct,
    takenAt: r.createdAt,
    delta: i > 0 ? r.totalScore - results[i - 1].totalScore : null,
  }));

  const attemptsByForm = new Map<number, AttemptSummary[]>();
  for (const attempt of timeline) {
    const list = attemptsByForm.get(attempt.formId);
    if (list) list.push(attempt);
    else attemptsByForm.set(attempt.formId, [attempt]);
  }

  const activeSession = active[0] ?? null;

  const forms: FormSummary[] = FORMS.map((form: DiagnosticForm) => {
    const attempts = attemptsByForm.get(form.id) ?? [];
    const session = active.find((s) => s.formId === form.id);
    return {
      id: form.id,
      status: attempts.length ? "COMPLETED" : session ? "IN_PROGRESS" : "AVAILABLE",
      result: attempts.at(-1) ?? null,
      attempts: attempts.length,
      progress: session
        ? {
            sessionId: session.id,
            answered: session.responses.filter((r) => r.chosenAnswer).length,
            total: TOTAL_QUESTIONS,
          }
        : null,
    };
  });

  const completed = forms.filter((f) => f.status === "COMPLETED");
  const best = timeline.reduce<AttemptSummary | null>(
    (acc, a) => (!acc || a.totalScore > acc.totalScore ? a : acc),
    null
  );
  const firstAvailable = forms.find((f) => f.status === "AVAILABLE");

  return {
    forms,
    completedCount: completed.length,
    totalForms: FORM_COUNT,
    timeline,
    latest: timeline.at(-1) ?? null,
    best,
    nextFormId: activeSession?.formId ?? firstAvailable?.id ?? FORMS[0].id,
    activeSessionId: activeSession?.id ?? null,
    activeFormId: activeSession?.formId ?? null,
  };
}

/**
 * Least-squares slope across completed attempts, in points per attempt. Two
 * points make a line but not a trend, so callers should present anything under
 * three attempts as provisional.
 */
export function scoreTrend(timeline: AttemptSummary[]): number | null {
  if (timeline.length < 2) return null;
  const n = timeline.length;
  const meanX = (n - 1) / 2;
  const meanY = timeline.reduce((s, t) => s + t.totalScore, 0) / n;
  let num = 0;
  let den = 0;
  timeline.forEach((t, i) => {
    num += (i - meanX) * (t.totalScore - meanY);
    den += (i - meanX) ** 2;
  });
  return den === 0 ? null : Math.round((num / den) * 10) / 10;
}
