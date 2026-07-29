import { describe, expect, it } from "vitest";
import { FORM_COUNT } from "./diagnostic/form";
import { STALE_DIAGNOSTIC_DAYS, pickNextAction, untakenFormId } from "./dashboard";

// The dashboard's "next action" is the one instruction a student is most likely
// to follow, so the ordering it encodes matters more than most UI copy.

const BASE = {
  hasDiagnostic: true,
  dueCount: 0,
  today: null,
  questionsToday: 0,
  dailyGoal: 20,
  unresolvedErrors: 0,
  daysRemaining: 60,
  daysSinceDiagnostic: 1,
  nextDiagnosticId: 2,
};

describe("untakenFormId", () => {
  it("returns the first diagnostic when nothing has been taken", () => {
    expect(untakenFormId(new Set())).toBe(1);
  });

  it("skips over the ones already done", () => {
    expect(untakenFormId(new Set([1, 2, 3]))).toBe(4);
  });

  it("ignores gaps in the order they were taken", () => {
    expect(untakenFormId(new Set([1, 5, 9]))).toBe(2);
  });

  it("returns null once every diagnostic is done", () => {
    const all = new Set(Array.from({ length: FORM_COUNT }, (_, i) => i + 1));
    expect(untakenFormId(all)).toBeNull();
  });
});

describe("pickNextAction", () => {
  it("puts the first diagnostic above everything else", () => {
    const action = pickNextAction({
      ...BASE,
      hasDiagnostic: false,
      dueCount: 12,
      daysSinceDiagnostic: null,
      nextDiagnosticId: 1,
    });
    expect(action.href).toBe("/diagnostic");
  });

  it("keeps due reviews ahead of a stale estimate", () => {
    const action = pickNextAction({ ...BASE, dueCount: 5, daysSinceDiagnostic: 30 });
    expect(action.href).toBe("/review/spaced-repetition");
  });

  it("suggests the next diagnostic once the estimate goes stale", () => {
    const action = pickNextAction({ ...BASE, daysSinceDiagnostic: STALE_DIAGNOSTIC_DAYS });
    expect(action.href).toBe("/diagnostic/run?form=2");
    expect(action.label).toBe("Take diagnostic 2");
    expect(action.detail).toContain(`${STALE_DIAGNOSTIC_DAYS} days ago`);
  });

  it("leaves a recent estimate alone", () => {
    const action = pickNextAction({ ...BASE, daysSinceDiagnostic: STALE_DIAGNOSTIC_DAYS - 1 });
    expect(action.href).not.toContain("/diagnostic");
  });

  it("does not nag when every diagnostic has been taken", () => {
    const action = pickNextAction({
      ...BASE,
      daysSinceDiagnostic: 40,
      nextDiagnosticId: null,
    });
    expect(action.href).not.toContain("/diagnostic");
  });

  it("stops suggesting new material the day before the test", () => {
    const action = pickNextAction({ ...BASE, daysRemaining: 1, daysSinceDiagnostic: 30 });
    expect(action.href).toBe("/errors");
  });

  it("prefers today's plan over a fresh diagnostic", () => {
    const action = pickNextAction({
      ...BASE,
      daysSinceDiagnostic: 2,
      today: {
        id: "d1",
        date: new Date(2026, 6, 30),
        kind: "PRACTICE",
        title: "Algebra drill",
        completed: false,
        targetMinutes: 45,
        targetQuestions: 24,
        items: [{ label: "Linear equations · 12 questions", minutes: 20, href: "/practice/math" }],
      },
    });
    expect(action.href).toBe("/practice/math");
  });
});
