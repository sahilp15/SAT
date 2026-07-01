// Automated vision importer entry point.
//
//   npm run import:vision                 # all PDFs in data/uploads, all pages
//   npm run import:vision -- --limit 4    # only the first 4 pages (cheap test run)
//   npm run import:vision -- --file "SAT Math (First 170 Questions).pdf"
//   npm run import:vision -- --pages 5-12 # a page range
//   npm run import:vision -- --dry-run    # transcribe + write JSON, don't touch DB
//   npm run import:vision -- --mock       # no API calls (pipeline smoke test)
//
// Pipeline per file: render pages -> PNG, transcribe each page with the vision
// model, validate the JSON, then upsert questions (idempotent by externalId).
// Running vision over a file that was previously text-imported UPGRADES those
// rows in place to the clean, LaTeX version.

import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { renderPdfToImages } from "./pdfToImages";
import { transcribePage } from "./vision";
import type { VisionQuestion } from "./visionSchema";

const ROOT = process.cwd();
const UPLOADS_DIR = path.join(ROOT, "data", "uploads");
const IMPORTED_DIR = path.join(ROOT, "data", "imported");

interface Args {
  file?: string;
  pages?: number[];
  limit?: number;
  scale: number;
  dryRun: boolean;
  mock: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { scale: 2.0, dryRun: false, mock: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") a.dryRun = true;
    else if (arg === "--mock") a.mock = true;
    else if (arg === "--file") a.file = argv[++i];
    else if (arg === "--limit") a.limit = parseInt(argv[++i], 10);
    else if (arg === "--scale") a.scale = parseFloat(argv[++i]);
    else if (arg === "--pages") {
      const spec = argv[++i];
      const m = spec.match(/^(\d+)-(\d+)$/);
      if (m) {
        const from = parseInt(m[1], 10);
        const to = parseInt(m[2], 10);
        a.pages = Array.from({ length: to - from + 1 }, (_, k) => from + k);
      } else {
        a.pages = spec.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n));
      }
    }
  }
  return a;
}

function stableId(q: VisionQuestion): string {
  if (q.externalId && q.externalId.trim()) return q.externalId.trim();
  const basis = `${q.stem}|${q.choices.map((c) => c.label + c.content).join("|")}`;
  return "vision-" + crypto.createHash("sha1").update(basis).digest("hex").slice(0, 16);
}

function reviewStatusFor(q: VisionQuestion): "OK" | "NEEDS_REVIEW" {
  if (q.hasFigure || q.needsReview) return "NEEDS_REVIEW";
  if (q.format === "MCQ") {
    if (q.choices.length < 4 || q.choices.some((c) => !c.content.trim())) return "NEEDS_REVIEW";
    if (!q.choices.some((c) => c.isCorrect)) return "NEEDS_REVIEW";
  }
  if (!q.correctAnswer.trim()) return "NEEDS_REVIEW";
  return "OK";
}

async function upsertQuestion(prisma: PrismaClient, q: VisionQuestion) {
  const externalId = stableId(q);
  const reviewStatus = reviewStatusFor(q);
  const data = {
    externalId,
    section: q.section,
    domain: q.domain || "Uncategorized",
    skill: q.skill || "Uncategorized",
    difficulty: q.difficulty,
    format: q.format,
    stimulus: q.stimulus ?? null,
    stem: q.stem,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation ?? null,
    source: "vision",
    isBluebook: q.isBluebook,
    requiresCalculator: q.section === "MATH",
    desmosRelevant: q.section === "MATH",
    isRegression: q.isRegression,
    reviewStatus,
    importConfidence: reviewStatus === "OK" ? 0.95 : 0.6,
    importNotes: q.hasFigure ? "Contains a figure/graph — verify the visual" : null,
  };

  const question = await prisma.question.upsert({
    where: { externalId },
    create: data,
    update: data,
  });
  await prisma.answerChoice.deleteMany({ where: { questionId: question.id } });
  if (q.choices.length) {
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
  return reviewStatus;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.mock) process.env.VISION_MOCK = "1";

  await mkdir(IMPORTED_DIR, { recursive: true });
  const allFiles = (await readdir(UPLOADS_DIR)).filter((f) => /\.pdf$/i.test(f) && !f.startsWith("."));
  const files = args.file ? allFiles.filter((f) => f === args.file) : allFiles;

  if (files.length === 0) {
    console.log(
      args.file
        ? `File not found in data/uploads: ${args.file}`
        : `No .pdf files in ${UPLOADS_DIR}. Add your official SAT PDFs there and re-run.`
    );
    return;
  }

  const prisma = args.dryRun ? null : new PrismaClient();
  const grand = { questions: 0, ok: 0, review: 0, pageFailures: 0 };

  for (const file of files) {
    const full = path.join(UPLOADS_DIR, file);
    console.log(`\n=== ${file} ===`);
    let pages;
    try {
      const buf = await readFile(full);
      // pdf-to-png-converter accepts a path or Buffer; pass the Buffer.
      pages = await renderPdfToImages(full, {
        pages: args.pages,
        scale: args.scale,
      });
      void buf;
    } catch (e) {
      console.error(`  Failed to render PDF: ${(e as Error).message}`);
      continue;
    }

    // Respect --limit (number of pages to process from the front).
    if (args.limit && args.limit < pages.length) pages = pages.slice(0, args.limit);
    console.log(`  Rendering complete: ${pages.length} page(s) to transcribe.`);

    const collected: VisionQuestion[] = [];
    const seen = new Set<string>();
    for (const page of pages) {
      try {
        const qs = await transcribePage(page.png);
        for (const q of qs) {
          const id = stableId(q);
          if (seen.has(id)) continue; // de-dupe within this run
          seen.add(id);
          collected.push(q);
        }
        process.stdout.write(`  page ${page.pageNumber}: ${qs.length} question(s)\n`);
      } catch (e) {
        grand.pageFailures++;
        console.error(`  page ${page.pageNumber}: FAILED — ${(e as Error).message}`);
      }
    }

    // Write the review artifact.
    const source = file.replace(/\.pdf$/i, "");
    await writeFile(
      path.join(IMPORTED_DIR, `vision-${source}.json`),
      JSON.stringify(collected, null, 2)
    );

    // Load into DB.
    let ok = 0;
    let review = 0;
    if (prisma) {
      for (const q of collected) {
        const status = await upsertQuestion(prisma, q);
        if (status === "OK") ok++;
        else review++;
      }
    } else {
      for (const q of collected) (reviewStatusFor(q) === "OK" ? ok++ : review++);
    }
    grand.questions += collected.length;
    grand.ok += ok;
    grand.review += review;
    console.log(`  -> ${collected.length} question(s): ${ok} ok, ${review} need review`);
  }

  if (prisma) await prisma.$disconnect();

  console.log("\n=== Vision import summary ===");
  console.log(
    `Questions: ${grand.questions} | OK: ${grand.ok} | review: ${grand.review} | page failures: ${grand.pageFailures}`
  );
  if (args.dryRun) console.log("(dry run — database not modified; JSON written to data/imported/)");
  else if (args.mock) console.log("(mock — canned transcription used; no OpenAI calls)");
  else console.log("Done. Review any flagged items at /admin/import.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
