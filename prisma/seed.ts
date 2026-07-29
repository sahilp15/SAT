// Seed: ensures one local user (+ profile + settings) and loads the curated
// question bank so the app is usable immediately.
//
// This seed is authoritative: it first DELETES every existing question (and its
// answer choices / attempts / SRS items, via cascade) and then loads exactly the
// questions in the bank. Running it replaces the question set wholesale.
//
// It also derives the structured study metadata for every item (subskill, SAT
// relevance, calculator usefulness, target time) and marks the questions the
// score predictor reserves, so the diagnostic never collides with practice.

import { PrismaClient } from "@prisma/client";
import { QUESTION_BANK } from "./questionBank";
import { deriveQuestionMeta } from "../src/lib/questionMeta";
import { diagnosticExternalIds } from "../src/lib/diagnostic/form";

const prisma = new PrismaClient();
const LOCAL_USER_EMAIL = "local@sat-prep.app";

async function main() {
  // Single local user with profile + settings.
  const user = await prisma.user.upsert({
    where: { email: LOCAL_USER_EMAIL },
    update: {},
    create: {
      email: LOCAL_USER_EMAIL,
      name: "Me",
      profile: { create: {} },
      settings: { create: {} },
    },
  });
  console.log(`Local user ready: ${user.id}`);

  // Wipe the entire existing question set. AnswerChoice, QuestionAttempt, and
  // SrsItem all cascade-delete from Question, so this clears them too.
  const removed = await prisma.question.deleteMany({});
  console.log(`Deleted ${removed.count} existing questions.`);

  const diagnosticIds = new Set(diagnosticExternalIds());
  let inserted = 0;
  let diagnosticFound = 0;

  for (const q of QUESTION_BANK) {
    const meta = deriveQuestionMeta({
      section: q.section,
      domain: q.domain,
      skill: q.skill,
      difficulty: q.difficulty,
      format: q.format,
      stem: q.stem,
      stimulus: q.stimulus,
      choices: q.choices,
    });
    const isDiagnostic = diagnosticIds.has(q.externalId);
    if (isDiagnostic) diagnosticFound += 1;

    const question = await prisma.question.create({
      data: {
        externalId: q.externalId,
        section: q.section,
        domain: q.domain,
        skill: q.skill,
        subskill: meta.subskill,
        difficulty: q.difficulty,
        format: q.format,
        stimulus: q.stimulus ?? null,
        stem: q.stem,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        source: "question-bank",
        sourceType: "OFFICIAL_STYLE",
        satRelevance: meta.satRelevance,
        calculatorAppropriate: meta.calculatorAppropriate,
        timeRecommendationSec: meta.timeRecommendationSec,
        isDiagnostic,
        isBluebook: false,
        requiresCalculator: q.requiresCalculator ?? q.section === "MATH",
        desmosRelevant: q.desmosRelevant ?? q.section === "MATH",
        isRegression: q.isRegression ?? false,
        reviewStatus: q.reviewStatus ?? "OK",
        importConfidence: 1.0,
      },
    });

    if (q.choices.length > 0) {
      await prisma.answerChoice.createMany({
        data: q.choices.map((c) => ({
          questionId: question.id,
          label: c.label,
          content: c.content,
          isCorrect: c.isCorrect,
          rationaleWrong: c.rationaleWrong ?? null,
        })),
      });
    }
    inserted++;
  }

  console.log(`Seeded ${inserted} questions from the bank.`);
  console.log(`Reserved ${diagnosticFound}/${diagnosticIds.size} score-predictor questions.`);
  if (diagnosticFound !== diagnosticIds.size) {
    console.warn(
      "WARNING: some diagnostic questions were not found in the bank. The score predictor will refuse to start until this is fixed."
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
