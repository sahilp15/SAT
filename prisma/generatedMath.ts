// Preloaded, ORIGINAL SAT-style Math question bank (NOT College Board content).
// 367 questions across Algebra, Advanced Math, Problem-Solving & Data Analysis,
// and Geometry & Trigonometry. These ship with the app and are loaded by
// `npm run db:seed`, so the Math section is fully populated on first run with
// NO API key and NO import step required.
//
// The raw questions live in generatedMath.json (authored offline). This module
// reads that file and maps it onto the SeedQuestion shape the seeder expects:
//   - questionType "FRQ" -> format "SPR" (student-produced response, no choices)
//   - questionType "MCQ" -> format "MCQ", with the correct choice flagged by
//     matching its label against the question's correctAnswer.
// Math is inline LaTeX ($...$) and renders through MathText/KaTeX.

import fs from "fs";
import path from "path";
import type { SeedQuestion } from "./sampleQuestions";

interface RawChoice {
  label: string;
  content: string;
}

interface RawQuestion {
  externalId: string;
  section: string;
  domain: string;
  skill: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questionType: "MCQ" | "FRQ";
  stem: string;
  correctAnswer: string;
  explanation: string;
  choices?: RawChoice[];
}

const raw: RawQuestion[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, "generatedMath.json"), "utf-8")
);

export const GENERATED_MATH: SeedQuestion[] = raw.map((q) => ({
  externalId: q.externalId,
  section: "MATH",
  domain: q.domain,
  skill: q.skill,
  difficulty: q.difficulty,
  format: q.questionType === "FRQ" ? "SPR" : "MCQ",
  stem: q.stem,
  correctAnswer: q.correctAnswer,
  explanation: q.explanation,
  choices: (q.choices ?? []).map((c) => ({
    label: c.label,
    content: c.content,
    isCorrect: c.label === q.correctAnswer,
  })),
}));
