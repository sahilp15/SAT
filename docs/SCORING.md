# How the predicted score is calculated

The implementation lives in [`src/lib/diagnostic/scoring.ts`](../src/lib/diagnostic/scoring.ts)
and is verified by [`scoring.test.ts`](../src/lib/diagnostic/scoring.test.ts). This document
explains the reasoning; the code is the authority, and the two must be kept in sync.

## The short version

Twenty questions cannot determine an SAT score. What they *can* do is estimate a latent
ability with a stated uncertainty, and identify which skills are weak. The model is built
so that:

- every number traces back to a stated rule — there is no unexplained fudge factor;
- there is no random component, so identical responses always produce an identical estimate;
- **the reported range is the answer**, and the single number is only its midpoint;
- weak evidence widens the range rather than quietly producing a confident-looking number.

---

## 1. Item difficulty

Each question is placed on a logit scale by its difficulty label:

| Difficulty | b     |
| ---------- | ----- |
| EASY       | −1.0  |
| MEDIUM     |  0.0  |
| HARD       | +1.1  |

## 2. Response likelihood (Rasch / 1PL)

```
P(correct | θ) = 1 / (1 + exp(−(θ − b)))
```

`θ` is the student's latent ability in the same logit units as `b`.

## 3. Response weights

Not every response carries the same information, so each contributes a weight `w`:

| Situation                                                | Weight  |
| -------------------------------------------------------- | ------- |
| baseline                                                  | 1.00    |
| adaptive-stage item (targeted at the student's level)      | × 1.05  |
| unanswered (scored incorrect, but weaker evidence)         | × 0.60  |
| correct in under 25% of the recommended time (lucky guess) | × 0.75  |

Running out of time is genuinely weaker evidence than choosing a wrong answer, and a
correct answer produced in six seconds on a ninety-second question is not strong evidence
of mastery. Both are down-weighted rather than ignored.

## 4. Ability estimate (MAP)

`θ` maximizes

```
Σᵢ wᵢ · [ yᵢ·log(pᵢ) + (1 − yᵢ)·log(1 − pᵢ) ]  −  θ² / (2 · 1.2²)
```

over a grid `θ ∈ [−3.5, 3.5]` in steps of `0.02`.

The `N(0, 1.2²)` prior does two jobs: it keeps a perfect or all-wrong run from producing an
infinite estimate, and it pulls thin evidence toward the middle instead of the extremes.
A student who answers all ten Math questions correctly gets a high estimate, not an
infinite one.

## 5. Content-domain correction

A ten-item section cannot sample the four content domains in blueprint proportion. So a
second ability estimate is computed per domain, recombined using the blueprint weights in
[`taxonomy.ts`](../src/lib/taxonomy.ts), and blended:

```
θ_final = 0.8 · θ_overall + 0.2 · θ_blueprint
```

This nudges the estimate toward what the student would likely score on a properly
proportioned test without letting one domain dominate.

## 6. Scaled score

A documented linear anchor maps logits to the 200–800 section scale:

| θ   | score |
| --- | ----- |
| −3  | 250   |
|  0  | 520   |
| +3  | 790   |

```
score = clamp(200, 800, round((520 + 90·θ) / 10) · 10)
```

Scores are reported in multiples of 10, like the real exam. The total is the sum of the two
section scores, clamped to 400–1600.

## 7. Confidence range

Standard error comes from Fisher information plus the prior:

```
SE(θ) = 1 / sqrt( Σᵢ wᵢ·pᵢ·(1 − pᵢ)  +  1 / 1.2² )
```

Converted to score points (×90), then widened by penalties that reflect **evidence quality**
rather than ability:

| Signal                                             | Added half-width |
| -------------------------------------------------- | ---------------- |
| each unanswered question                            | +12 pts          |
| each rushed response                                | +6 pts           |
| each answer change (capped at 8)                    | +2 pts           |
| inconsistency with difficulty (0–1, scaled)         | up to +25 pts    |

The reported band is an **80% interval** (z = 1.28), with a floor of ±30 points per section
so the app never implies false precision, and a ceiling of ±140 so it stays readable.
Section errors are combined in quadrature for the total, since they are independent
estimates.

## 8. Confidence level

| Level    | Condition                                                                             |
| -------- | ------------------------------------------------------------------------------------- |
| LOW      | fewer than 14 answered, or SE(θ) > 0.85, or more than 4 blanks                          |
| HIGH     | 19+ answered, SE(θ) ≤ 0.62, ≤ 2 rushed responses, and consistency ≥ 0.8                 |
| MODERATE | everything else                                                                        |

HIGH is deliberately hard to reach. Twenty questions rarely justify it.

---

## What the model deliberately does *not* do

**It does not apply ad-hoc point bonuses.** An earlier design added points back for
"careless" misses on easy questions. That was rejected: careless mistakes cost real points
on test day, and inflating the estimate to hide them would produce a study plan aimed at
the wrong problem. Instead, the estimated cost of avoidable slips is reported separately as
**careless drag** — visible, quantified, and never added back into the score.

**It does not use your self-reported prior score.** Onboarding asks for it because it is
useful context for the study plan, but feeding it into the estimate would make the
diagnostic partly a measure of your own optimism.

**It is not equated to any real SAT form.** There is no concordance table behind the
θ → score mapping; it is an anchored linear scale chosen to be reasonable, not official.

---

## How the four inputs are used

The user-visible signals map onto the pipeline like this:

| Input                                   | Where it acts                                      |
| --------------------------------------- | -------------------------------------------------- |
| Number correct                           | likelihood (step 2)                                 |
| Difficulty of correct answers            | item difficulty `b` (step 1)                        |
| Difficulty of incorrect answers          | item difficulty `b` (step 1)                        |
| Routing-stage performance                | selects the adaptive track; reported separately     |
| Adaptive-stage performance               | weight ×1.05 (step 3); reported separately          |
| Content-domain performance               | blueprint correction (step 5)                       |
| Time spent per question                  | rushed-correct down-weight (step 3); range (step 7) |
| Unanswered questions                     | weight ×0.6 (step 3); range widening (step 7)       |
| Answer changes                           | range widening (step 7); mistake classification     |
| Consistency across difficulty levels     | range widening (step 7); careless-drag estimate     |

---

## Comparing attempts across forms

The app ships 18 diagnostic forms. They are not 18 different tests: every form is built
from one blueprint (`src/lib/diagnostic/blueprint.ts`) that fixes, for each of the 20
positions, which section it belongs to, which content domain it draws from, and which
difficulty bucket it uses. Form 12's third Math routing question is an Algebra MEDIUM item
exactly as form 1's is. Only the specific question changes.

That is what makes two attempts comparable. The score model above takes item difficulty as
its input, so equal blueprints mean equal difficulty inputs, and a difference between two
attempts reflects a difference in performance rather than a difference in the instrument.

Three caveats apply when reading a change between attempts:

1. **The instrument is identical; the items are not.** Two MEDIUM Algebra items are not
   exactly equally hard. This residual form-to-form variation is not modelled and sits
   inside the reported confidence range rather than being corrected out.
2. **Sampling noise dominates small changes.** With a half-width of roughly 30–140 points,
   consecutive attempts can differ by 30–60 points with no change in ability at all. The
   hub says so directly rather than celebrating the difference. A rise is evidence only
   once it clears the previous attempt's range, or once several attempts trend the same
   way.
3. **The trend line is least squares, not last-minus-first.** `scoreTrend` in
   `src/lib/diagnostic/history.ts` fits a slope across every completed attempt and reports
   points per attempt. It is deliberately shown only from the third attempt onward: from
   two points, "points per attempt" is just the delta restated with an unearned air of
   authority.

Retaking a form you have already completed is allowed, and the hub labels it. Its questions
are no longer novel to you, so treat that score as the least trustworthy kind of attempt —
it measures recall of those items alongside ability.

---

## Known limitations

1. **Sample size.** Ten items per section is a small instrument. The ±80–140 point range is
   honest, not conservative window dressing.
2. **No fatigue modelling.** The real SAT is a long test. A 25-minute diagnostic cannot
   measure stamina, and this estimate will tend to *overestimate* a student who fades.
3. **Difficulty labels are categorical.** Real item-response models use continuous,
   empirically calibrated difficulty and discrimination parameters. This uses three buckets
   and a fixed discrimination of 1.
4. **Not equated to a real form.** The scale mapping is anchored by judgement.
5. **Blueprint weights are approximate.** They come from public descriptions of the digital
   SAT, not from official item counts, and are used only for prioritization and a 20%
   correction.
6. **The bank is what it is.** Estimates are only as good as the questions behind them;
   items requiring figures the app cannot render are excluded from the diagnostic entirely.

The single best way to improve on this estimate is a full-length practice test under real
conditions. The app schedules those for you.
