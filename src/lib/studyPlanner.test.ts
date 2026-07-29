import { describe, expect, it } from "vitest";
import { determinePhase, generateStudyPlan, practiceHref, type PlannerInput } from "./studyPlanner";
import type { Recommendation } from "./recommendations";

const RECS: Recommendation[] = [
  {
    section: "MATH",
    domain: "Algebra",
    skill: "Linear equations in two variables",
    subskill: "Slope interpretation in context",
    priority: 1,
    priorityLabel: "CRITICAL",
    reason: "Biggest gap.",
    signal: "CONCEPT_GAP",
    currentMastery: 0.3,
    targetMastery: 0.92,
    recommendedQuestions: 15,
    estimatedMinutes: 35,
    recommendedDifficulty: "EASY",
    impactScore: 0.12,
  },
  {
    section: "READING_WRITING",
    domain: "Standard English Conventions",
    skill: "Boundaries",
    subskill: null,
    priority: 2,
    priorityLabel: "HIGH",
    reason: "Convention gap.",
    signal: "GRAMMAR" as never,
    currentMastery: 0.5,
    targetMastery: 0.92,
    recommendedQuestions: 12,
    estimatedMinutes: 27,
    recommendedDifficulty: "MEDIUM",
    impactScore: 0.08,
  },
];

// The scenario this whole app was built for.
const NOW = new Date(2026, 6, 29); // 29 July 2026, local
const TEST_DATE = new Date(2026, 7, 22); // 22 August 2026

function input(overrides: Partial<PlannerInput> = {}): PlannerInput {
  return {
    now: NOW,
    testDate: TEST_DATE,
    availableDays: ["Mon", "Tue", "Wed", "Thu", "Sat"],
    minutesPerDay: 60,
    daysPerWeek: 5,
    recommendations: RECS,
    hasDiagnostic: true,
    predictedTotal: 1380,
    targetScore: 1600,
    ...overrides,
  };
}

describe("determinePhase", () => {
  it("demands a diagnostic first", () => {
    expect(determinePhase(200, false)).toBe("DIAGNOSTIC");
  });

  it("moves through the phases as the test approaches", () => {
    expect(determinePhase(200, true)).toBe("FOUNDATION");
    expect(determinePhase(90, true)).toBe("SKILL_FOCUS");
    expect(determinePhase(45, true)).toBe("TIMED_PRACTICE");
    expect(determinePhase(20, true)).toBe("FULL_TEST");
    expect(determinePhase(10, true)).toBe("SHARPEN");
    expect(determinePhase(3, true)).toBe("FINAL_WEEK");
    expect(determinePhase(0, true)).toBe("TEST_DAY");
  });
});

describe("generateStudyPlan", () => {
  it("covers every day from today through test day", () => {
    const plan = generateStudyPlan(input());
    expect(plan.days).toHaveLength(25); // 29 July -> 22 August inclusive
    expect(plan.days[0].iso).toBe("2026-07-29");
    expect(plan.days[plan.days.length - 1].iso).toBe("2026-08-22");
  });

  it("makes test day a test day with no new material", () => {
    const plan = generateStudyPlan(input());
    const last = plan.days[plan.days.length - 1];
    expect(last.kind).toBe("TEST_DAY");
    expect(last.targetQuestions).toBe(0);
    expect(last.items[0].label).toContain("Test day");
  });

  it("keeps the day before the test light", () => {
    const plan = generateStudyPlan(input());
    const dayBefore = plan.days[plan.days.length - 2];
    expect(dayBefore.targetMinutes).toBeLessThanOrEqual(30);
    expect(dayBefore.items[0].label).toContain("Day before");
  });

  it("only schedules work on the days the student said they're available", () => {
    const plan = generateStudyPlan(input({ availableDays: ["Sat"], daysPerWeek: 1 }));
    const working = plan.days.filter(
      (d) => d.kind !== "REST" && d.kind !== "TEST_DAY" && d.items.length > 0
    );
    for (const day of working) {
      // Full-length tests and the pre-test day are allowed to fall anywhere.
      if (day.kind === "FULL_TEST" || day.kind === "LIGHT") continue;
      expect(day.date.getDay()).toBe(6); // Saturday
    }
  });

  it("never assigns more minutes than the student has, on ordinary days", () => {
    const plan = generateStudyPlan(input({ minutesPerDay: 45 }));
    const ordinary = plan.days.filter((d) => ["SKILL", "MIXED", "ERROR_REVIEW"].includes(d.kind));
    for (const day of ordinary) {
      expect(day.targetMinutes).toBeLessThanOrEqual(50);
    }
  });

  it("runs one timed module when the student can't fit two", () => {
    const tight = generateStudyPlan(input({ minutesPerDay: 45 }));
    for (const day of tight.days.filter((d) => d.kind === "TIMED")) {
      const modules = day.items.filter((i) => i.label.startsWith("Timed module"));
      expect(modules).toHaveLength(1);
      expect(day.targetMinutes).toBeLessThanOrEqual(50);
    }

    const roomy = generateStudyPlan(input({ minutesPerDay: 120 }));
    for (const day of roomy.days.filter((d) => d.kind === "TIMED")) {
      expect(day.items.filter((i) => i.label.startsWith("Timed module"))).toHaveLength(2);
    }
  });

  it("alternates which section gets the timed module on tight days", () => {
    const plan = generateStudyPlan(input({ minutesPerDay: 45, testDate: new Date(2026, 9, 3) }));
    const sections = plan.days
      .filter((d) => d.kind === "TIMED")
      .map((d) => d.items.find((i) => i.label.startsWith("Timed module"))?.section);
    expect(new Set(sections).size).toBeGreaterThan(1);
  });

  it("targets the highest-priority skill by name", () => {
    const plan = generateStudyPlan(input());
    const labels = plan.days.flatMap((d) => d.items.map((i) => i.label)).join(" ");
    expect(labels).toContain("Linear equations in two variables");
  });

  it("links straight into a matching practice set", () => {
    const plan = generateStudyPlan(input());
    const withHref = plan.days.flatMap((d) => d.items).find((i) => i.href?.includes("/practice/session"));
    expect(withHref?.href).toContain("skill=");
    expect(withHref?.href).toContain("count=");
  });

  it("tapers the final week to review only", () => {
    const plan = generateStudyPlan(input());
    const finalWeek = plan.days.filter((d) => {
      const remaining = Math.round((TEST_DATE.getTime() - d.date.getTime()) / 86_400_000);
      return remaining > 1 && remaining <= 7;
    });
    for (const day of finalWeek) {
      expect(["FINAL_WEEK", "LIGHT", "REST", "FULL_TEST"]).toContain(day.kind);
    }
  });

  it("never schedules a full-length test in the last four days", () => {
    const plan = generateStudyPlan(input({ testDate: new Date(2026, 11, 5) }));
    for (const day of plan.days.filter((d) => d.kind === "FULL_TEST")) {
      const remaining = Math.round(
        (new Date(2026, 11, 5).getTime() - day.date.getTime()) / 86_400_000
      );
      expect(remaining).toBeGreaterThanOrEqual(4);
    }
  });

  it("builds weekly score checkpoints between the estimate and the target", () => {
    const plan = generateStudyPlan(input());
    const targets = plan.weeklyGoals.map((g) => g.scoreTarget).filter((v): v is number => v != null);
    expect(targets.length).toBeGreaterThan(0);
    for (const t of targets) {
      expect(t).toBeGreaterThanOrEqual(1380);
      expect(t).toBeLessThanOrEqual(1600);
    }
    // Checkpoints must rise monotonically toward the target.
    for (let i = 1; i < targets.length; i += 1) {
      expect(targets[i]).toBeGreaterThanOrEqual(targets[i - 1]);
    }
  });

  it("omits score checkpoints when there is no baseline", () => {
    const plan = generateStudyPlan(input({ predictedTotal: null }));
    expect(plan.weeklyGoals.every((g) => g.scoreTarget === null)).toBe(true);
  });

  it("tells the student to take the diagnostic when they haven't", () => {
    const plan = generateStudyPlan(input({ hasDiagnostic: false, predictedTotal: null }));
    expect(plan.phase).toBe("DIAGNOSTIC");
    expect(plan.summary).toContain("diagnostic");
  });

  it("never promises a score", () => {
    const plan = generateStudyPlan(input());
    expect(plan.summary).toContain("No study plan can guarantee a score");
  });

  it("is deterministic for the same inputs", () => {
    const a = generateStudyPlan(input());
    const b = generateStudyPlan(input());
    expect(b.days.map((d) => `${d.iso}:${d.kind}`)).toEqual(a.days.map((d) => `${d.iso}:${d.kind}`));
  });

  it("handles a test date that is already here", () => {
    const plan = generateStudyPlan(input({ testDate: NOW }));
    expect(plan.phase).toBe("TEST_DAY");
    expect(plan.days).toHaveLength(1);
  });

  it("respects the horizon cap for a distant test date", () => {
    const plan = generateStudyPlan(input({ testDate: new Date(2027, 5, 5), horizonDays: 30 }));
    expect(plan.days).toHaveLength(31);
  });
});

describe("practiceHref", () => {
  it("encodes the skill and set size", () => {
    const href = practiceHref({
      section: "MATH",
      skill: "Linear equations in two variables",
      recommendedDifficulty: "EASY",
      recommendedQuestions: 15,
    });
    expect(href).toContain("section=MATH");
    expect(href).toContain("skill=Linear+equations+in+two+variables");
    expect(href).toContain("count=15");
    expect(href).toContain("difficulty=EASY");
  });

  it("omits difficulty for mixed sets", () => {
    const href = practiceHref({
      section: "MATH",
      skill: "Circles",
      recommendedDifficulty: "MIXED",
      recommendedQuestions: 8,
    });
    expect(href).not.toContain("difficulty=");
  });
});
