# SAT Prep — Personal Study System (Version 1)

A private, **local-first** SAT preparation web app for Reading & Writing and Math.
It’s built around *learning from mistakes*: every wrong answer requires an error
log, missed questions return through spaced repetition, and your study plan adapts
as you practice. It runs entirely on your machine and stores all progress in a
local SQLite database.

> This tool is designed to maximize your chances of reaching your target score if
> you use it consistently. It does **not** guarantee any score.

---

## Version 1 scope

V1 is for a single local user (you). It focuses on a reliable, polished study loop:

- **Onboarding** → grade, SAT date, target score, score history, availability,
  strengths, and plan intensity.
- **Dashboard** → SAT countdown, study plan, daily tasks, accuracy by
  section/topic/difficulty, readiness estimate, due-for-review count, upcoming tests.
- **Practice** (R&W + Math) with real SAT formatting and **KaTeX math rendering**,
  immediate grading, and official explanations.
- **Required error logs** after every miss — AI-reviewed when a key is configured.
- **Spaced repetition** for everything you miss.
- **Math modes**: general, Desmos-friendly, non-Desmos, regression trainer, timed.
- **Practice-test planner** that spaces full Bluebook tests before your SAT.
- **Analytics** with trends, mistake types, improving/declining topics.
- **Import/admin** page to bring in your own question files and fix flagged items.

Multi-user auth, hosting, and payments are intentionally **out of scope** for V1
(the schema is already structured to support them later — see *Roadmap*).

---

## Tech stack

| Concern        | Choice                                             |
| -------------- | -------------------------------------------------- |
| Framework      | Next.js 14 (App Router) + TypeScript               |
| Styling        | Tailwind CSS                                        |
| Database       | SQLite via Prisma (single `prisma/dev.db` file)    |
| Math rendering | KaTeX (`react-katex`)                              |
| Charts         | Recharts                                           |
| PDF parsing    | `pdfjs-dist` (importer)                            |
| AI             | OpenAI, via **server-side** API routes only        |

All AI calls run in server routes under `src/app/api/` (and `src/lib/ai/` is marked
`server-only`). **Your API key is never sent to the browser.**

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
#    (DATABASE_URL is already set for local SQLite; add OPENAI_API_KEY later if you want AI)

# 3. Create the local database and load sample questions
npm run db:migrate      # creates prisma/dev.db from the schema
npm run db:seed         # adds a local profile + original sample questions

# 4. Run the app
npm run dev             # http://localhost:3000
```

First visit → you’ll land on the onboarding flow, which builds your dashboard and plan.

### Production-style run

```bash
npm run build
npm start
```

---

## Environment variables

See `.env.example`. Copy it to `.env` (which is git-ignored).

| Variable          | Required | Purpose                                                            |
| ----------------- | -------- | ------------------------------------------------------------------ |
| `DATABASE_URL`    | yes      | SQLite location. Default `file:./dev.db` (relative to `prisma/`).  |
| `OPENAI_API_KEY`  | no       | Enables AI review of error logs and AI-personalized study plans.   |
| `OPENAI_MODEL`    | no       | Chat model id. Default `gpt-4o-mini`.                              |
| `AI_ENABLED`      | no       | Set `"false"` to hard-disable AI even if a key is present.         |

Without a key, the app still works fully — error logs just use a **completeness
gate** (every field must be filled in thoughtfully) instead of AI quality review.

---

## Importing your own SAT questions

There are two importers. **For Math, use the vision importer** — it's the only
reliable way to recover equations from the official PDFs.

### Why: the official PDFs store math as images

In the SAT Question Bank PDFs, equations, answer choices, and figures are rendered
as **images, not text**. Plain text extraction therefore loses ~87% of math answer
choices and most inline equations (measured on the Math file). No text parser can
fix that — the math was never text.

### Recommended: vision importer (accurate LaTeX)

Renders each PDF page to an image and uses an OpenAI **vision** model to transcribe
questions into clean structured JSON with LaTeX math, choices, correct answers, and
explanations. Requires `OPENAI_API_KEY` (and optionally `OPENAI_VISION_MODEL`) in `.env`.

```bash
# Put your official PDFs in data/uploads/, then:

# 1. Cheap smoke test on the first few pages (see the JSON before spending much):
npm run import:vision -- --file "SAT Math (First 170 Questions).pdf" --limit 4 --dry-run

# 2. A small real batch into the database:
npm run import:vision -- --file "SAT Math (First 170 Questions).pdf" --limit 8

# 3. The full import (all PDFs in data/uploads):
npm run import:vision
```

Flags: `--file <name>` (one PDF), `--limit N` (first N pages), `--pages 5-12`,
`--dry-run` (no DB writes; writes `data/imported/vision-*.json`), `--scale 2.5`
(sharper images), `--mock` (no API calls — pipeline test). Imports are idempotent
(upsert by Question ID), so re-running is safe, and running vision over a file you
previously text-imported **upgrades** those questions to the clean version.

### Alternative: text importer (fast, good for Reading & Writing)

```bash
npm run import:dry   # parse + write data/imported/*.json + print a report (no DB writes)
npm run import       # parse and load into the database (idempotent by question id)
```

Reading & Writing extracts cleanly this way. Math will mostly be flagged for review.

### Review flagged items

Open **Import & Review** (`/admin/import`). Items either importer couldn't fully
trust — figures/graphs, or anything low-confidence — are flagged **NEEDS_REVIEW**.
Fix them with the live KaTeX preview editor and mark them reviewed. Only `OK`
items appear in practice.

### Curated fallback bank

The app ships with an original, SAT-style Math + regression question set (seeded by
`npm run db:seed`) so the Math section, equation rendering, and Regression Trainer
work immediately — before you run any import. These are clearly labeled and can be
deleted from the admin page.

### How parsing works (and its limits)

- The parser is **label-anchored** (`Question ID`, `Correct Answer:`,
  `Question Difficulty:`, `Domain`/`Skill`, `Rationale`) so it handles the differing
  field order between Math and R&W exports.
- Math variables use Unicode math-italic symbols (𝑥, 𝑦…); these are normalized
  (NFKC) toward plain text. Inline math wrapped in `$...$` renders via KaTeX.
- **Reading & Writing** generally imports cleanly (choices are text).
- **Math** often needs review: in PDF exports, equations and answer choices are
  frequently images, so their text doesn’t extract. Those questions are flagged for
  a quick manual fix rather than shipped wrong.
- Any question identified as coming from an official **Bluebook** practice test can
  be marked `isBluebook` and is then excluded from normal practice (reserved for
  realistic diagnostics).

> **Content note:** Official SAT questions are College Board copyrighted. This app
> imports them into your *local* database for personal study only. Source files and
> the local database are git-ignored and are **not** redistributed. Review College
> Board’s content rules before ever making any of this public.

---

## Desmos & regression

- Every math question can open an embedded **Desmos graphing calculator**.
- The College Board *testing* calculator
  (`desmos.com/testing/collegeboard/graphing`) is a restricted build that isn’t
  licensed for third-party embedding, so this app embeds the standard, publicly
  embeddable Desmos calculator (`desmos.com/calculator`) — the closest compliant
  equivalent. See `src/components/DesmosPanel.tsx` for the full note.
- The **Regression Trainer** (`/practice/regression`, inspired by
  regressiontrainer.org) teaches the data-table + `~` model-fit workflow Desmos uses.

---

## How progress is saved

Everything is in the local SQLite database (`prisma/dev.db`): your profile,
question attempts, error logs, AI reviews, spaced-repetition queue, study plans,
practice-test schedule and results, per-topic mastery, and settings. Close the app
and reopen it later — your data is still there. Nothing is sent to any server
(except OpenAI, only if you add a key, and only the text needed for review).

### Reset local data

- From the app: **Settings → Reset local data** (reset progress, or reset everything).
- From the CLI:

  ```bash
  npm run db:reset      # drops & recreates the DB, then re-seeds
  ```

To fully wipe, delete `prisma/dev.db` and re-run `npm run db:migrate && npm run db:seed`.

---

## Spaced repetition

Missed questions enter a queue with an increasing interval ladder:
**same session → 1 day → 3 → 7 → 14 → 30**. A confident, correct review pushes the
item further out; a miss shortens the interval, records a lapse, and **requires a
fresh error log**. Logic lives in `src/lib/srs.ts` (pure + unit-tested:
`npm test`).

---

## Project structure

```
config/sat-dates.json      Single source of truth for upcoming SAT dates
prisma/schema.prisma       Data model (SQLite now, Postgres-ready)
prisma/seed.ts             Local user + sample questions
scripts/import/            PDF/text -> intermediate JSON -> DB importer
src/lib/                   db, srs, satDates, taxonomy, analytics, planning, ai/
src/components/            MathText (KaTeX), QuestionRunner, ErrorLogForm, charts, …
src/app/                   Pages + /api server routes (AI lives here, server-side)
data/uploads/              Your source question files (git-ignored)
data/imported/             Parsed JSON review artifacts (git-ignored)
```

---

## Testing

```bash
npm test          # unit tests (spaced-repetition scheduler)
npm run build     # type-checks the whole app
npm run import:dry# validates the importer against your files without touching the DB
```

Manual checklist: onboarding saves and persists across restarts; math renders as
real notation; wrong answers block on a required error log; missed questions appear
in spaced repetition; the study plan and test schedule reflect your SAT date.

---

## Roadmap (future hosted version)

The schema is already multi-user-ready (every owned row has a `userId`, UUID keys,
no SQLite-only features). A future V2 could add:

1. **AI activation polish** — richer tutoring, weekly summaries.
2. **Real auth** + per-user data isolation.
3. **Swap SQLite → Postgres/Supabase** (Prisma datasource change + migration).
4. Hosting, content-rules review before any public question sharing, and (optionally)
   multiple students with teacher/admin views.

---

## Privacy & security notes

- All study data is stored **locally** in SQLite. There’s no telemetry and no
  account.
- API keys live only in `.env` (git-ignored) and are used only in server-side
  routes — never exposed to the browser.
- Imported official questions and your local database are git-ignored and not
  redistributed. Keep them private.
