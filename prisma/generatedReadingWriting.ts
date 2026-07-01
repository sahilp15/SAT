// Preloaded, ORIGINAL SAT-style Reading & Writing question bank (NOT College
// Board content). 619 questions across all four R&W domains:
//   - Information and Ideas
//   - Craft and Structure
//   - Expression of Ideas
//   - Standard English Conventions
// These ship with the app and are loaded by `npm run db:seed`, so the Reading &
// Writing section is fully populated on first run with NO API key and NO import
// step required.
//
// The raw questions live in generatedReadingWriting.json (authored offline).
// This module reads that file and maps it onto the SeedQuestion shape the seeder
// expects. Every R&W item is multiple choice (A–D); the correct choice is
// flagged by matching its label against the question's correctAnswer.

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
  questionType: "MCQ";
  stem: string;
  correctAnswer: string;
  explanation: string;
  choices: RawChoice[];
}

const raw: RawQuestion[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, "generatedReadingWriting.json"), "utf-8")
);

export const GENERATED_READING_WRITING: SeedQuestion[] = raw.map((q) => ({
  externalId: q.externalId,
  section: "READING_WRITING",
  domain: q.domain,
  skill: q.skill,
  difficulty: q.difficulty,
  format: "MCQ",
  stem: q.stem,
  correctAnswer: q.correctAnswer,
  explanation: q.explanation,
  // R&W questions are text-only — no calculator/Desmos relevance.
  requiresCalculator: false,
  desmosRelevant: false,
  choices: (q.choices ?? []).map((c) => ({
    label: c.label,
    content: c.content,
    isCorrect: c.label === q.correctAnswer,
  })),
}));
