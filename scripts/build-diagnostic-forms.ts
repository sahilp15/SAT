// Generates src/lib/diagnostic/forms.generated.ts.
//
// Run with: npm run build:forms
//
// WHY GENERATE RATHER THAN RESOLVE AT RUNTIME
// -------------------------------------------
// A score estimate is only comparable across attempts if the instrument is
// stable. Picking questions live would make two runs of "Diagnostic 4" different
// tests. So form composition is decided once, committed, and reviewed — the same
// reason the original single form was hand-curated.
//
// HOW QUESTIONS ARE ASSIGNED
// --------------------------
// For each (section, domain, difficulty) cell the eligible questions are sorted
// deterministically and dealt round-robin across forms. A cell with 11 eligible
// questions consumed 3 times per form cycles every ~4 forms; a cell with more
// supply than the run needs never repeats at all. Within a single form a
// question can never appear twice — that is asserted here and re-asserted by the
// test suite.
//
// Reading & Writing has enough clean questions that no form shares any item with
// any other. Math does not, so Math cycles with the widest spacing the pool
// allows. The exact numbers are printed on every run and written into the
// generated file's header.

import fs from "node:fs";
import path from "node:path";
import {
  BLUEPRINT,
  FORM_COUNT,
  QUESTIONS_PER_STAGE,
  SECTION_ORDER,
  TRACKS,
  type BlueprintSlot,
  type DiagnosticTrack,
} from "../src/lib/diagnostic/blueprint";
import type { Difficulty, Section } from "../src/lib/taxonomy";

interface BankQuestion {
  externalId: string;
  section: string;
  domain: string;
  skill: string;
  difficulty: string;
  format: string;
  stem: string;
  correctAnswer: string;
  explanation: string;
  choices: { label: string; content: string }[];
  reviewStatus?: string;
}

const PRISMA_DIR = path.resolve(__dirname, "../prisma");
const OUT_FILE = path.resolve(__dirname, "../src/lib/diagnostic/forms.generated.ts");

// ---------------------------------------------------------------------------
// Quality filter
// ---------------------------------------------------------------------------
// A question entering a *scored* assessment has to clear a higher bar than one
// entering practice. Practice can survive a slightly mangled item; a score
// estimate cannot. These rules reject two things: questions that depend on a
// figure the app cannot render, and questions whose notation was damaged when
// the source PDF was text-extracted.

const FIGURE_REF =
  /\b(shown|graphed|scatterplot|histogram|the figure|the diagram|number line)\b/i;

/** Signatures of PDF-extraction damage, checked against math text only. */
function hasExtractionDamage(text: string): boolean {
  // "x2" where an exponent was dropped, "6 7" where a fraction bar vanished,
  // "c s(Q)" where "cos(Q)" lost letters, a stray exponent on its own line.
  if (/[a-zA-Z]\d/.test(text)) return true;
  if (/\d\s+\d/.test(text)) return true;
  if (/\d\s+[a-z](?![a-z])/.test(text)) return true;
  if (/[+\-*/(]\s*=|=\s*[)*/+]/.test(text)) return true;
  if (/\b[a-z]\s+[a-z]?\s*\(/.test(text)) return true;
  if (/^\s*\d+\s*$/m.test(text)) return true;
  if (text.includes("  ")) return true;
  if ((text.match(/\(/g) ?? []).length !== (text.match(/\)/g) ?? []).length) return true;
  return false;
}

function isEligible(q: BankQuestion): boolean {
  const stem = q.stem;
  if (!(stem.length >= 40 && stem.length <= 1500)) return false;
  if (FIGURE_REF.test(stem)) return false;
  if ((q.reviewStatus ?? "OK") !== "OK") return false;
  if ((q.explanation ?? "").length < 120) return false;
  if (stem.includes("�")) return false;

  const texts = [stem];
  if (q.format === "MCQ") {
    const ch = q.choices ?? [];
    if (ch.length !== 4) return false;
    if (ch.map((c) => c.label).sort().join("") !== "ABCD") return false;
    if (!["A", "B", "C", "D"].includes(q.correctAnswer)) return false;
    if (ch.some((c) => !c.content.trim() || c.content.length > 320)) return false;
    // Distractors must be distinct, or there isn't one defensible answer.
    if (new Set(ch.map((c) => c.content.trim())).size !== 4) return false;
    texts.push(...ch.map((c) => c.content));
  } else {
    if (!/^-?[\d./,\s]+$/.test(q.correctAnswer.trim())) return false;
  }

  if (q.section === "MATH" && texts.some(hasExtractionDamage)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Assignment
// ---------------------------------------------------------------------------

function cellKey(section: string, slot: BlueprintSlot): string {
  return `${section}::${slot.domain}::${slot.difficulty}`;
}

interface GeneratedSlot {
  externalId: string;
  skill: string;
  format: "MCQ" | "SPR";
}

interface GeneratedSectionForm {
  routing: GeneratedSlot[];
  tracks: Record<DiagnosticTrack, GeneratedSlot[]>;
}

type GeneratedForm = Record<Section, GeneratedSectionForm>;

function main() {
  const bank: BankQuestion[] = [
    ...(JSON.parse(
      fs.readFileSync(path.join(PRISMA_DIR, "bankMath.json"), "utf-8")
    ) as BankQuestion[]),
    ...(JSON.parse(
      fs.readFileSync(path.join(PRISMA_DIR, "bankReadingWriting.json"), "utf-8")
    ) as BankQuestion[]),
  ];

  const eligible = bank.filter(isEligible);
  console.log(
    `Eligible: ${eligible.filter((q) => q.section === "MATH").length} Math, ` +
      `${eligible.filter((q) => q.section === "READING_WRITING").length} R&W ` +
      `(of ${bank.length} total)`
  );

  // Deterministic ordering: sort by externalId so regenerating without a bank
  // change produces a byte-identical file.
  const cells = new Map<string, BankQuestion[]>();
  for (const q of eligible) {
    const key = cellKey(q.section, {
      domain: q.domain,
      difficulty: q.difficulty as Difficulty,
    });
    const list = cells.get(key) ?? [];
    list.push(q);
    cells.set(key, list);
  }
  for (const list of cells.values()) list.sort((a, b) => a.externalId.localeCompare(b.externalId));

  // A per-cell cursor deals questions round-robin and wraps when exhausted.
  const cursors = new Map<string, number>();
  const usageCount = new Map<string, number>();
  const lastFormUsed = new Map<string, number>();
  let minSpacing = Number.POSITIVE_INFINITY;
  let minSpacingCell = "";

  function take(section: string, slot: BlueprintSlot, formIndex: number, used: Set<string>) {
    const key = cellKey(section, slot);
    const pool = cells.get(key);
    if (!pool || pool.length === 0) {
      throw new Error(`No eligible questions for ${key}. Re-check the blueprint or the filter.`);
    }

    // Walk forward from the cursor to the first question not already used by
    // THIS form. Within a form, a repeat is never acceptable.
    let cursor = cursors.get(key) ?? 0;
    let chosen: BankQuestion | null = null;
    for (let i = 0; i < pool.length; i += 1) {
      const candidate = pool[(cursor + i) % pool.length];
      if (!used.has(candidate.externalId)) {
        chosen = candidate;
        cursor = (cursor + i + 1) % pool.length;
        break;
      }
    }
    if (!chosen) {
      throw new Error(
        `Cell ${key} has only ${pool.length} questions but one form needs more. Widen the blueprint.`
      );
    }
    cursors.set(key, cursor);
    used.add(chosen.externalId);

    usageCount.set(chosen.externalId, (usageCount.get(chosen.externalId) ?? 0) + 1);
    const previous = lastFormUsed.get(chosen.externalId);
    if (previous !== undefined) {
      const gap = formIndex - previous;
      if (gap < minSpacing) {
        minSpacing = gap;
        minSpacingCell = key;
      }
    }
    lastFormUsed.set(chosen.externalId, formIndex);

    return {
      externalId: chosen.externalId,
      skill: chosen.skill,
      format: chosen.format as "MCQ" | "SPR",
    };
  }

  const forms: GeneratedForm[] = [];
  for (let f = 0; f < FORM_COUNT; f += 1) {
    const used = new Set<string>();
    const form = {} as GeneratedForm;
    for (const section of SECTION_ORDER) {
      const bp = BLUEPRINT[section];
      const sectionForm: GeneratedSectionForm = {
        routing: bp.routing.map((slot) => take(section, slot, f, used)),
        tracks: {} as Record<DiagnosticTrack, GeneratedSlot[]>,
      };
      for (const track of TRACKS) {
        sectionForm.tracks[track] = bp.tracks[track].map((slot) => take(section, slot, f, used));
      }
      form[section] = sectionForm;
    }
    forms.push(form);
  }

  // --- Reuse report ------------------------------------------------------
  const reuseBySection: Record<string, { distinct: number; slots: number; maxUses: number }> = {};
  for (const section of SECTION_ORDER) {
    const ids = new Set<string>();
    let slots = 0;
    let maxUses = 0;
    for (const form of forms) {
      const sf = form[section];
      const all = [...sf.routing, ...TRACKS.flatMap((t) => sf.tracks[t])];
      slots += all.length;
      for (const slot of all) {
        ids.add(slot.externalId);
        maxUses = Math.max(maxUses, usageCount.get(slot.externalId) ?? 0);
      }
    }
    reuseBySection[section] = { distinct: ids.size, slots, maxUses };
  }

  console.log(`\nGenerated ${FORM_COUNT} forms:`);
  for (const [section, r] of Object.entries(reuseBySection)) {
    const disjoint = r.distinct === r.slots;
    console.log(
      `  ${section.padEnd(16)} ${r.slots} slots from ${r.distinct} distinct questions` +
        (disjoint ? "  (fully disjoint)" : `  (max ${r.maxUses} uses per question)`)
    );
  }
  console.log(
    `  Closest reuse across all slots: ${minSpacing === Number.POSITIVE_INFINITY ? "never" : `${minSpacing} forms apart (${minSpacingCell})`}`
  );

  // The number above is worst-case across every slot, including tracks a given
  // student never routes into. What a student actually experiences is routing
  // plus one track per section, so compute that separately — it is the honest
  // figure to report in the UI.
  const experienced = experiencedSpacing(forms);
  console.log("  Closest reuse a student actually sees:");
  for (const [track, gap] of Object.entries(experienced)) {
    console.log(
      `    routing + ${track.padEnd(6)} track: ${gap === Number.POSITIVE_INFINITY ? "never repeats" : `${gap} forms apart`}`
    );
  }

  /**
   * Minimum gap, in forms, between two sightings of the same question for a
   * student who routes into the same track every time. This is the figure that
   * matters: nobody sees all three tracks of a form.
   */
  function experiencedSpacing(all: GeneratedForm[]): Record<DiagnosticTrack, number> {
    const out = {} as Record<DiagnosticTrack, number>;
    for (const track of TRACKS) {
      const seenAt = new Map<string, number>();
      let min = Number.POSITIVE_INFINITY;
      all.forEach((form, i) => {
        for (const section of SECTION_ORDER) {
          const sf = form[section];
          for (const slot of [...sf.routing, ...sf.tracks[track]]) {
            const prev = seenAt.get(slot.externalId);
            if (prev !== undefined) min = Math.min(min, i - prev);
            seenAt.set(slot.externalId, i);
          }
        }
      });
      out[track] = min;
    }
    return out;
  }

  const allIds = new Set<string>();
  for (const form of forms) {
    for (const section of SECTION_ORDER) {
      const sf = form[section];
      for (const slot of [...sf.routing, ...TRACKS.flatMap((t) => sf.tracks[t])]) {
        allIds.add(slot.externalId);
      }
    }
  }

  const header = `// GENERATED FILE — do not edit by hand.
// Regenerate with: npm run build:forms
//
// ${FORM_COUNT} diagnostic forms built on the shared blueprint in ./blueprint.ts.
// Every form has the same 20 slots (domain, difficulty, stage), so scores from
// different forms are directly comparable; only the questions differ.
//
// Composition of this run:
${Object.entries(reuseBySection)
  .map(([section, r]) => {
    const disjoint = r.distinct === r.slots;
    return `//   ${section}: ${r.slots} slots drawn from ${r.distinct} distinct questions${
      disjoint ? " — no form shares a question with any other" : `, each used at most ${r.maxUses}x`
    }`;
  })
  .join("\n")}
//   Closest reuse of any single question, across all slots: ${
    minSpacing === Number.POSITIVE_INFINITY ? "never reused" : `${minSpacing} forms apart`
  }
//   Closest reuse a student actually sees (routing + one track):
${TRACKS.map(
  (t) =>
    `//     ${t} track: ${
      experienced[t] === Number.POSITIVE_INFINITY ? "never repeats" : `${experienced[t]} forms apart`
    }`
).join("\n")}
//   ${allIds.size} distinct questions are reserved across all forms.
//
// A question never appears twice within one form. Reading & Writing has enough
// clean questions for full disjointness; the Math pool does not, so Math cycles
// with the widest spacing available. Seeing a Math question again several weeks
// later is a retention check, not a leak.

import type { DiagnosticForm } from "./form";

export const GENERATED_FORMS: DiagnosticForm[] = ${JSON.stringify(
    forms.map((form, i) => ({
      id: i + 1,
      math: form.MATH,
      readingWriting: form.READING_WRITING,
    })),
    null,
    2
  )};

/** Every external id referenced by any form — used by the seeder. */
export const RESERVED_EXTERNAL_IDS: string[] = ${JSON.stringify([...allIds].sort(), null, 2)};
`;

  fs.writeFileSync(OUT_FILE, header);
  console.log(`\nWrote ${OUT_FILE}`);
}

main();
