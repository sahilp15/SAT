// SAT content taxonomy + enum-like constants.
// These are the canonical allowed values for the `String` fields in the Prisma
// schema. Keeping them here (rather than as DB enums) keeps SQLite portable to
// Postgres while still giving us a single, type-safe source of truth.

export const SECTIONS = {
  READING_WRITING: "READING_WRITING",
  MATH: "MATH",
} as const;
export type Section = (typeof SECTIONS)[keyof typeof SECTIONS];

export const SECTION_LABELS: Record<Section, string> = {
  READING_WRITING: "Reading & Writing",
  MATH: "Math",
};

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

// ---------------------------------------------------------------------------
// Reading & Writing taxonomy (College Board domains -> skills)
// ---------------------------------------------------------------------------
export const RW_TAXONOMY: Record<string, string[]> = {
  "Information and Ideas": [
    "Central Ideas and Details",
    "Command of Evidence",
    "Inferences",
  ],
  "Craft and Structure": [
    "Words in Context",
    "Text Structure and Purpose",
    "Cross-Text Connections",
  ],
  "Expression of Ideas": ["Rhetorical Synthesis", "Transitions"],
  "Standard English Conventions": [
    "Boundaries",
    "Form, Structure, and Sense",
  ],
};

// ---------------------------------------------------------------------------
// Math taxonomy (College Board domains -> skills/subtopics)
// ---------------------------------------------------------------------------
export const MATH_TAXONOMY: Record<string, string[]> = {
  Algebra: [
    "Linear equations in one variable",
    "Linear equations in two variables",
    "Linear functions",
    "Systems of two linear equations in two variables",
    "Linear inequalities in one or two variables",
  ],
  "Advanced Math": [
    "Equivalent expressions",
    "Nonlinear equations in one variable and systems of equations in two variables",
    "Nonlinear functions",
  ],
  "Problem-Solving and Data Analysis": [
    "Ratios, rates, proportional relationships, and units",
    "Percentages",
    "One-variable data: Distributions and measures of center and spread",
    "Two-variable data: Models and scatterplots",
    "Probability and conditional probability",
    "Inference from sample statistics and margin of error",
    "Evaluating statistical claims: Observational studies and experiments",
  ],
  "Geometry and Trigonometry": [
    "Area and volume",
    "Lines, angles, and triangles",
    "Right triangles and trigonometry",
    "Circles",
  ],
};

export function taxonomyFor(section: Section): Record<string, string[]> {
  return section === "MATH" ? MATH_TAXONOMY : RW_TAXONOMY;
}

export function domainsFor(section: Section): string[] {
  return Object.keys(taxonomyFor(section));
}

export function allSkillsFor(section: Section): string[] {
  return Object.values(taxonomyFor(section)).flat();
}

// ---------------------------------------------------------------------------
// Error-log mistake types (required by the error-log flow)
// ---------------------------------------------------------------------------
export const MISTAKE_TYPES = [
  { value: "CONTENT_GAP", label: "Content gap (didn't know the concept)" },
  { value: "MISREAD_QUESTION", label: "Misread the question" },
  { value: "MISREAD_PASSAGE", label: "Misread the passage" },
  { value: "GRAMMAR_RULE", label: "Grammar rule issue" },
  { value: "VOCAB_CONTEXT", label: "Vocabulary / context issue" },
  { value: "ALGEBRA_CALC", label: "Algebra / calculation error" },
  { value: "DESMOS_SETUP", label: "Desmos / setup error" },
  { value: "RUSHED", label: "Rushed" },
  { value: "GUESSED", label: "Guessed" },
  { value: "OTHER", label: "Other" },
] as const;
export type MistakeType = (typeof MISTAKE_TYPES)[number]["value"];

export const CONFIDENCE_LEVELS = [
  { value: "GUESS", label: "Guessed" },
  { value: "UNSURE", label: "Unsure" },
  { value: "CONFIDENT", label: "Confident" },
] as const;

export const CONFIDENCE_AFTER = [
  { value: "LOW", label: "Still shaky" },
  { value: "MEDIUM", label: "Mostly get it" },
  { value: "HIGH", label: "Fully understand now" },
] as const;

export const PLAN_INTENSITIES = [
  { value: "LIGHT", label: "Light" },
  { value: "BALANCED", label: "Balanced" },
  { value: "AGGRESSIVE", label: "Aggressive" },
] as const;

export const PRACTICE_MODES = {
  PRACTICE: "practice",
  TIMED: "timed",
  SRS: "srs",
  MISSED: "missed",
  MIXED: "mixed",
  DIAGNOSTIC: "diagnostic",
} as const;

// Validation helpers ---------------------------------------------------------
export function isSection(v: string): v is Section {
  return v === "MATH" || v === "READING_WRITING";
}
export function isDifficulty(v: string): v is Difficulty {
  return (DIFFICULTIES as readonly string[]).includes(v);
}
export function isMistakeType(v: string): boolean {
  return MISTAKE_TYPES.some((m) => m.value === v);
}
