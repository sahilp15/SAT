// The diagnostic blueprint.
//
// Every diagnostic form — there are many, so they can be taken repeatedly —
// shares one blueprint: the same 20 slots, each fixed to a content domain, a
// difficulty, and a stage. Only the concrete questions filling those slots
// differ between forms.
//
// That is what makes repeated attempts comparable. The score model reads
// difficulty, domain, and stage; it never reads question identity. Two forms
// built on this blueprint therefore measure the same thing, the same way, which
// is exactly how real test forms work.
//
// Slot order matters. The routing stage ramps EASY -> MEDIUM -> MEDIUM -> HARD
// -> HARD so a student still meets an accessible question first, and the three
// adaptive tracks are strictly ordered by average difficulty.
//
// DIFFICULTY LEVEL OF THIS BLUEPRINT
// ----------------------------------
// The mix was raised across routing and the EASY/MEDIUM tracks so the
// instrument measures where the current exam actually discriminates. Mean slot
// difficulty (EASY=0, MEDIUM=1, HARD=2), before -> after:
//
//               routing   EASY track   MEDIUM track   HARD track
//   Math          0.8 -> 1.2   0.6 -> 0.8    1.2 -> 1.4    2.0 (unchanged)
//   R&W           0.8 -> 1.2   0.2 -> 0.8    1.2 -> 1.4    2.0 (unchanged)
//
// Two things this deliberately does NOT do. The HARD track is already every
// slot at the top of the three-level taxonomy, so it cannot be raised further
// without a fourth difficulty tier — that is the ceiling of this scale, not an
// oversight. And the EASY track keeps two EASY anchors: students routed there
// are the ones whose foundations are in question, and a track they get entirely
// wrong yields no information about *which* fundamentals are missing.
//
// R&W's EASY track moved the most (0.2 -> 0.8) because it was also the most out
// of step with Math's, which made the two sections' foundations tracks measure
// at noticeably different difficulties. They now match.
//
// Raising routing changes what a given weighted ratio implies about ability, so
// the track thresholds in routing.ts were re-derived against this blueprint.
// Change one and you must re-derive the other; routing.test.ts pins the
// resulting boundaries.

import type { Difficulty, Section } from "../taxonomy";

export type DiagnosticStage = "ROUTING" | "ADAPTIVE";
export type DiagnosticTrack = "EASY" | "MEDIUM" | "HARD";

export const TRACKS: DiagnosticTrack[] = ["EASY", "MEDIUM", "HARD"];

/** One position in a form: what kind of question belongs here. */
export interface BlueprintSlot {
  domain: string;
  difficulty: Difficulty;
}

export interface SectionBlueprint {
  routing: BlueprintSlot[];
  tracks: Record<DiagnosticTrack, BlueprintSlot[]>;
}

const ALGEBRA = "Algebra";
const ADVANCED = "Advanced Math";
const PSDA = "Problem-Solving and Data Analysis";
const GEOMETRY = "Geometry and Trigonometry";

const INFO = "Information and Ideas";
const CRAFT = "Craft and Structure";
const EXPRESSION = "Expression of Ideas";
const CONVENTIONS = "Standard English Conventions";

const s = (domain: string, difficulty: Difficulty): BlueprintSlot => ({ domain, difficulty });

/**
 * Math. Slot mix is tuned to the clean Math pool: Algebra and Advanced Math
 * carry ~70% of the real Math section anyway, and they are also where the bank
 * is deepest, so leaning on them both matches the blueprint and maximizes how
 * far apart a question can be reused across forms.
 */
const MATH_BLUEPRINT: SectionBlueprint = {
  routing: [
    s(ALGEBRA, "EASY"),
    s(ADVANCED, "MEDIUM"),
    s(ALGEBRA, "MEDIUM"),
    s(GEOMETRY, "HARD"),
    s(PSDA, "HARD"),
  ],
  tracks: {
    EASY: [
      s(ALGEBRA, "EASY"),
      s(ADVANCED, "EASY"),
      s(ALGEBRA, "MEDIUM"),
      s(GEOMETRY, "MEDIUM"),
      s(ALGEBRA, "HARD"),
    ],
    MEDIUM: [
      s(ALGEBRA, "MEDIUM"),
      s(ADVANCED, "MEDIUM"),
      s(GEOMETRY, "MEDIUM"),
      s(ADVANCED, "HARD"),
      s(ALGEBRA, "HARD"),
    ],
    HARD: [
      s(ALGEBRA, "HARD"),
      s(ADVANCED, "HARD"),
      s(GEOMETRY, "HARD"),
      s(PSDA, "HARD"),
      s(ADVANCED, "HARD"),
    ],
  },
};

/** Reading & Writing. The pool is deep enough that every form is disjoint. */
const RW_BLUEPRINT: SectionBlueprint = {
  routing: [
    s(CRAFT, "EASY"),
    s(INFO, "MEDIUM"),
    s(CONVENTIONS, "MEDIUM"),
    s(EXPRESSION, "HARD"),
    s(INFO, "HARD"),
  ],
  tracks: {
    EASY: [
      s(CRAFT, "EASY"),
      s(CONVENTIONS, "EASY"),
      s(INFO, "MEDIUM"),
      s(EXPRESSION, "MEDIUM"),
      s(CRAFT, "HARD"),
    ],
    MEDIUM: [
      s(CONVENTIONS, "MEDIUM"),
      s(INFO, "MEDIUM"),
      s(EXPRESSION, "MEDIUM"),
      s(CRAFT, "HARD"),
      s(CONVENTIONS, "HARD"),
    ],
    HARD: [
      s(INFO, "HARD"),
      s(CONVENTIONS, "HARD"),
      s(EXPRESSION, "HARD"),
      s(CRAFT, "HARD"),
      s(INFO, "HARD"),
    ],
  },
};

export const BLUEPRINT: Record<Section, SectionBlueprint> = {
  MATH: MATH_BLUEPRINT,
  READING_WRITING: RW_BLUEPRINT,
};

/** Math first: the harder pacing is met while the student is freshest. */
export const SECTION_ORDER: Section[] = ["MATH", "READING_WRITING"];

export const QUESTIONS_PER_STAGE = 5;
export const QUESTIONS_PER_SECTION = QUESTIONS_PER_STAGE * 2;
export const TOTAL_QUESTIONS = QUESTIONS_PER_SECTION * SECTION_ORDER.length;

/** How many numbered diagnostics the app ships. */
export const FORM_COUNT = 18;

/** Every (section, stage, track, slot) position, in presentation order. */
export interface BlueprintPosition extends BlueprintSlot {
  section: Section;
  stage: DiagnosticStage;
  /** null for routing slots, which every student sees. */
  track: DiagnosticTrack | null;
  indexInStage: number;
}

export function blueprintPositions(): BlueprintPosition[] {
  const out: BlueprintPosition[] = [];
  for (const section of SECTION_ORDER) {
    const bp = BLUEPRINT[section];
    bp.routing.forEach((slot, i) =>
      out.push({ ...slot, section, stage: "ROUTING", track: null, indexInStage: i })
    );
    for (const track of TRACKS) {
      bp.tracks[track].forEach((slot, i) =>
        out.push({ ...slot, section, stage: "ADAPTIVE", track, indexInStage: i })
      );
    }
  }
  return out;
}

const DIFFICULTY_RANK: Record<Difficulty, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };

/** Mean difficulty of a stage, used to assert the tracks are strictly ordered. */
export function averageDifficulty(slots: BlueprintSlot[]): number {
  if (!slots.length) return 0;
  return slots.reduce((sum, slot) => sum + DIFFICULTY_RANK[slot.difficulty], 0) / slots.length;
}
