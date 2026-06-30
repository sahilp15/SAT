// Shared types for the question importer.
// ParsedQuestion is the intermediate representation written to data/imported/*.json
// and then loaded into the database. It mirrors the Prisma Question + AnswerChoice
// shape closely, so the loader is a thin mapping.

export interface ParsedChoice {
  label: string; // A | B | C | D
  content: string;
  isCorrect: boolean;
  rationaleWrong?: string;
}

export interface ParsedQuestion {
  externalId: string | null;
  section: "MATH" | "READING_WRITING";
  domain: string;
  skill: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  format: "MCQ" | "SPR";
  stimulus: string | null;
  stem: string;
  correctAnswer: string;
  explanation: string | null;
  choices: ParsedChoice[];
  source: string;
  isBluebook: boolean;
  requiresCalculator: boolean;
  desmosRelevant: boolean;
  isRegression: boolean;
  // QC
  reviewStatus: "OK" | "NEEDS_REVIEW";
  importConfidence: number; // 0..1
  importNotes: string | null;
}

export interface ImportReport {
  sourceFile: string;
  total: number;
  ok: number;
  needsReview: number;
  bySection: Record<string, number>;
}
