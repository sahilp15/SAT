// Spaced-repetition scheduler.
// Pure functions only (no DB, no Date.now side effects passed implicitly) so the
// logic is deterministic and unit-testable. The caller supplies "now".
//
// Interval ladder (days from review):
//   index 0 -> same session / same day (0 days)
//   index 1 -> 1 day
//   index 2 -> 3 days
//   index 3 -> 7 days
//   index 4 -> 14 days
//   index 5 -> 30 days
// An item that answers correctly+confidently at the top of the ladder graduates
// (becomes inactive). A miss shortens the interval and forces a new error log.

export const INTERVAL_LADDER_DAYS = [0, 1, 3, 7, 14, 30] as const;
export const MAX_INTERVAL_INDEX = INTERVAL_LADDER_DAYS.length - 1;

export type SrsResult = "CORRECT" | "INCORRECT";
export type Confidence = "GUESS" | "UNSURE" | "CONFIDENT";

export interface SrsState {
  intervalIndex: number;
  consecutiveCorrect: number;
  lapses: number;
  active: boolean;
}

export interface SrsReviewInput extends SrsState {
  result: SrsResult;
  confidence?: Confidence | null;
}

export interface SrsReviewOutcome extends SrsState {
  /** Days until the item is next due (from `now`). */
  intervalDays: number;
  /** Whether the caller must force a fresh error log (always true on a miss). */
  requiresErrorLog: boolean;
  /** Whether the item just graduated out of the active queue. */
  graduated: boolean;
}

function clampIndex(i: number): number {
  return Math.max(0, Math.min(MAX_INTERVAL_INDEX, i));
}

/**
 * Compute the next SRS state from a review result.
 *
 * Rules:
 *  - Correct + Confident  -> advance one rung (faster mastery).
 *  - Correct + Unsure     -> hold at the current rung (review again at same interval).
 *  - Correct + Guess      -> hold (a lucky guess shouldn't accelerate).
 *  - Incorrect            -> drop back toward the start, record a lapse, force an error log.
 *  - Reaching the top rung with a confident-correct answer graduates the item.
 */
export function computeNextReview(input: SrsReviewInput): SrsReviewOutcome {
  const { result, confidence } = input;
  let intervalIndex = input.intervalIndex;
  let consecutiveCorrect = input.consecutiveCorrect;
  let lapses = input.lapses;
  let active = true;
  let graduated = false;
  let requiresErrorLog = false;

  if (result === "INCORRECT") {
    // Shorten: step back two rungs (floor at 0), reset streak, count a lapse.
    intervalIndex = clampIndex(intervalIndex - 2);
    consecutiveCorrect = 0;
    lapses += 1;
    requiresErrorLog = true;
  } else {
    consecutiveCorrect += 1;
    const confident = confidence === "CONFIDENT";
    if (confident) {
      if (intervalIndex >= MAX_INTERVAL_INDEX) {
        // Mastered the full ladder confidently -> graduate.
        graduated = true;
        active = false;
      } else {
        intervalIndex = clampIndex(intervalIndex + 1);
      }
    }
    // Correct but not confident: hold at the same rung (re-review at same interval).
  }

  const intervalDays = INTERVAL_LADDER_DAYS[clampIndex(intervalIndex)];

  return {
    intervalIndex,
    consecutiveCorrect,
    lapses,
    active,
    intervalDays,
    requiresErrorLog,
    graduated,
  };
}

/** Add whole days to a date without mutating the input. */
export function addDays(now: Date, days: number): Date {
  const d = new Date(now.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/** Next due date given a review outcome and the current time. */
export function nextDueDate(now: Date, outcome: SrsReviewOutcome): Date {
  // Same-day rung (0) is due again later the same session: use start of next
  // calendar day boundary? No — keep it due "now" so it resurfaces this session.
  if (outcome.intervalDays === 0) return new Date(now.getTime());
  return addDays(now, outcome.intervalDays);
}

/** Initial state for a freshly-missed question entering the queue. */
export function initialSrsState(): SrsState {
  return { intervalIndex: 0, consecutiveCorrect: 0, lapses: 0, active: true };
}

/** Is an item due as of `now`? */
export function isDue(dueDate: Date, now: Date): boolean {
  return dueDate.getTime() <= now.getTime();
}
