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

// ---------------------------------------------------------------------------
// Subskills.
// The official College Board skills above are broad ("Nonlinear functions"
// covers a lot of ground). Subskills are the granular thing a student actually
// practices, and they're what the recommendation engine names back to them.
// Each entry carries a matcher so imported questions can be auto-tagged from
// their stem/skill without a second data source.
// ---------------------------------------------------------------------------
export interface SubskillDef {
  name: string;
  /** Matched against the lower-cased stem (+ choices) of a question. */
  match: RegExp;
}

export const SUBSKILLS: Record<string, SubskillDef[]> = {
  // --- Math: Algebra -------------------------------------------------------
  "Linear equations in one variable": [
    { name: "Variables on both sides", match: /=.*[a-z].*[-+].*=|both sides/ },
    { name: "Equations with fractions or decimals", match: /\d\/\d|\bfraction\b|\d\.\d/ },
    { name: "Solving for a specified variable", match: /in terms of|solve for/ },
  ],
  "Linear equations in two variables": [
    { name: "Slope interpretation in context", match: /\bslope\b|rate of change|best interpretation|represents the/ },
    { name: "Writing the equation of a line", match: /equation of the line|passes through/ },
    { name: "Intercepts and their meaning", match: /intercept/ },
  ],
  "Linear functions": [
    { name: "Interpreting linear models in context", match: /model|context|represents|predicts/ },
    { name: "Evaluating and building linear functions", match: /f\(|function\s+f|defined by/ },
  ],
  "Systems of two linear equations in two variables": [
    { name: "Systems in word problems", match: /total|each|purchased|tickets|cost of|sold/ },
    { name: "Number of solutions of a system", match: /no solution|infinitely many|exactly one solution/ },
    { name: "Solving systems algebraically", match: /solution to the (given )?system|value of x|value of y/ },
  ],
  "Linear inequalities in one or two variables": [
    { name: "Modeling constraints with inequalities", match: /at least|at most|no more than|no fewer/ },
    { name: "Graphing and reading solution regions", match: /graph|shaded|region/ },
  ],
  // --- Math: Advanced Math -------------------------------------------------
  "Equivalent expressions": [
    { name: "Factoring and expanding polynomials", match: /factor|expand|product of|\bpolynomial\b/ },
    { name: "Rational and radical expressions", match: /\bradical\b|square root|√|denominator|rational expression/ },
    { name: "Exponent rules", match: /exponent|\^|raised to the/ },
  ],
  "Nonlinear equations in one variable and systems of equations in two variables": [
    { name: "Quadratic equations and the discriminant", match: /quadratic|discriminant|x\^?2|x²/ },
    { name: "Nonlinear systems and intersections", match: /system|intersect|solutions? \(x, ?y\)/ },
    { name: "Extraneous solutions", match: /extraneous|square both sides/ },
  ],
  "Nonlinear functions": [
    { name: "Exponential growth and decay models", match: /exponential|growth|decay|doubl|half-life|compound|increases by \d+%/ },
    { name: "Function transformations and shifts", match: /transform|shift|translat|reflect|stretch|g\(x\) ?= ?f\(/ },
    { name: "Parabola vertex and zeros", match: /vertex|minimum value|maximum value|zeros?|x-intercepts?/ },
    { name: "Reading nonlinear graphs", match: /graph of|shown in the xy-plane/ },
  ],
  // --- Math: Problem-Solving and Data Analysis -----------------------------
  "Ratios, rates, proportional relationships, and units": [
    { name: "Unit conversion", match: /convert|per (hour|minute|second|gram|meter|foot|inch|mile)|kilograms?|centimet|inches/ },
    { name: "Proportional reasoning", match: /proportional|ratio of|scale/ },
    { name: "Rates in context", match: /\brate\b|per\b/ },
  ],
  Percentages: [
    { name: "Percent change", match: /increase|decrease|percent change|discount|markup/ },
    { name: "Percent of a total", match: /percent of|% of/ },
  ],
  "One-variable data: Distributions and measures of center and spread": [
    { name: "Mean, median, and outliers", match: /mean|median|outlier/ },
    { name: "Standard deviation and spread", match: /standard deviation|spread|range of the data/ },
  ],
  "Two-variable data: Models and scatterplots": [
    { name: "Line of best fit and residuals", match: /line of best fit|residual|scatterplot/ },
    { name: "Choosing an appropriate model", match: /best model|exponential|linear model/ },
  ],
  "Probability and conditional probability": [
    { name: "Two-way tables", match: /table|selected at random/ },
    { name: "Conditional probability", match: /given that|among those/ },
  ],
  "Inference from sample statistics and margin of error": [
    { name: "Margin of error and confidence intervals", match: /margin of error|confidence interval|plausible/ },
    { name: "Generalizing from a sample", match: /sample|population|randomly selected/ },
  ],
  "Evaluating statistical claims: Observational studies and experiments": [
    { name: "Causation vs. association", match: /cause|causal|association/ },
    { name: "Study design and generalizability", match: /random(ly)? assign|observational|experiment/ },
  ],
  // --- Math: Geometry and Trigonometry ------------------------------------
  "Area and volume": [
    { name: "Volume of solids", match: /volume|cylinder|cone|sphere|prism|pyramid/ },
    { name: "Area and perimeter", match: /area|perimeter/ },
  ],
  "Lines, angles, and triangles": [
    { name: "Parallel lines and angle relationships", match: /parallel|transversal|supplementary|vertical angles/ },
    { name: "Similar and congruent triangles", match: /similar|congruent|corresponding/ },
  ],
  "Right triangles and trigonometry": [
    { name: "Pythagorean theorem and special triangles", match: /hypotenuse|right triangle|30|45|60/ },
    { name: "Sine, cosine, and tangent", match: /sin|cos|tan/ },
  ],
  Circles: [
    { name: "Equations of circles", match: /equation of the circle|center.*radius|x - h|standard form/ },
    { name: "Arcs, sectors, and radians", match: /arc|sector|radian|central angle/ },
  ],
  // --- Reading & Writing ---------------------------------------------------
  "Central Ideas and Details": [
    { name: "Main idea and supporting detail", match: /main idea|central idea|primarily|mainly/ },
    { name: "Locating explicit detail", match: /according to the text|states that/ },
  ],
  "Command of Evidence": [
    { name: "Textual evidence selection", match: /which (finding|quotation|choice).*(support|illustrate)/ },
    { name: "Quantitative evidence from graphs and tables", match: /graph|table|data|chart|figure/ },
  ],
  Inferences: [
    { name: "Logical completion of an argument", match: /logically completes|most logical/ },
    { name: "Drawing conclusions from evidence", match: /infer|suggest|imply/ },
  ],
  "Words in Context": [
    { name: "Academic vocabulary in context", match: /most nearly means|logically completes the text/ },
    { name: "Precise word choice", match: /word or phrase|conventional expression/ },
  ],
  "Text Structure and Purpose": [
    { name: "Function of a sentence or paragraph", match: /function of the underlined|serves? to|purpose of/ },
    { name: "Overall structure of a text", match: /structure of the text|organiz/ },
  ],
  "Cross-Text Connections": [
    { name: "Comparing two authors' claims", match: /text 2|author of text|respond to/ },
  ],
  "Rhetorical Synthesis": [
    { name: "Synthesizing notes to meet a goal", match: /notes|student wants to|goal/ },
  ],
  Transitions: [
    { name: "Transitions between ideas", match: /transition|logical transition|however|therefore|for example/ },
  ],
  Boundaries: [
    { name: "Sentence boundaries and run-ons", match: /punctuation|conventions of standard english/ },
    { name: "Commas, colons, and dashes", match: /comma|colon|dash|semicolon/ },
  ],
  "Form, Structure, and Sense": [
    { name: "Subject-verb agreement", match: /\bverb\b|agree/ },
    { name: "Pronouns and modifiers", match: /pronoun|modifier|antecedent/ },
    { name: "Verb tense and form", match: /tense|had been|has been|will have/ },
  ],
};

/** Every subskill name defined for a skill (no matchers). */
export function subskillsFor(skill: string): string[] {
  return (SUBSKILLS[skill] ?? []).map((s) => s.name);
}

/** All subskill names for a section, deduped. */
export function allSubskillsFor(section: Section): string[] {
  const out = new Set<string>();
  for (const skill of allSkillsFor(section)) for (const s of subskillsFor(skill)) out.add(s);
  return [...out];
}

// ---------------------------------------------------------------------------
// Approximate share of each section's questions, used to weight which skill
// gaps cost the most points. Values are rough public-domain estimates of the
// digital SAT blueprint (they sum to ~1 per section) — they drive prioritization
// only, never a reported score.
// ---------------------------------------------------------------------------
export const DOMAIN_WEIGHTS: Record<string, number> = {
  // Math
  Algebra: 0.35,
  "Advanced Math": 0.35,
  "Problem-Solving and Data Analysis": 0.15,
  "Geometry and Trigonometry": 0.15,
  // Reading & Writing
  "Information and Ideas": 0.26,
  "Craft and Structure": 0.28,
  "Expression of Ideas": 0.2,
  "Standard English Conventions": 0.26,
};

export function domainWeight(domain: string): number {
  return DOMAIN_WEIGHTS[domain] ?? 0.15;
}

export function taxonomyFor(section: Section): Record<string, string[]> {
  return section === "MATH" ? MATH_TAXONOMY : RW_TAXONOMY;
}

/** The domain that owns a skill, or null when the skill isn't in the taxonomy. */
export function domainForSkill(skill: string): string | null {
  for (const tax of [MATH_TAXONOMY, RW_TAXONOMY]) {
    for (const [domain, skills] of Object.entries(tax)) {
      if (skills.includes(skill)) return domain;
    }
  }
  return null;
}

export function sectionForSkill(skill: string): Section | null {
  if (Object.values(MATH_TAXONOMY).some((s) => s.includes(skill))) return "MATH";
  if (Object.values(RW_TAXONOMY).some((s) => s.includes(skill))) return "READING_WRITING";
  return null;
}

export function domainsFor(section: Section): string[] {
  return Object.keys(taxonomyFor(section));
}

export function allSkillsFor(section: Section): string[] {
  return Object.values(taxonomyFor(section)).flat();
}

// ---------------------------------------------------------------------------
// Mistake taxonomy.
// Shared by the manual error log (student picks one) and the automatic mistake
// analyzer (see src/lib/diagnostic/mistakes.ts), so both speak one language.
// ---------------------------------------------------------------------------
export const MISTAKE_TYPES = [
  { value: "CONCEPT_GAP", label: "Concept gap", hint: "Didn't know the underlying rule or method." },
  { value: "MISREAD_QUESTION", label: "Misread the question", hint: "Answered a slightly different question." },
  { value: "MISREAD_PASSAGE", label: "Misread the passage", hint: "Missed or misinterpreted what the text said." },
  { value: "GRAMMAR_RULE", label: "Grammar rule confusion", hint: "Applied the wrong convention." },
  { value: "VOCAB_CONTEXT", label: "Weak vocabulary in context", hint: "Word meaning in context wasn't clear." },
  { value: "EVIDENCE_SELECTION", label: "Evidence-selection mistake", hint: "Picked evidence that didn't actually support the claim." },
  { value: "ALGEBRA_MISTAKE", label: "Algebra mistake", hint: "Slipped while manipulating the expression." },
  { value: "CALCULATION_ERROR", label: "Calculation error", hint: "Arithmetic went wrong." },
  { value: "INCORRECT_SETUP", label: "Incorrect setup", hint: "Translated the problem into the wrong equation or model." },
  { value: "TIME_PRESSURE", label: "Time-pressure mistake", hint: "Rushed near the end of the section." },
  { value: "CARELESS", label: "Careless mistake", hint: "Knew it, but slipped." },
  { value: "GUESSED", label: "Guessing", hint: "No real basis for the choice." },
  { value: "ELIMINATION", label: "Trouble eliminating choices", hint: "Narrowed to two and picked the wrong one." },
  { value: "OTHER", label: "Other", hint: "Something else." },
] as const;
export type MistakeType = (typeof MISTAKE_TYPES)[number]["value"];

export const MISTAKE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  MISTAKE_TYPES.map((m) => [m.value, m.label])
);

// Values accepted by the legacy error-log rows created before the taxonomy was
// widened. Kept so old data still renders and validates.
const LEGACY_MISTAKE_TYPES = ["CONTENT_GAP", "ALGEBRA_CALC", "DESMOS_SETUP", "RUSHED"] as const;

export const LEGACY_MISTAKE_LABELS: Record<string, string> = {
  CONTENT_GAP: "Concept gap",
  ALGEBRA_CALC: "Algebra / calculation error",
  DESMOS_SETUP: "Desmos / setup error",
  RUSHED: "Rushed",
};

export function mistakeLabel(value: string): string {
  return MISTAKE_TYPE_LABELS[value] ?? LEGACY_MISTAKE_LABELS[value] ?? value;
}

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
  return (
    MISTAKE_TYPES.some((m) => m.value === v) ||
    (LEGACY_MISTAKE_TYPES as readonly string[]).includes(v)
  );
}
