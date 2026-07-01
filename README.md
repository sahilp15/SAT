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
#    (DATABASE_URL is already set for local SQLite — that's all you need. No API key required.)

# 3. Create the local database and load the question bank
npm run db:migrate      # creates prisma/dev.db from the schema
npm run db:seed         # adds a local profile + 370+ preloaded Math questions

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

## Question bank

The app ships with a **preloaded bank of 370+ original, SAT-style Math questions**
(Algebra, Advanced Math, Problem-Solving & Data Analysis, Geometry & Trigonometry),
plus a curated regression set and R&W samples. They load automatically with
`npm run db:seed` — **no API key, no import step, no internet required.** Every
question uses proper LaTeX and renders through KaTeX.

These are original questions authored for this app (not College Board content), so
they’re free to ship in the repo. Just `git pull` and seed, and the Math section is
fully populated.

### Optional: import your own question files

If you later want to add your own questions from text-extractable PDFs, a
label-anchored text importer is included:

```bash
npm run import:dry   # parse + write data/imported/*.json + print a report (no DB writes)
npm run import       # parse and load into the database (idempotent by question id)
```

Reading & Writing extracts cleanly this way (choices are text). Math from official
PDFs often stores equations as images, so those items get flagged **NEEDS_REVIEW**
in **Import & Review** (`/admin/import`), where you can fix them with a live KaTeX
preview editor. This step is entirely optional — the preloaded bank already makes
the app work end-to-end.

> **Content note:** If you ever import official College Board questions, they’re
> copyrighted. The importer writes them only to your *local* database for personal
> study; source files and `dev.db` are git-ignored and are **not** redistributed.

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
