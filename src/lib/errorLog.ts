// Reading the error log.
//
// The error log is built from *attempts*, not from written reflections: every
// missed or flagged question belongs there whether or not the student has
// written anything about it yet. Diagnoses, notes, and reflections are joined on
// top when they exist.

import { prisma } from "./db";
import type { MissedQuestion } from "@/components/review/MissedQuestionCard";

export interface ErrorLogFilters {
  section?: string;
  domain?: string;
  skill?: string;
  category?: string;
  difficulty?: string;
  status?: "ALL" | "UNRESOLVED" | "RESOLVED";
  origin?: "ALL" | "DIAGNOSTIC" | "PRACTICE";
  since?: Date;
  sessionId?: string;
  limit?: number;
}

export interface ErrorLogFacets {
  sections: string[];
  domains: string[];
  skills: string[];
  categories: string[];
  difficulties: string[];
}

function parseSimilar(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Missed or flagged attempts, newest first, with their analysis attached. */
export async function getErrorLog(
  userId: string,
  filters: ErrorLogFilters = {}
): Promise<MissedQuestion[]> {
  const attempts = await prisma.questionAttempt.findMany({
    where: {
      userId,
      // "Flagged but correct" still belongs in review — the student said so.
      OR: [{ isCorrect: false }, { flagged: true }],
      ...(filters.sessionId ? { sessionId: filters.sessionId } : {}),
      ...(filters.since ? { createdAt: { gte: filters.since } } : {}),
      ...(filters.status === "UNRESOLVED"
        ? { resolved: false }
        : filters.status === "RESOLVED"
          ? { resolved: true }
          : {}),
      ...(filters.origin === "DIAGNOSTIC"
        ? { mode: "diagnostic" }
        : filters.origin === "PRACTICE"
          ? { mode: { not: "diagnostic" } }
          : {}),
      question: {
        ...(filters.section ? { section: filters.section } : {}),
        ...(filters.domain ? { domain: filters.domain } : {}),
        ...(filters.skill ? { skill: filters.skill } : {}),
        ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
      },
      ...(filters.category ? { diagnosis: { category: filters.category } } : {}),
    },
    include: {
      question: { include: { choices: { orderBy: { label: "asc" } } } },
      diagnosis: true,
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 100,
  });

  return attempts.map((a) => ({
    attemptId: a.id,
    questionId: a.questionId,
    section: a.question.section,
    domain: a.question.domain,
    skill: a.question.skill,
    subskill: a.question.subskill,
    difficulty: a.question.difficulty,
    format: a.question.format,
    stem: a.question.stem,
    stimulus: a.question.stimulus,
    choices: a.question.choices.map((c) => ({
      label: c.label,
      content: c.content,
      isCorrect: c.isCorrect,
    })),
    correctAnswer: a.question.correctAnswer,
    chosenAnswer: a.chosenAnswer,
    explanation: a.question.explanation,
    timeMs: a.timeMs ?? 0,
    recommendedSec: a.question.timeRecommendationSec ?? 90,
    answerChanges: a.answerChanges,
    flagged: a.flagged,
    resolved: a.resolved,
    note: a.note,
    createdAt: a.createdAt.toISOString(),
    mode: a.mode,
    diagnosis: a.diagnosis
      ? {
          category: a.diagnosis.category,
          confidence: a.diagnosis.confidence,
          testing: a.diagnosis.testing,
          whyWrong: a.diagnosis.whyWrong,
          whyCorrect: a.diagnosis.whyCorrect,
          lesson: a.diagnosis.lesson,
          nextStep: a.diagnosis.nextStep,
          similar: parseSimilar(a.diagnosis.similarJson),
          source: a.diagnosis.source,
          userFeedback: a.diagnosis.userFeedback,
        }
      : null,
  }));
}

/** Distinct filter values actually present in this user's log. */
export async function getErrorLogFacets(userId: string): Promise<ErrorLogFacets> {
  const [questions, categories] = await Promise.all([
    prisma.questionAttempt.findMany({
      where: { userId, OR: [{ isCorrect: false }, { flagged: true }] },
      select: { question: { select: { section: true, domain: true, skill: true, difficulty: true } } },
    }),
    prisma.mistakeDiagnosis.groupBy({ by: ["category"], where: { userId }, _count: true }),
  ]);

  const sections = new Set<string>();
  const domains = new Set<string>();
  const skills = new Set<string>();
  const difficulties = new Set<string>();
  for (const q of questions) {
    sections.add(q.question.section);
    domains.add(q.question.domain);
    skills.add(q.question.skill);
    difficulties.add(q.question.difficulty);
  }

  const order = ["EASY", "MEDIUM", "HARD"];
  return {
    sections: [...sections].sort(),
    domains: [...domains].sort(),
    skills: [...skills].sort(),
    difficulties: [...difficulties].sort((a, b) => order.indexOf(a) - order.indexOf(b)),
    categories: categories
      .sort((a, b) => b._count - a._count)
      .map((c) => c.category),
  };
}

export interface ErrorLogStats {
  total: number;
  unresolved: number;
  resolved: number;
  dueForReview: number;
  topCategory: string | null;
}

export async function getErrorLogStats(userId: string): Promise<ErrorLogStats> {
  const now = new Date();
  const [total, resolved, dueForReview, categories] = await Promise.all([
    prisma.questionAttempt.count({
      where: { userId, OR: [{ isCorrect: false }, { flagged: true }] },
    }),
    prisma.questionAttempt.count({
      where: { userId, resolved: true, OR: [{ isCorrect: false }, { flagged: true }] },
    }),
    prisma.srsItem.count({ where: { userId, active: true, dueDate: { lte: now } } }),
    prisma.mistakeDiagnosis.groupBy({ by: ["category"], where: { userId }, _count: true }),
  ]);

  const top = [...categories].sort((a, b) => b._count - a._count)[0];
  return {
    total,
    resolved,
    unresolved: total - resolved,
    dueForReview,
    topCategory: top?.category ?? null,
  };
}
