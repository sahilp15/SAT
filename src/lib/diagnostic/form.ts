// Diagnostic forms.
//
// A *form* is one numbered diagnostic: 20 questions laid out on the shared
// blueprint (see ./blueprint.ts). The app ships many forms so the diagnostic can
// be retaken regularly — two or three a week — with different questions each
// time, while still measuring the same thing the same way.
//
// The concrete question assignments live in ./forms.generated.ts, produced by
// `npm run build:forms` and committed. Generation is deterministic and the test
// suite re-validates every referenced question against the bank, so a re-import
// that damages an item fails CI rather than silently degrading a score estimate.

import {
  BLUEPRINT,
  FORM_COUNT,
  QUESTIONS_PER_SECTION,
  QUESTIONS_PER_STAGE,
  SECTION_ORDER,
  TOTAL_QUESTIONS,
  TRACKS,
  type DiagnosticStage,
  type DiagnosticTrack,
} from "./blueprint";
import { GENERATED_FORMS, RESERVED_EXTERNAL_IDS } from "./forms.generated";
import type { Difficulty, Section } from "../taxonomy";

export {
  BLUEPRINT,
  FORM_COUNT,
  QUESTIONS_PER_SECTION,
  QUESTIONS_PER_STAGE,
  SECTION_ORDER,
  TOTAL_QUESTIONS,
  TRACKS,
};
export type { DiagnosticStage, DiagnosticTrack };

/** One question assignment inside a generated form. */
export interface FormSlot {
  externalId: string;
  skill: string;
  format: "MCQ" | "SPR";
}

export interface SectionForm {
  routing: FormSlot[];
  tracks: Record<DiagnosticTrack, FormSlot[]>;
}

export interface DiagnosticForm {
  /** 1-based, stable, and shown to the student as "Diagnostic 4". */
  id: number;
  math: SectionForm;
  readingWriting: SectionForm;
}

export const FORMS: DiagnosticForm[] = GENERATED_FORMS;

/** Question ids reserved by the diagnostic; used by the seeder. */
export function diagnosticExternalIds(): string[] {
  return RESERVED_EXTERNAL_IDS;
}

export function getForm(formId: number): DiagnosticForm | null {
  return FORMS.find((f) => f.id === formId) ?? null;
}

export function sectionForm(form: DiagnosticForm, section: Section): SectionForm {
  return section === "MATH" ? form.math : form.readingWriting;
}

/** A fully-resolved slot: the question plus where it sits in the blueprint. */
export interface ResolvedSlot extends FormSlot {
  section: Section;
  stage: DiagnosticStage;
  domain: string;
  difficulty: Difficulty;
}

export function routingSlots(form: DiagnosticForm, section: Section): ResolvedSlot[] {
  const bp = BLUEPRINT[section];
  return sectionForm(form, section).routing.map((slot, i) => ({
    ...slot,
    section,
    stage: "ROUTING" as const,
    domain: bp.routing[i].domain,
    difficulty: bp.routing[i].difficulty,
  }));
}

export function trackSlots(
  form: DiagnosticForm,
  section: Section,
  track: DiagnosticTrack
): ResolvedSlot[] {
  const bp = BLUEPRINT[section];
  return sectionForm(form, section).tracks[track].map((slot, i) => ({
    ...slot,
    section,
    stage: "ADAPTIVE" as const,
    domain: bp.tracks[track][i].domain,
    difficulty: bp.tracks[track][i].difficulty,
  }));
}

/** Every slot in a form, across both sections and all tracks. */
export function allSlots(form: DiagnosticForm): ResolvedSlot[] {
  return SECTION_ORDER.flatMap((section) => [
    ...routingSlots(form, section),
    ...TRACKS.flatMap((track) => trackSlots(form, section, track)),
  ]);
}

/** The questions a student actually sees: routing plus one track per section. */
export function slotsForRoute(
  form: DiagnosticForm,
  tracks: Partial<Record<Section, DiagnosticTrack>>
): ResolvedSlot[] {
  return SECTION_ORDER.flatMap((section) => {
    const track = tracks[section];
    return [
      ...routingSlots(form, section),
      ...(track ? trackSlots(form, section, track) : []),
    ];
  });
}
