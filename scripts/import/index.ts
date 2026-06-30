// Question importer entry point.
//
//   npm run import          # parse data/uploads/* -> data/imported/*.json -> DB
//   npm run import:dry      # parse + write JSON + print report, but DO NOT touch the DB
//
// Supported inputs in data/uploads/:
//   *.pdf  -> text extracted with pdfjs, then parsed
//   *.txt  -> already-extracted Question Bank text, parsed directly
//
// Import is idempotent: questions are upserted by externalId, so re-running
// updates in place instead of duplicating.

import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { parseQuestionBankText } from "./parse";
import { extractPdfText } from "./pdf";
import type { ImportReport, ParsedQuestion } from "./types";

const ROOT = process.cwd();
const UPLOADS_DIR = path.join(ROOT, "data", "uploads");
const IMPORTED_DIR = path.join(ROOT, "data", "imported");

async function getTextForFile(file: string): Promise<string> {
  const full = path.join(UPLOADS_DIR, file);
  if (file.toLowerCase().endsWith(".pdf")) {
    const buf = await readFile(full);
    return extractPdfText(new Uint8Array(buf));
  }
  return readFile(full, "utf-8");
}

async function loadIntoDb(prisma: PrismaClient, questions: ParsedQuestion[]) {
  for (const q of questions) {
    if (!q.externalId) continue; // skip un-keyable items
    const data = {
      externalId: q.externalId,
      section: q.section,
      domain: q.domain,
      skill: q.skill,
      difficulty: q.difficulty,
      format: q.format,
      stimulus: q.stimulus,
      stem: q.stem,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      source: q.source,
      isBluebook: q.isBluebook,
      requiresCalculator: q.requiresCalculator,
      desmosRelevant: q.desmosRelevant,
      isRegression: q.isRegression,
      reviewStatus: q.reviewStatus,
      importConfidence: q.importConfidence,
      importNotes: q.importNotes,
    };

    const question = await prisma.question.upsert({
      where: { externalId: q.externalId },
      create: data,
      update: data,
    });

    // Replace choices wholesale (simplest correct path for re-import).
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
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  await mkdir(IMPORTED_DIR, { recursive: true });
  await mkdir(UPLOADS_DIR, { recursive: true });

  const entries = (await readdir(UPLOADS_DIR)).filter(
    (f) => /\.(pdf|txt)$/i.test(f) && !f.startsWith(".")
  );

  if (entries.length === 0) {
    console.log(
      `No .pdf or .txt files found in ${UPLOADS_DIR}.\n` +
        `Place your SAT Question Bank exports there and re-run \`npm run import\`.`
    );
    return;
  }

  const prisma = dryRun ? null : new PrismaClient();
  const reports: ImportReport[] = [];

  for (const file of entries) {
    process.stdout.write(`Parsing ${file} ... `);
    const text = await getTextForFile(file);
    const source = path.basename(file).replace(/\.(pdf|txt)$/i, "");
    const questions = parseQuestionBankText(text, { source });

    // Write the intermediate JSON review artifact.
    const outPath = path.join(IMPORTED_DIR, `${source}.json`);
    await writeFile(outPath, JSON.stringify(questions, null, 2));

    const report: ImportReport = {
      sourceFile: file,
      total: questions.length,
      ok: questions.filter((q) => q.reviewStatus === "OK").length,
      needsReview: questions.filter((q) => q.reviewStatus === "NEEDS_REVIEW").length,
      bySection: questions.reduce<Record<string, number>>((acc, q) => {
        acc[q.section] = (acc[q.section] ?? 0) + 1;
        return acc;
      }, {}),
    };
    reports.push(report);
    console.log(`${report.total} questions (${report.ok} ok, ${report.needsReview} need review)`);

    if (prisma) await loadIntoDb(prisma, questions);
  }

  if (prisma) await prisma.$disconnect();

  console.log("\n=== Import summary ===");
  for (const r of reports) {
    console.log(
      `${r.sourceFile}: ${r.total} total | OK ${r.ok} | review ${r.needsReview} | ` +
        Object.entries(r.bySection)
          .map(([s, n]) => `${s}:${n}`)
          .join(" ")
    );
  }
  if (dryRun) {
    console.log("\n(dry run — database not modified; JSON written to data/imported/)");
  } else {
    console.log("\nDone. Review flagged items at /admin/import.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
