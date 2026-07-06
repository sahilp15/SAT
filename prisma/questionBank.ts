// The seed question bank.
//
// Loads the two curated JSON banks that ship with the app:
//   - bankReadingWriting.json  (619 Reading & Writing items)
//   - bankMath.json            (367 Math items; a few flagged NEEDS_REVIEW)
//
// These files are produced by `scripts/build-bank.py` from the source exports
// and already carry per-item routing flags (requiresCalculator, desmosRelevant,
// isRegression) and a reviewStatus. This module just reads them and maps onto
// the SeedQuestion shape the seeder expects.

import fs from "fs";
import path from "path";

export interface SeedChoice {
  label: string;
  content: string;
  isCorrect: boolean;
  rationaleWrong?: string;
}

export interface SeedQuestion {
  externalId: string;
  section: "MATH" | "READING_WRITING";
  domain: string;
  skill: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  format: "MCQ" | "SPR";
  stimulus?: string | null;
  stem: string;
  correctAnswer: string;
  explanation: string;
  choices: SeedChoice[];
  requiresCalculator?: boolean;
  desmosRelevant?: boolean;
  isRegression?: boolean;
}

export interface BankQuestion extends SeedQuestion {
  reviewStatus?: "OK" | "NEEDS_REVIEW";
}

interface RawBankQuestion {
  externalId: string;
  section: "MATH" | "READING_WRITING";
  domain: string;
  skill: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  format: "MCQ" | "SPR";
  stem: string;
  correctAnswer: string;
  explanation: string;
  choices: { label: string; content: string }[];
  requiresCalculator?: boolean;
  desmosRelevant?: boolean;
  isRegression?: boolean;
  reviewStatus?: "OK" | "NEEDS_REVIEW";
}

function load(file: string): BankQuestion[] {
  const raw: RawBankQuestion[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, file), "utf-8")
  );
  return raw.map((q) => ({
    externalId: q.externalId,
    section: q.section,
    domain: q.domain,
    skill: q.skill,
    difficulty: q.difficulty,
    format: q.format,
    stem: q.stem,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    requiresCalculator: q.requiresCalculator ?? q.section === "MATH",
    desmosRelevant: q.desmosRelevant ?? q.section === "MATH",
    isRegression: q.isRegression ?? false,
    reviewStatus: q.reviewStatus ?? "OK",
    choices: (q.choices ?? []).map((c) => ({
      label: c.label,
      content: c.content,
      isCorrect: c.label === q.correctAnswer,
    })),
  }));
}

export const READING_WRITING_BANK: BankQuestion[] = load("bankReadingWriting.json");
export const MATH_BANK: BankQuestion[] = load("bankMath.json");
export const QUESTION_BANK: BankQuestion[] = [...READING_WRITING_BANK, ...MATH_BANK];
