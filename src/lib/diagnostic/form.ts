// The curated 20-question SAT Score Predictor form.
//
// WHY THIS IS A STATIC, CURATED FORM
// ----------------------------------
// A score estimate is only meaningful if the instrument is stable. Generating
// the questions live (from an LLM or at random from the bank) would make two
// runs incomparable, add latency and cost, and risk shipping a broken item into
// a scored assessment. So the form is fixed: every slot names a specific,
// hand-reviewed question from the local bank by its stable `externalId`.
//
// Each referenced item was checked for: exactly one defensible correct answer,
// four distinct plausible distractors (or a clean numeric answer for SPR),
// intact mathematical notation, no dependence on a figure the app cannot draw,
// and a complete official explanation. `form.test.ts` re-verifies all of that
// against the bank on every run, so a re-import that damages an item fails CI
// rather than silently degrading someone's score estimate.
//
// SHAPE OF THE FORM
// -----------------
// Per section: 5 routing questions (fixed for everyone, spanning all four
// content domains and ramping in difficulty) followed by 5 adaptive questions
// drawn from one of three tracks. Math and Reading & Writing route
// independently — being strong in one says nothing about the other.

import type { Difficulty, Section } from "../taxonomy";

export type DiagnosticStage = "ROUTING" | "ADAPTIVE";
export type DiagnosticTrack = "EASY" | "MEDIUM" | "HARD";

export interface DiagnosticSlot {
  /** Stable question-bank id; resolved to a Question row at session start. */
  externalId: string;
  section: Section;
  stage: DiagnosticStage;
  domain: string;
  skill: string;
  difficulty: Difficulty;
  format: "MCQ" | "SPR";
}

export interface SectionForm {
  routing: DiagnosticSlot[];
  tracks: Record<DiagnosticTrack, DiagnosticSlot[]>;
}

/** Math is presented first so the student meets the harder pacing while fresh. */
export const SECTION_ORDER: Section[] = ["MATH", "READING_WRITING"];

export const QUESTIONS_PER_STAGE = 5;
export const QUESTIONS_PER_SECTION = QUESTIONS_PER_STAGE * 2;
export const TOTAL_QUESTIONS = QUESTIONS_PER_SECTION * SECTION_ORDER.length;

const m = (
  externalId: string,
  stage: DiagnosticStage,
  domain: string,
  skill: string,
  difficulty: Difficulty,
  format: "MCQ" | "SPR" = "MCQ"
): DiagnosticSlot => ({ externalId, section: "MATH", stage, domain, skill, difficulty, format });

const r = (
  externalId: string,
  stage: DiagnosticStage,
  domain: string,
  skill: string,
  difficulty: Difficulty
): DiagnosticSlot => ({
  externalId,
  section: "READING_WRITING",
  stage,
  domain,
  skill,
  difficulty,
  format: "MCQ",
});

const ALGEBRA = "Algebra";
const ADVANCED = "Advanced Math";
const PSDA = "Problem-Solving and Data Analysis";
const GEOMETRY = "Geometry and Trigonometry";

const INFO = "Information and Ideas";
const CRAFT = "Craft and Structure";
const EXPRESSION = "Expression of Ideas";
const CONVENTIONS = "Standard English Conventions";

const MATH_FORM: SectionForm = {
  // Routing: one item per domain plus a second Algebra item, ramping
  // EASY -> EASY -> MEDIUM -> MEDIUM -> HARD.
  routing: [
    m("551e171e", "ROUTING", ALGEBRA, "Linear equations in one variable", "EASY", "SPR"),
    m("a3d03f49", "ROUTING", ADVANCED, "Equivalent expressions", "EASY"),
    m("e0a370ba", "ROUTING", ALGEBRA, "Linear equations in two variables", "MEDIUM"),
    m("dbb97818", "ROUTING", GEOMETRY, "Area and volume", "MEDIUM"),
    m("a14f60fe", "ROUTING", PSDA, "Evaluating statistical claims: Observational studies and experiments", "HARD"),
  ],
  tracks: {
    // Strong routing performance -> mostly HARD, to find where the ceiling is.
    HARD: [
      m("427f0eea", "ADAPTIVE", ADVANCED, "Nonlinear functions", "HARD"),
      m("bd12c0bd", "ADAPTIVE", ALGEBRA, "Linear equations in one variable", "HARD"),
      m("4abd4abf", "ADAPTIVE", GEOMETRY, "Area and volume", "HARD"),
      m("e03f95ad", "ADAPTIVE", PSDA, "One-variable data: Distributions and measures of center and spread", "HARD", "SPR"),
      m("9f13fad1", "ADAPTIVE", ADVANCED, "Nonlinear equations in one variable and systems of equations in two variables", "HARD", "SPR"),
    ],
    // Mixed routing performance -> MEDIUM with one HARD probe at the end.
    MEDIUM: [
      m("3a519c76", "ADAPTIVE", ALGEBRA, "Systems of two linear equations in two variables", "MEDIUM"),
      m("cb03e399", "ADAPTIVE", ADVANCED, "Nonlinear equations in one variable and systems of equations in two variables", "MEDIUM"),
      m("8e79ef1c", "ADAPTIVE", GEOMETRY, "Circles", "MEDIUM", "SPR"),
      m("79c54a4d", "ADAPTIVE", PSDA, "Probability and conditional probability", "MEDIUM", "SPR"),
      m("84877fd5", "ADAPTIVE", ALGEBRA, "Linear functions", "HARD"),
    ],
    // Weak routing performance -> EASY/MEDIUM. Easier items carry more
    // diagnostic information here: they separate "shaky" from "not yet taught".
    EASY: [
      m("827504df", "ADAPTIVE", ALGEBRA, "Linear functions", "EASY", "SPR"),
      m("cf0fc6ba", "ADAPTIVE", ADVANCED, "Equivalent expressions", "EASY"),
      m("8588cf5e", "ADAPTIVE", GEOMETRY, "Area and volume", "EASY", "SPR"),
      m("4168b08f", "ADAPTIVE", PSDA, "Ratios, rates, proportional relationships, and units", "EASY"),
      m("ce6f6062", "ADAPTIVE", ALGEBRA, "Linear equations in one variable", "MEDIUM", "SPR"),
    ],
  },
};

const RW_FORM: SectionForm = {
  routing: [
    r("b0b02f2d", "ROUTING", CRAFT, "Words in Context", "EASY"),
    r("c44fcf03", "ROUTING", CONVENTIONS, "Boundaries", "EASY"),
    r("bda73a5a", "ROUTING", INFO, "Central Ideas and Details", "MEDIUM"),
    r("a3df6d00", "ROUTING", EXPRESSION, "Transitions", "MEDIUM"),
    r("e92c75a8", "ROUTING", INFO, "Command of Evidence", "HARD"),
  ],
  tracks: {
    HARD: [
      r("e18e4844", "ADAPTIVE", INFO, "Inferences", "HARD"),
      r("7cb7eb7a", "ADAPTIVE", CONVENTIONS, "Form, Structure, and Sense", "HARD"),
      r("59aa305b", "ADAPTIVE", EXPRESSION, "Rhetorical Synthesis", "HARD"),
      r("ef9e1e81", "ADAPTIVE", CRAFT, "Text Structure and Purpose", "HARD"),
      r("bf0c8b48", "ADAPTIVE", CRAFT, "Words in Context", "HARD"),
    ],
    MEDIUM: [
      r("08fe665d", "ADAPTIVE", CONVENTIONS, "Boundaries", "MEDIUM"),
      r("d9111e70", "ADAPTIVE", INFO, "Command of Evidence", "MEDIUM"),
      r("dd8a1d0d", "ADAPTIVE", EXPRESSION, "Rhetorical Synthesis", "MEDIUM"),
      r("e08dee38", "ADAPTIVE", CRAFT, "Words in Context", "MEDIUM"),
      r("af45dc3f", "ADAPTIVE", INFO, "Inferences", "HARD"),
    ],
    EASY: [
      r("8996e8a7", "ADAPTIVE", CRAFT, "Words in Context", "EASY"),
      r("6afef2f0", "ADAPTIVE", CONVENTIONS, "Form, Structure, and Sense", "EASY"),
      r("059bfe10", "ADAPTIVE", INFO, "Central Ideas and Details", "EASY"),
      r("654e54b2", "ADAPTIVE", EXPRESSION, "Transitions", "EASY"),
      r("fd7c6d0d", "ADAPTIVE", CRAFT, "Text Structure and Purpose", "MEDIUM"),
    ],
  },
};

export const DIAGNOSTIC_FORM: Record<Section, SectionForm> = {
  MATH: MATH_FORM,
  READING_WRITING: RW_FORM,
};

/** Every slot referenced anywhere in the form (used for seeding + validation). */
export function allDiagnosticSlots(): DiagnosticSlot[] {
  const out: DiagnosticSlot[] = [];
  for (const section of SECTION_ORDER) {
    const form = DIAGNOSTIC_FORM[section];
    out.push(...form.routing);
    for (const track of ["EASY", "MEDIUM", "HARD"] as DiagnosticTrack[]) {
      out.push(...form.tracks[track]);
    }
  }
  return out;
}

/** All external ids the form depends on. */
export function diagnosticExternalIds(): string[] {
  return allDiagnosticSlots().map((s) => s.externalId);
}

export function routingSlots(section: Section): DiagnosticSlot[] {
  return DIAGNOSTIC_FORM[section].routing;
}

export function trackSlots(section: Section, track: DiagnosticTrack): DiagnosticSlot[] {
  return DIAGNOSTIC_FORM[section].tracks[track];
}
