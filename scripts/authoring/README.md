# Authoring original items

These scripts generate the items whose `externalId` begins with `sp-` — original
questions written for this app, as opposed to the imported bank that
`scripts/build-bank.py` produces.

## Why the items live in a script rather than being hand-edited into the JSON

Every Math item carries a `check` callable that recomputes its answer from
scratch — by solving the equation with sympy, re-deriving the ratio, or
re-evaluating the model. `validate()` runs every check and refuses to emit
anything whose key does not recompute. A typo in an answer key is therefore a
build failure rather than a wrong answer shipped to a student.

`validate()` also enforces the structural rules the diagnostic form builder
depends on: MCQ items have exactly choices A–D with distinct contents, the key
names one of them, SPR answers are plain numbers or fractions, and no item ships
without a real explanation.

Conceptual items (causation vs. association, sampling design) carry
`check=lambda: True` — there is nothing to recompute — and are correct by
review, not by construction.

## Running

    pip install sympy
    cd scripts/authoring
    python3 -c "
    from qbuild import validate
    import gen_algebra, gen_advanced, gen_geo_psda, gen_rw_a, gen_rw_b
    items = (gen_algebra.ITEMS + gen_advanced.ITEMS + gen_geo_psda.ITEMS
             + gen_rw_a.ITEMS + gen_rw_b.ITEMS)
    validate(items)
    print(len(items), 'items OK')
    "

The items are already merged into `prisma/bankMath.json` and
`prisma/bankReadingWriting.json`. Re-running the scripts re-validates them; it
does not re-merge. Merge deliberately, and check for `externalId` collisions
first — the merge that produced the current bank asserted there were none.

## Adding more

Continue the `sp-m-####` / `sp-rw-####` numbering, keep `(domain, skill)` values
exactly as spelled in `src/lib/taxonomy.ts` (the merge asserts this), and give
every Math item a real `check`. Then regenerate the diagnostic forms:

    npm run build:forms && npm test

Note that a Math item is only eligible for a *scored* diagnostic if it clears
the quality filter in `scripts/build-diagnostic-forms.ts` — items with rendered
tables or figure references stay practice-only by design.
