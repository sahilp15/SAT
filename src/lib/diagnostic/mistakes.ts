// Heuristic mistake analysis.
//
// For every missed question we want a defensible answer to "why did I get this
// wrong?" — before any AI is involved. The AI layer can produce a richer, more
// specific write-up later, but this classifier is what guarantees the feature
// works with no key, no network, and no cost.
//
// The classifier deliberately combines *behavioral* evidence (time on task,
// answer changes, whether the item was flagged, how the student has done on
// this skill before) with *content* evidence (section, domain, skill,
// difficulty, and which distractor was chosen). Looking only at the correct
// answer would produce the same generic advice for every miss.

import { type Difficulty, type MistakeType, type Section } from "../taxonomy";

export interface MistakeSignals {
  section: Section;
  domain: string;
  skill: string;
  subskill?: string | null;
  difficulty: Difficulty;
  format: "MCQ" | "SPR";
  chosenAnswer: string | null;
  correctAnswer: string;
  timeMs: number;
  recommendedSec: number;
  answerChanges: number;
  flagged: boolean;
  /** Accuracy on this skill before this attempt, if we have any history. */
  priorSkillAccuracy?: number | null;
  priorSkillAttempts?: number;
  /** True when this response came near the end of a timed section. */
  nearSectionEnd?: boolean;
}

export interface MistakeAnalysis {
  category: MistakeType;
  /** How much to trust this label, 0..1. */
  confidence: number;
  testing: string;
  whyWrong: string;
  whyCorrect: string;
  lesson: string;
  nextStep: string;
  similar: string[];
}

const RUSHED_FRACTION = 0.25;
const SLOW_MULTIPLE = 2.0;

function isBlank(s: MistakeSignals): boolean {
  return s.chosenAnswer == null || s.chosenAnswer.trim() === "";
}

function isRushed(s: MistakeSignals): boolean {
  return s.timeMs > 0 && s.timeMs < s.recommendedSec * 1000 * RUSHED_FRACTION;
}

function isSlow(s: MistakeSignals): boolean {
  return s.timeMs > s.recommendedSec * 1000 * SLOW_MULTIPLE;
}

/** Repeated misses on a skill point at a concept gap rather than a slip. */
function isRepeatedWeakness(s: MistakeSignals): boolean {
  return (
    (s.priorSkillAttempts ?? 0) >= 2 &&
    s.priorSkillAccuracy != null &&
    s.priorSkillAccuracy < 0.5
  );
}

/** Strong history on a skill makes a single miss much more likely to be a slip. */
function isOutOfCharacter(s: MistakeSignals): boolean {
  return (
    (s.priorSkillAttempts ?? 0) >= 2 &&
    s.priorSkillAccuracy != null &&
    s.priorSkillAccuracy >= 0.75
  );
}

const CONVENTION_SKILLS = new Set(["Boundaries", "Form, Structure, and Sense"]);
const EVIDENCE_SKILLS = new Set(["Command of Evidence", "Central Ideas and Details", "Inferences"]);
const VOCAB_SKILLS = new Set(["Words in Context"]);
const SETUP_SKILLS = new Set([
  "Systems of two linear equations in two variables",
  "Linear inequalities in one or two variables",
  "Ratios, rates, proportional relationships, and units",
  "Percentages",
]);

/**
 * Pick the most likely mistake category. Rules are ordered from strongest
 * evidence to weakest; the first match wins, and each carries its own
 * confidence so the UI can be honest about guesses.
 */
export function classifyMistake(s: MistakeSignals): { category: MistakeType; confidence: number } {
  if (isBlank(s)) {
    return { category: "GUESSED", confidence: 0.9 };
  }
  if (isRushed(s) && s.difficulty !== "HARD") {
    return { category: "CARELESS", confidence: 0.72 };
  }
  if (isRushed(s)) {
    return { category: "GUESSED", confidence: 0.6 };
  }
  if (s.nearSectionEnd && isSlow(s)) {
    return { category: "TIME_PRESSURE", confidence: 0.68 };
  }
  if (s.answerChanges >= 2) {
    return { category: "ELIMINATION", confidence: 0.62 };
  }
  if (isRepeatedWeakness(s)) {
    if (s.section === "MATH") {
      return { category: SETUP_SKILLS.has(s.skill) ? "INCORRECT_SETUP" : "CONCEPT_GAP", confidence: 0.78 };
    }
    if (CONVENTION_SKILLS.has(s.skill)) return { category: "GRAMMAR_RULE", confidence: 0.78 };
    if (VOCAB_SKILLS.has(s.skill)) return { category: "VOCAB_CONTEXT", confidence: 0.75 };
    return { category: "CONCEPT_GAP", confidence: 0.72 };
  }
  if (isOutOfCharacter(s)) {
    return { category: "CARELESS", confidence: 0.65 };
  }
  if (isSlow(s) && s.section === "MATH") {
    // Long time + wrong answer on math is usually a bad setup, not arithmetic:
    // arithmetic slips are fast.
    return { category: "INCORRECT_SETUP", confidence: 0.55 };
  }
  if (s.section === "MATH") {
    if (s.format === "SPR" && !isSlow(s)) {
      return { category: "CALCULATION_ERROR", confidence: 0.5 };
    }
    if (SETUP_SKILLS.has(s.skill)) return { category: "INCORRECT_SETUP", confidence: 0.55 };
    if (s.domain === "Algebra" || s.domain === "Advanced Math") {
      return { category: "ALGEBRA_MISTAKE", confidence: 0.5 };
    }
    return { category: "CONCEPT_GAP", confidence: 0.45 };
  }
  if (CONVENTION_SKILLS.has(s.skill)) return { category: "GRAMMAR_RULE", confidence: 0.6 };
  if (VOCAB_SKILLS.has(s.skill)) return { category: "VOCAB_CONTEXT", confidence: 0.58 };
  if (EVIDENCE_SKILLS.has(s.skill)) return { category: "EVIDENCE_SELECTION", confidence: 0.55 };
  if (s.difficulty === "EASY") return { category: "MISREAD_QUESTION", confidence: 0.5 };
  return { category: "CONCEPT_GAP", confidence: 0.45 };
}

// ---------------------------------------------------------------------------
// Narrative built around the classification. Written to be specific enough to
// act on, and honest that it is inferred rather than certain.
// ---------------------------------------------------------------------------

const LESSONS: Record<MistakeType, string> = {
  CONCEPT_GAP:
    "This one needs the underlying method re-learned, not just re-attempted. Work an example with the steps in front of you before trying it cold.",
  MISREAD_QUESTION:
    "Read the last line of the prompt again before choosing. Most misreads happen because the question asked for something one step away from what you solved.",
  MISREAD_PASSAGE:
    "Find the exact sentence the question depends on and paraphrase it in your own words before you look at the choices.",
  GRAMMAR_RULE:
    "Name the rule out loud before choosing. If you cannot name it, the choice is a guess dressed up as intuition.",
  VOCAB_CONTEXT:
    "Cover the choices, predict your own word from the sentence, then find the closest match. Choosing from the list first is how the trap answers win.",
  EVIDENCE_SELECTION:
    "State the claim in one sentence first. Then ask of each choice: does this actually make that specific claim more likely to be true?",
  ALGEBRA_MISTAKE:
    "Slow the manipulation down by one line. Most algebra slips come from combining two steps in your head.",
  CALCULATION_ERROR:
    "The method was fine; the arithmetic wasn't. Re-check the final computation on any item where the answer isn't clean.",
  INCORRECT_SETUP:
    "Write down what each variable means before writing any equation. Setup errors are expensive because the algebra afterwards is wasted.",
  TIME_PRESSURE:
    "This came late in the section with the clock against you. Practice with a per-question budget so the last items get a fair shot.",
  CARELESS:
    "You can do this type — this was a slip. Slips are worth real points; a single re-read before submitting usually catches them.",
  GUESSED:
    "There was no working basis for this choice. That's fine on test day, but flag it so the underlying skill gets practiced.",
  ELIMINATION:
    "You narrowed it down and then picked wrong. Practice writing the one concrete reason each surviving choice fails.",
  OTHER: "Review the explanation and note in your own words what would have gotten you there.",
};

const NEXT_STEPS: Record<MistakeType, string> = {
  CONCEPT_GAP: "Do a focused set on this skill starting at medium difficulty.",
  MISREAD_QUESTION: "Do a mixed set and underline exactly what each question asks before solving.",
  MISREAD_PASSAGE: "Practice this skill untimed until accuracy is stable, then add the clock back.",
  GRAMMAR_RULE: "Drill this convention specifically — conventions are the fastest points to recover.",
  VOCAB_CONTEXT: "Do a Words in Context set using the predict-then-match method.",
  EVIDENCE_SELECTION: "Do a Command of Evidence set and write the claim before reading the choices.",
  ALGEBRA_MISTAKE: "Redo this problem by hand, writing every line, then do 5 more of the same type.",
  CALCULATION_ERROR: "Re-attempt this question and verify the final arithmetic a second way.",
  INCORRECT_SETUP: "Practice translation-only: write the equation for 10 word problems without solving them.",
  TIME_PRESSURE: "Run a timed set of this section to work on pacing, not content.",
  CARELESS: "Re-attempt this question later from your error log to confirm it was a slip.",
  GUESSED: "Add this skill to your plan and start with easier items to rebuild the method.",
  ELIMINATION: "Practice this skill and write one elimination reason per wrong choice.",
  OTHER: "Re-attempt this question after reviewing the explanation.",
};

function testingSentence(s: MistakeSignals): string {
  const target = s.subskill ? `${s.skill} — specifically ${s.subskill.toLowerCase()}` : s.skill;
  return `${s.domain}: ${target}. This is a ${s.difficulty.toLowerCase()} ${
    s.format === "SPR" ? "student-produced response" : "multiple-choice"
  } item.`;
}

function whyWrongSentence(s: MistakeSignals, category: MistakeType): string {
  if (isBlank(s)) {
    return "You left this blank, so there was no answer to evaluate. There is no penalty for guessing on the SAT — an eliminated-down guess is always better than a blank.";
  }
  const chosen = s.chosenAnswer ?? "";
  const base =
    s.format === "MCQ"
      ? `You chose ${chosen}; the correct answer is ${s.correctAnswer}.`
      : `You entered "${chosen}"; the accepted answer is ${s.correctAnswer}.`;

  const timing = isRushed(s)
    ? ` You spent about ${Math.round(s.timeMs / 1000)}s on an item budgeted at ${s.recommendedSec}s, which is usually too fast to have checked the choice.`
    : isSlow(s)
      ? ` You spent about ${Math.round(s.timeMs / 1000)}s against a ${s.recommendedSec}s budget, so this cost time as well as a point.`
      : "";

  const change =
    s.answerChanges >= 2
      ? ` You also changed your selection ${s.answerChanges} times, which points at two choices you couldn't separate.`
      : "";

  const historical = isRepeatedWeakness(s)
    ? ` This isn't the first miss on ${s.skill} — that pattern is what moves this from "slip" to "gap".`
    : isOutOfCharacter(s)
      ? ` You usually get ${s.skill} right, which is why this reads as a slip rather than a gap.`
      : "";

  const categoryNote =
    category === "ELIMINATION"
      ? " The distractor you chose is the one designed to survive a partial elimination."
      : "";

  return base + timing + change + historical + categoryNote;
}

function similarPractice(s: MistakeSignals): string[] {
  const out = [s.skill];
  if (s.subskill) out.unshift(s.subskill);
  if (s.section === "MATH" && s.domain === "Algebra") out.push("Linear functions in context");
  if (s.section === "MATH" && s.domain === "Advanced Math") out.push("Nonlinear functions");
  if (s.section === "READING_WRITING" && CONVENTION_SKILLS.has(s.skill)) {
    out.push("Sentence boundaries", "Subject-verb agreement");
  }
  if (s.section === "READING_WRITING" && EVIDENCE_SKILLS.has(s.skill)) {
    out.push("Command of evidence", "Main idea and supporting detail");
  }
  return [...new Set(out)].slice(0, 4);
}

/**
 * Full heuristic analysis for a missed question. `explanation` is the official
 * rationale from the bank — it is the ground truth for *why the correct answer
 * is right*, so it is used verbatim (trimmed) rather than paraphrased.
 */
export function analyzeMistake(
  s: MistakeSignals,
  explanation: string | null
): MistakeAnalysis {
  const { category, confidence } = classifyMistake(s);
  const whyCorrect = explanation?.trim()
    ? trimToSentences(explanation.trim(), 3)
    : `Answer ${s.correctAnswer} is the one consistent with every constraint in the question.`;

  return {
    category,
    confidence,
    testing: testingSentence(s),
    whyWrong: whyWrongSentence(s, category),
    whyCorrect,
    lesson: LESSONS[category],
    nextStep: NEXT_STEPS[category],
    similar: similarPractice(s),
  };
}

/**
 * Keep the first N sentences of a long official explanation. Whitespace is
 * normalized because these strings are rendered directly into the review UI.
 */
export function trimToSentences(text: string, count: number): string {
  const parts = text.match(/[^.!?]+[.!?]+/g);
  const kept = parts ? parts.slice(0, count).join(" ") : text.slice(0, 400);
  return kept.replace(/\s+/g, " ").trim();
}
