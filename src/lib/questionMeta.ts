// Derives the structured study metadata every question carries: subskill, SAT
// relevance, whether a calculator genuinely helps, and a target time.
//
// The imported bank only gives us section / domain / skill / difficulty, so the
// rest is derived deterministically from content. Deterministic matters: the
// same question always gets the same metadata, which keeps the diagnostic form
// and the mastery model stable across re-seeds.

import { SUBSKILLS, type Difficulty, type Section } from "./taxonomy";

export interface QuestionMetaInput {
  section: string;
  domain: string;
  skill: string;
  difficulty: string;
  format: string;
  stem: string;
  stimulus?: string | null;
  choices?: { content: string }[];
}

export interface QuestionMeta {
  subskill: string | null;
  satRelevance: "HIGH" | "MEDIUM" | "LOW";
  calculatorAppropriate: boolean;
  timeRecommendationSec: number;
}

// Baseline pace from the real digital SAT: Math is 35 min / 22 questions
// (~95s), Reading & Writing is 32 min / 27 questions (~71s).
const BASE_SECONDS: Record<Section, number> = {
  MATH: 95,
  READING_WRITING: 71,
};

const DIFFICULTY_PACE: Record<Difficulty, number> = {
  EASY: 0.75,
  MEDIUM: 1.0,
  HARD: 1.3,
};

// Skills that carry the most tested weight — a gap here costs the most points.
const HIGH_RELEVANCE_SKILLS = new Set([
  "Linear equations in two variables",
  "Linear functions",
  "Nonlinear functions",
  "Equivalent expressions",
  "Nonlinear equations in one variable and systems of equations in two variables",
  "Systems of two linear equations in two variables",
  "Command of Evidence",
  "Words in Context",
  "Central Ideas and Details",
  "Boundaries",
  "Form, Structure, and Sense",
  "Transitions",
]);

const LOW_RELEVANCE_SKILLS = new Set([
  "Evaluating statistical claims: Observational studies and experiments",
  "Inference from sample statistics and margin of error",
  "Cross-Text Connections",
]);

// Where reaching for Desmos actually pays off. Pure arithmetic or symbolic
// manipulation is faster by hand, and telling a student otherwise builds a
// habit that costs them time on test day.
const CALCULATOR_SKILLS = new Set([
  "Linear equations in two variables",
  "Linear functions",
  "Systems of two linear equations in two variables",
  "Linear inequalities in one or two variables",
  "Nonlinear equations in one variable and systems of equations in two variables",
  "Nonlinear functions",
  "Two-variable data: Models and scatterplots",
  "One-variable data: Distributions and measures of center and spread",
  "Circles",
]);

const CALCULATOR_HINTS = /graph|xy-plane|scatterplot|system of|intersect|line of best fit|parabola|vertex/i;

function searchText(q: QuestionMetaInput): string {
  return [q.stimulus ?? "", q.stem, ...(q.choices ?? []).map((c) => c.content)]
    .join(" \n ")
    .toLowerCase();
}

/** First subskill whose matcher hits, else the skill's first subskill, else null. */
export function deriveSubskill(q: QuestionMetaInput): string | null {
  const defs = SUBSKILLS[q.skill];
  if (!defs?.length) return null;
  const text = searchText(q);
  for (const def of defs) {
    if (def.match.test(text)) return def.name;
  }
  return defs[0].name;
}

export function deriveQuestionMeta(q: QuestionMetaInput): QuestionMeta {
  const section = (q.section === "MATH" ? "MATH" : "READING_WRITING") as Section;
  const difficulty = (["EASY", "MEDIUM", "HARD"].includes(q.difficulty)
    ? q.difficulty
    : "MEDIUM") as Difficulty;

  const satRelevance = HIGH_RELEVANCE_SKILLS.has(q.skill)
    ? "HIGH"
    : LOW_RELEVANCE_SKILLS.has(q.skill)
      ? "LOW"
      : "MEDIUM";

  const calculatorAppropriate =
    section === "MATH" &&
    (CALCULATOR_SKILLS.has(q.skill) || CALCULATOR_HINTS.test(searchText(q)));

  // Student-produced responses take a little longer — there's no answer set to
  // check the work against.
  const formFactor = q.format === "SPR" ? 1.1 : 1;
  const timeRecommendationSec = Math.round(
    BASE_SECONDS[section] * DIFFICULTY_PACE[difficulty] * formFactor
  );

  return {
    subskill: deriveSubskill(q),
    satRelevance,
    calculatorAppropriate,
    timeRecommendationSec,
  };
}
