# SAT Studio — Personal Prep System

A private, **local-first** SAT preparation system for Reading & Writing and Math. It
measures where you actually are, explains every mistake you make, and turns that into a
day-by-day schedule that runs all the way to test day. Everything runs on your machine and
stores progress in a local SQLite database.

> This tool is built to give you the best shot at your target score if you use it
> consistently. It does **not** guarantee any score, and its predicted scores are
> estimates — not official College Board scores.

---

## What it does

**Adaptive score predictor.** A curated 20-question diagnostic — 10 Math, 10 Reading &
Writing. Each section runs a fixed 5-question routing stage spanning all four content
domains, then routes independently into one of three adaptive tracks. It reports a
predicted score with an honest confidence range, plus a full breakdown by domain, skill,
difficulty, and timing. See [`docs/SCORING.md`](docs/SCORING.md) for the complete
methodology.

**Mistake analysis on every miss.** Each wrong answer is classified by likely cause —
concept gap, misread, careless slip, incorrect setup, time pressure, elimination trouble —
using your chosen answer, your pace against the item's time budget, your answer changes,
and your history on that skill. This runs entirely locally; AI, when configured, upgrades
the write-up rather than providing it.

**A mastery model, not an accuracy counter.** Mastery is the modelled probability you'd
answer a *medium* question on a skill correctly, estimated with the same Rasch formulation
as the score predictor, weighted by difficulty and decayed toward recent attempts.

**Exact recommendations.** Never "practice Math." Every recommendation names a specific
skill, states why it surfaced, shows current versus target mastery, sizes the practice set,
and links straight into it.

**A plan through test day.** A day-by-day schedule built from the days and minutes you
actually have, weighted toward the gaps that cost the most points, with phases that advance
automatically as the test approaches and a real taper in the final week.

**An error log that doesn't let go.** Every missed or flagged question, filterable by
section, domain, skill, mistake type, difficulty, date, source, and resolution status.
Unresolved items resurface through spaced repetition until you close them out.

**An AI tutor that already knows your situation.** It reads your diagnostic results, skill
mastery, recent mistakes, plan, and test date, with explicit modes (teach, hint, check my
reasoning, generate a similar question, explain my mistake, quiz me, plan my day). It
degrades to useful local answers when AI is unavailable.

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env
#    DATABASE_URL is the only required variable and is already filled in.
#    Add OPENAI_API_KEY only if you want the AI features.

# 3. Create the database and load the question bank (986 questions)
npm run db:migrate
npm run db:seed

# 4. Run it
npm run dev          # http://localhost:3000
```

Then open <http://localhost:3000> and complete onboarding.

### Quality checks

```bash
npx tsc --noEmit     # type checking
npm run lint         # ESLint
npm test             # 210 tests (Vitest)
npm run build        # production build
```

The test suite creates and destroys its own SQLite database (`prisma/test.db`); it never
touches your `dev.db`.

### Useful commands

| Command                 | What it does                                              |
| ----------------------- | --------------------------------------------------------- |
| `npm run db:seed`       | Reload the question bank (destructive to questions only)   |
| `npm run db:studio`     | Browse the local database                                  |
| `npm run db:reset`      | Drop and recreate the database                             |
| `npm run import`        | Import your own question exports from `data/uploads/`      |
| `npm run test:watch`    | Tests in watch mode                                        |

---

## Architecture

```
src/
  app/                     Next.js App Router
    api/                   Server routes — the only place secrets are read
    diagnostic/            Score predictor: intro, player, results
    dashboard/ plan/ practice/ errors/ analytics/ tutor/ profile/ settings/
  components/
    ui/                    Design-system primitives (buttons, cards, charts, dialogs)
    shell/                 Sidebar, topbar, command palette, mobile nav
    diagnostic/ practice/ review/ plan/ dashboard/ tutor/ settings/ onboarding/
  lib/
    diagnostic/
      form.ts              The curated 20-question form (by stable question id)
      routing.ts           Adaptive routing — pure, deterministic
      scoring.ts           The score model — pure, deterministic, documented
      mistakes.ts          Heuristic mistake classification
      session.ts           Session orchestration, autosave, submission fan-out
    mastery.ts             Skill mastery model
    recommendations.ts     Impact-ranked practice recommendations
    studyPlanner.ts        Day-by-day plan generation
    ai/                    Server-only AI layer (config, client, schemas, prompts)
prisma/
  schema.prisma            Data model
  bankMath.json            367 Math questions
  bankReadingWriting.json  619 Reading & Writing questions
docs/SCORING.md            Full scoring methodology
```

**Design principle:** every model that produces a number — routing, scoring, mastery,
recommendations, planning — is a pure function with no clock, no randomness, and no
database access. That is what makes them testable and reproducible. Persistence lives in a
thin layer above them.

---

## How AI is used, and how the key is protected

AI is **additive**. With no key configured, the diagnostic, scoring, mistake analysis,
error log, recommendations, study plan, spaced repetition, and all practice work exactly as
designed. There is no feature whose core function depends on the API.

| Feature                  | Without a key                                     | With a key                                    |
| ------------------------ | ------------------------------------------------- | --------------------------------------------- |
| Mistake analysis          | Local heuristic classifier                         | Deeper, question-specific write-up             |
| AI tutor                  | Answers from your data + official explanations     | Full conversational tutoring with modes        |
| Error-log review          | Completeness gate                                  | Rubric-scored review of your reflection        |
| Daily coaching note       | Hidden                                             | Shown on the dashboard                         |
| Everything else           | Unchanged                                          | Unchanged                                      |

**Key protection:**

- `process.env.OPENAI_API_KEY` is read in exactly one file — `src/lib/ai/config.ts` — which
  is marked `server-only`, so importing it from a client component is a build error.
- No function ever returns the key. Callers can ask *whether* AI is configured, never what
  the key is.
- Every error message passes through `sanitizeErrorMessage()`, which redacts anything
  matching an API key or bearer token before it can reach a log or an HTTP response.
- The key is never written to the database and never appears in an API response.
- `.env` is gitignored; `.env.example` contains no real values.

**Reliability and cost controls** (all configurable — see `.env.example`): hard per-request
timeout, bounded retries with exponential backoff honoring `Retry-After`, per-minute and
per-day request ceilings, an output-token cap, and an in-memory response cache. Every AI
call returns a typed result rather than throwing, so a failure is always a fallback rather
than a broken page.

**Structured outputs.** Every AI response is requested against a strict JSON schema derived
from a Zod schema, then re-validated against that schema before it is stored or displayed.
A malformed or hallucinated shape is rejected, not rendered.

**Content rules.** The official explanation shipped with each question is ground truth; the
model may rephrase or coach around it but never contradicts it. Generated questions are
explicitly labelled as model-written SAT-style practice, never as official College Board
content.

---

## Limitations worth knowing

- **The predicted score is an estimate from 20 questions.** The reported range is the real
  answer; the single number is its midpoint. It is not equated to any official form.
- **It cannot model fatigue.** A 25-minute diagnostic says nothing about hour three of a
  real test. Full-length practice tests are scheduled for exactly this reason.
- **Difficulty is categorical.** Three buckets, not empirically calibrated item parameters.
- **Blueprint weights are approximate**, drawn from public descriptions of the digital SAT,
  and used only for prioritization and a bounded 20% correction.
- **Figure-dependent questions are excluded from the diagnostic** because the app cannot
  render the figures they need.

---

## Disclaimer

SAT® is a trademark registered by the College Board. Official College Board questions and
materials used in this app are the property of the College Board and are used **solely for
personal, private study**. This project is an independent study tool and is **not
affiliated with, authorized, sponsored, or endorsed by the College Board**. Content is
stored locally and is not redistributed.
