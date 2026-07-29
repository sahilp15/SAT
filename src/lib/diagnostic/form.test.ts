import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DIAGNOSTIC_FORM,
  QUESTIONS_PER_SECTION,
  QUESTIONS_PER_STAGE,
  SECTION_ORDER,
  TOTAL_QUESTIONS,
  allDiagnosticSlots,
  diagnosticExternalIds,
} from "./form";

// The diagnostic form names specific bank questions by id. If a re-import ever
// changes or damages one of them, this fails here rather than silently degrading
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
const slots = allDiagnosticSlots();

describe("diagnostic form shape", () => {
  it("has 20 scored questions across two sections", () => {
    expect(TOTAL_QUESTIONS).toBe(20);
    expect(QUESTIONS_PER_SECTION).toBe(10);
    expect(QUESTIONS_PER_STAGE).toBe(5);
  });

  it("defines a routing stage and three tracks for every section", () => {
    for (const section of SECTION_ORDER) {
      const form = DIAGNOSTIC_FORM[section];
      expect(form.routing).toHaveLength(QUESTIONS_PER_STAGE);
      for (const track of ["EASY", "MEDIUM", "HARD"] as const) {
        expect(form.tracks[track]).toHaveLength(QUESTIONS_PER_STAGE);
      }
    }
  });

  it("never reuses a question anywhere in the form", () => {
    const ids = diagnosticExternalIds();
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(40);
  });

  it("covers all four content domains in every stage", () => {
    for (const section of SECTION_ORDER) {
      const form = DIAGNOSTIC_FORM[section];
      const stages = [form.routing, form.tracks.EASY, form.tracks.MEDIUM, form.tracks.HARD];
      for (const stage of stages) {
        expect(new Set(stage.map((s) => s.domain)).size).toBe(4);
      }
    }
  });

  it("ramps difficulty across the routing stage", () => {
    const rank = { EASY: 0, MEDIUM: 1, HARD: 2 } as const;
    for (const section of SECTION_ORDER) {
      const levels = DIAGNOSTIC_FORM[section].routing.map((s) => rank[s.difficulty]);
      // Non-decreasing: the routing stage must get harder, never easier.
      for (let i = 1; i < levels.length; i += 1) {
        expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
      }
      expect(levels[levels.length - 1]).toBe(rank.HARD);
    }
  });

  it("makes the hard track harder than the easy track", () => {
    const weight = { EASY: 0, MEDIUM: 1, HARD: 2 } as const;
    const avg = (list: { difficulty: keyof typeof weight }[]) =>
      list.reduce((s, x) => s + weight[x.difficulty], 0) / list.length;
    for (const section of SECTION_ORDER) {
      const t = DIAGNOSTIC_FORM[section].tracks;
      expect(avg(t.HARD)).toBeGreaterThan(avg(t.MEDIUM));
      expect(avg(t.MEDIUM)).toBeGreaterThan(avg(t.EASY));
    }
  });
});

describe("every referenced question exists and is well formed", () => {
  it.each(slots.map((s) => [s.externalId, s] as const))(
    "%s is present and valid",
    (externalId, slot) => {
      const q = bank.get(externalId);
      expect(q, `${externalId} is missing from the question bank`).toBeDefined();
      if (!q) return;

      // Metadata in the form must match the bank, or the breakdown lies.
      expect(q.section).toBe(slot.section);
      expect(q.domain).toBe(slot.domain);
      expect(q.skill).toBe(slot.skill);
      expect(q.difficulty).toBe(slot.difficulty);
      expect(q.format).toBe(slot.format);

      expect(q.reviewStatus ?? "OK").toBe("OK");
      expect(q.stem.trim().length).toBeGreaterThan(30);
      expect(q.explanation.trim().length).toBeGreaterThan(100);

      if (q.format === "MCQ") {
        expect(q.choices).toHaveLength(4);
        expect(q.choices.map((c) => c.label).sort()).toEqual(["A", "B", "C", "D"]);
        // Exactly one correct answer, and it must be one of the labels.
        expect(["A", "B", "C", "D"]).toContain(q.correctAnswer);
        // Distractors must be distinct and non-empty to be plausible.
        const contents = q.choices.map((c) => c.content.trim());
        expect(contents.every((c) => c.length > 0)).toBe(true);
        expect(new Set(contents).size).toBe(4);
      } else {
        // Student-produced responses must be numeric (possibly a fraction list).
        expect(q.correctAnswer.trim()).toMatch(/^-?[\d./,\s]+$/);
      }
    }
  );

  it("keeps every diagnostic question free of unrenderable figure references", () => {
    const figure = /\b(shown|graphed|scatterplot|histogram|the figure|the diagram)\b/i;
    for (const slot of slots) {
      const q = bank.get(slot.externalId);
      if (!q) continue;
      expect(figure.test(q.stem), `${slot.externalId} depends on a figure`).toBe(false);
    }
  });
});
