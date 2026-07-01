// Seed: ensures one local user (+ profile + settings) and loads the original
// sample questions so the app is usable immediately. Safe to run repeatedly —
// everything is upserted by a stable key.

import { PrismaClient } from "@prisma/client";
import { SAMPLE_QUESTIONS } from "./sampleQuestions";
import { CURATED_MATH } from "./curatedMath";
import { GENERATED_MATH } from "./generatedMath";

const prisma = new PrismaClient();
const LOCAL_USER_EMAIL = "local@sat-prep.app";

// Original sample set + curated math/regression bank + preloaded 367-question
// Math bank (generatedMath.json). All original, all seeded with no API key.
const ALL_SEED_QUESTIONS = [
  ...SAMPLE_QUESTIONS,
  ...CURATED_MATH,
  ...GENERATED_MATH,
];

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

  // Sample questions (idempotent by externalId).
  let inserted = 0;
  for (const q of ALL_SEED_QUESTIONS) {
    const data = {
      externalId: q.externalId,
      section: q.section,
      domain: q.domain,
      skill: q.skill,
      difficulty: q.difficulty,
      format: q.format,
      stimulus: q.stimulus ?? null,
      stem: q.stem,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      source: "sample",
      isBluebook: false,
      requiresCalculator: q.requiresCalculator ?? q.section === "MATH",
      desmosRelevant: q.desmosRelevant ?? q.section === "MATH",
      isRegression: q.isRegression ?? false,
      reviewStatus: "OK",
      importConfidence: 1.0,
    };
    const question = await prisma.question.upsert({
      where: { externalId: q.externalId },
      create: data,
      update: data,
    });
    await prisma.answerChoice.deleteMany({ where: { questionId: question.id } });
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
  console.log(`Seeded ${inserted} sample questions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
