import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BLUEPRINT,
  FORMS,
  FORM_COUNT,
  QUESTIONS_PER_SECTION,
  QUESTIONS_PER_STAGE,
  SECTION_ORDER,
  TOTAL_QUESTIONS,
  TRACKS,
  allSlots,
  diagnosticExternalIds,
  getForm,
  routingSlots,
  slotsForRoute,
  trackSlots,
} from "./form";
import { averageDifficulty } from "./blueprint";
import type { Section } from "../taxonomy";

// Every form names specific bank questions by id. If a re-import ever changes
// or damages one of them, this fails here rather than silently degrading
// somebody's score estimate.

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

function loadBank(): Map<string, BankQuestion> {
  const dir = path.resolve(__dirname, "../../../prisma");
  const all: BankQuestion[] = [
    ...(JSON.parse(fs.readFileSync(path.join(dir, "bankMath.json"), "utf-8")) as BankQuestion[]),
    ...(JSON.parse(
      fs.readFileSync(path.join(dir, "bankReadingWriting.json"), "utf-8")
    ) as BankQuestion[]),
  ];
  return new Map(all.map((q) => [q.externalId, q]));
}

const bank = loadBank();

describe("blueprint", () => {
  it("is 20 questions across two sections", () => {
    expect(TOTAL_QUESTIONS).toBe(20);
    expect(QUESTIONS_PER_SECTION).toBe(10);
    expect(QUESTIONS_PER_STAGE).toBe(5);
  });

  it("ramps difficulty across the routing stage", () => {
    const rank = { EASY: 0, MEDIUM: 1, HARD: 2 } as const;
    for (const section of SECTION_ORDER) {
      const levels = BLUEPRINT[section].routing.map((s) => rank[s.difficulty]);
      for (let i = 1; i < levels.length; i += 1) {
        expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
      }
      expect(levels.at(-1)).toBe(rank.HARD);
    }
  });

  it("orders the three tracks strictly by difficulty", () => {
    for (const section of SECTION_ORDER) {
      const t = BLUEPRINT[section].tracks;
      expect(averageDifficulty(t.EASY)).toBeLessThan(averageDifficulty(t.MEDIUM));
      expect(averageDifficulty(t.MEDIUM)).toBeLessThan(averageDifficulty(t.HARD));
    }
  });

  it("covers all four content domains in every routing stage", () => {
    for (const section of SECTION_ORDER) {
      expect(new Set(BLUEPRINT[section].routing.map((s) => s.domain)).size).toBe(4);
    }
  });

  it("gives every stage exactly five slots", () => {
    for (const section of SECTION_ORDER) {
      expect(BLUEPRINT[section].routing).toHaveLength(QUESTIONS_PER_STAGE);
      for (const track of TRACKS) {
        expect(BLUEPRINT[section].tracks[track]).toHaveLength(QUESTIONS_PER_STAGE);
      }
    }
  });
});

describe("form set", () => {
  it(`ships ${FORM_COUNT} forms with sequential ids`, () => {
    expect(FORMS).toHaveLength(FORM_COUNT);
    expect(FORMS.map((f) => f.id)).toEqual(
      Array.from({ length: FORM_COUNT }, (_, i) => i + 1)
    );
  });

  it("resolves forms by id and rejects unknown ones", () => {
    expect(getForm(1)?.id).toBe(1);
    expect(getForm(FORM_COUNT)?.id).toBe(FORM_COUNT);
    expect(getForm(0)).toBeNull();
    expect(getForm(FORM_COUNT + 1)).toBeNull();
  });

  it("gives every form 40 slots matching the blueprint", () => {
    for (const form of FORMS) {
      const slots = allSlots(form);
      // 20 scored positions, but 3 alternative tracks per section = 40 assignments.
      expect(slots).toHaveLength(40);
      for (const section of SECTION_ORDER) {
        expect(routingSlots(form, section)).toHaveLength(QUESTIONS_PER_STAGE);
        for (const track of TRACKS) {
          expect(trackSlots(form, section, track)).toHaveLength(QUESTIONS_PER_STAGE);
        }
      }
    }
  });

  it("never repeats a question within a single form", () => {
    for (const form of FORMS) {
      const ids = allSlots(form).map((s) => s.externalId);
      expect(new Set(ids).size, `form ${form.id} repeats a question`).toBe(ids.length);
    }
  });

  it("shows exactly 20 questions on any single route through a form", () => {
    for (const form of FORMS) {
      for (const mathTrack of TRACKS) {
        for (const rwTrack of TRACKS) {
          const seen = slotsForRoute(form, { MATH: mathTrack, READING_WRITING: rwTrack });
          expect(seen).toHaveLength(TOTAL_QUESTIONS);
          expect(new Set(seen.map((s) => s.externalId)).size).toBe(TOTAL_QUESTIONS);
        }
      }
    }
  });

  it("keeps every Reading & Writing form disjoint from every other", () => {
    const seen = new Set<string>();
    for (const form of FORMS) {
      for (const slot of allSlots(form)) {
        if (slot.section !== "READING_WRITING") continue;
        expect(seen.has(slot.externalId), `${slot.externalId} reused across R&W forms`).toBe(false);
        seen.add(slot.externalId);
      }
    }
  });

  it("spaces any reused Math question at least three forms apart", () => {
    // The Math pool is smaller than 18 disjoint forms require, so reuse is
    // expected — but it must be spread, never back-to-back.
    const lastSeen = new Map<string, number>();
    let closest = Number.POSITIVE_INFINITY;
    FORMS.forEach((form, index) => {
      for (const slot of allSlots(form)) {
        if (slot.section !== "MATH") continue;
        const prev = lastSeen.get(slot.externalId);
        if (prev !== undefined) closest = Math.min(closest, index - prev);
        lastSeen.set(slot.externalId, index);
      }
    });
    expect(closest).toBeGreaterThanOrEqual(3);
  });

  it("matches each slot to its blueprint domain and difficulty", () => {
    for (const form of FORMS) {
      for (const section of SECTION_ORDER) {
        const bp = BLUEPRINT[section];
        routingSlots(form, section).forEach((slot, i) => {
          const q = bank.get(slot.externalId);
          expect(q?.domain).toBe(bp.routing[i].domain);
          expect(q?.difficulty).toBe(bp.routing[i].difficulty);
          expect(q?.section).toBe(section);
        });
        for (const track of TRACKS) {
          trackSlots(form, section, track).forEach((slot, i) => {
            const q = bank.get(slot.externalId);
            expect(q?.domain).toBe(bp.tracks[track][i].domain);
            expect(q?.difficulty).toBe(bp.tracks[track][i].difficulty);
            expect(q?.section).toBe(section);
          });
        }
      }
    }
  });

  it("reserves every referenced id exactly once in the seed list", () => {
    const reserved = diagnosticExternalIds();
    expect(new Set(reserved).size).toBe(reserved.length);

    const referenced = new Set<string>();
    for (const form of FORMS) for (const s of allSlots(form)) referenced.add(s.externalId);
    expect(new Set(reserved)).toEqual(referenced);
  });
});

describe("every referenced question is present and well formed", () => {
  const unique = [...new Set(FORMS.flatMap((f) => allSlots(f).map((s) => s.externalId)))];

  it("references only questions that exist in the bank", () => {
    const missing = unique.filter((id) => !bank.has(id));
    expect(missing, `missing from bank: ${missing.slice(0, 5).join(", ")}`).toHaveLength(0);
  });

  it("uses only reviewed questions with complete explanations", () => {
    for (const id of unique) {
      const q = bank.get(id);
      if (!q) continue;
      expect(q.reviewStatus ?? "OK", id).toBe("OK");
      expect(q.explanation.trim().length, id).toBeGreaterThan(100);
      expect(q.stem.trim().length, id).toBeGreaterThan(30);
    }
  });

  it("gives every multiple-choice item four distinct choices and one answer", () => {
    for (const id of unique) {
      const q = bank.get(id);
      if (!q || q.format !== "MCQ") continue;
      expect(q.choices, id).toHaveLength(4);
      expect(q.choices.map((c) => c.label).sort(), id).toEqual(["A", "B", "C", "D"]);
      expect(["A", "B", "C", "D"], id).toContain(q.correctAnswer);
      const contents = q.choices.map((c) => c.content.trim());
      expect(contents.every((c) => c.length > 0), id).toBe(true);
      expect(new Set(contents).size, id).toBe(4);
    }
  });

  it("gives every student-produced item a numeric answer", () => {
    for (const id of unique) {
      const q = bank.get(id);
      if (!q || q.format !== "SPR") continue;
      expect(q.correctAnswer.trim(), id).toMatch(/^-?[\d./,\s]+$/);
    }
  });

  it("never depends on a figure the app cannot render", () => {
    const figure = /\b(shown|graphed|scatterplot|histogram|the figure|the diagram|number line)\b/i;
    for (const id of unique) {
      const q = bank.get(id);
      if (!q) continue;
      expect(figure.test(q.stem), `${id} depends on a figure`).toBe(false);
    }
  });

  // Mirrors the quality filter in scripts/build-diagnostic-forms.ts. Two rules
  // there are narrower than a naive whole-string scan, and this has to match or
  // it fails clean items the generator correctly admitted:
  //   - intra-expression damage is checked per line, because a displayed system
  //     of equations puts a newline between "= 19" and "5x - 4y", which \s
  //     matches;
  //   - an all-digit line means a stray exponent only in a STEM. An answer
  //     choice is very often just a number.
  it("never carries PDF-extraction damage in a Math item", () => {
    const damage = [/[a-zA-Z]\d/, /\d\s+\d/, /[+\-*/(]\s*=/];
    for (const id of unique) {
      const q = bank.get(id);
      if (!q || q.section !== "MATH") continue;
      const texts = [q.stem, ...q.choices.map((c) => c.content)];
      const lines = texts.flatMap((t) => t.split("\n"));
      for (const pattern of damage) {
        expect(lines.some((l) => pattern.test(l)), `${id} matches ${pattern}`).toBe(false);
      }
      expect(/^\s*\d+\s*$/m.test(q.stem), `${id} has an orphaned number line`).toBe(false);
    }
  });
});

describe("slotsForRoute", () => {
  const form = FORMS[0];

  it("returns routing only when no track has been decided", () => {
    expect(slotsForRoute(form, {})).toHaveLength(QUESTIONS_PER_STAGE * SECTION_ORDER.length);
  });

  it("adds the chosen track for each section independently", () => {
    const mathOnly = slotsForRoute(form, { MATH: "HARD" });
    expect(mathOnly).toHaveLength(QUESTIONS_PER_STAGE * 3);
    expect(mathOnly.filter((s) => s.section === ("MATH" as Section))).toHaveLength(10);
  });
});
