#!/usr/bin/env python3
"""Build the seed question banks from the user-provided JSON exports.

Reads the raw Reading & Writing and Math exports, applies conservative OCR
clean-up to the Math items (the Math export was extracted from images), tags
each item for practice routing (calculator / Desmos / regression), and flags the
handful of unrecoverable items as NEEDS_REVIEW so they stay in the bank but are
excluded from normal practice.

Outputs:
  prisma/bankReadingWriting.json
  prisma/bankMath.json

Run:  python3 scripts/build-bank.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RW_SRC = sys.argv[1] if len(sys.argv) > 1 else None
MATH_SRC = sys.argv[2] if len(sys.argv) > 2 else None

# Strip leaked export metadata like "Assessment SAT Test Math Domain ... Difficulty Hard"
META_RE = re.compile(r"\s*Assessment SAT Test\b.*$", re.IGNORECASE | re.DOTALL)


def strip_meta(s: str) -> str:
    if not s:
        return s
    return META_RE.sub("", s).strip()


def clean_common(s: str) -> str:
    if not s:
        return s
    s = strip_meta(s)
    # Normalise unusual spaces.
    s = s.replace(" ", " ").replace("​", "")
    return s


# Canonicalise skill labels that appear with inconsistent casing in the export.
SKILL_CANON = {
    "cross-text connections": "Cross-Text Connections",
}


def canon_skill(s: str) -> str:
    return SKILL_CANON.get((s or "").strip().lower(), s)


def clean_math_text(s: str) -> str:
    """Conservative fixes for OCR artifacts in Math content."""
    if not s:
        return s
    s = clean_common(s)
    # Em/en dash used as a minus between numbers/variables -> hyphen-minus.
    s = re.sub(r"([0-9A-Za-z\)\.])\s*[—–]\s*([0-9A-Za-z\(])", r"\1 - \2", s)
    # Percentage questions that lost their percent sign: "What is 10 of 370?"
    s = re.sub(r"\bWhat is (\d+) of (\d+)\?", r"What is \1% of \2?", s)
    return s


def is_regression(q) -> bool:
    hay = (q.get("skill", "") + " " + q.get("stem", "")).lower()
    return (
        "scatterplot" in hay
        or "line of best fit" in hay
        or "best fit" in hay
        or "regression" in hay
        or "models and scatterplots" in hay
    )


def choices_ok(choices) -> bool:
    if not choices:
        return False
    return all((c.get("content") or "").strip() for c in choices)


def build_rw(items):
    out = []
    for q in items:
        stem = clean_common(q.get("stem", ""))
        choices = [
            {"label": c["label"], "content": clean_common(c.get("content", ""))}
            for c in (q.get("choices") or [])
        ]
        review = "OK" if choices_ok(choices) and stem else "NEEDS_REVIEW"
        out.append(
            {
                "externalId": q["externalId"],
                "section": "READING_WRITING",
                "domain": q["domain"],
                "skill": canon_skill(q["skill"]),
                "difficulty": q["difficulty"],
                "format": "MCQ",
                "stem": stem,
                "correctAnswer": q["correctAnswer"],
                "explanation": clean_common(q.get("explanation", "")),
                "choices": choices,
                "requiresCalculator": False,
                "desmosRelevant": False,
                "isRegression": False,
                "reviewStatus": review,
            }
        )
    return out


# A few Math items are unrecoverable from the OCR export (figure-only choices,
# a mangled formula). Keep them in the bank but flag so practice skips them.
KNOWN_BAD = set()


def build_math(items):
    out = []
    flagged = 0
    for q in items:
        qtype = q.get("questionType", "MCQ")
        fmt = "SPR" if qtype == "SPR" else "MCQ"
        stem = clean_math_text(q.get("stem", ""))
        choices = [
            {"label": c["label"], "content": clean_math_text(c.get("content", ""))}
            for c in (q.get("choices") or [])
        ]
        review = "OK"
        if fmt == "MCQ" and not choices_ok(choices):
            review = "NEEDS_REVIEW"
        if not stem.strip():
            review = "NEEDS_REVIEW"
        # Mangled temperature-conversion formula that survived as noise.
        if re.search(r"2\s*\(\s*a\s*-\s*273\.15", stem):
            review = "NEEDS_REVIEW"
        if review == "NEEDS_REVIEW":
            flagged += 1
        out.append(
            {
                "externalId": q["externalId"],
                "section": "MATH",
                "domain": q["domain"],
                "skill": canon_skill(q["skill"]),
                "difficulty": q["difficulty"],
                "format": fmt,
                "stem": stem,
                "correctAnswer": q["correctAnswer"],
                "explanation": clean_math_text(q.get("explanation", "")),
                "choices": choices,
                "requiresCalculator": True,
                "desmosRelevant": True,
                "isRegression": is_regression(q),
                "reviewStatus": review,
            }
        )
    return out, flagged


def main():
    if not RW_SRC or not MATH_SRC:
        print("usage: build-bank.py <rw.json> <math.json>")
        sys.exit(1)
    rw_raw = json.load(open(RW_SRC))
    math_raw = json.load(open(MATH_SRC))

    rw = build_rw(rw_raw)
    math, flagged = build_math(math_raw)

    json.dump(rw, open(os.path.join(ROOT, "prisma", "bankReadingWriting.json"), "w"), ensure_ascii=False, indent=1)
    json.dump(math, open(os.path.join(ROOT, "prisma", "bankMath.json"), "w"), ensure_ascii=False, indent=1)

    rw_ok = sum(1 for q in rw if q["reviewStatus"] == "OK")
    math_ok = sum(1 for q in math if q["reviewStatus"] == "OK")
    reg = sum(1 for q in math if q["isRegression"])
    print(f"R&W:  {len(rw)} total, {rw_ok} OK, {len(rw)-rw_ok} needs-review")
    print(f"Math: {len(math)} total, {math_ok} OK, {flagged} needs-review, {reg} regression-tagged")


if __name__ == "__main__":
    main()
