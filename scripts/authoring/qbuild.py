"""Shared harness for authoring original SAT-style items.

Every Math item carries a `check` callable that recomputes the answer from
scratch. Nothing reaches the bank unless its own check passes, so a typo in a
key is a build failure rather than a wrong answer shipped to a student.
"""

from dataclasses import dataclass, field
from fractions import Fraction
from typing import Callable, Optional
import json
import re

SECTION_MATH = "MATH"
SECTION_RW = "READING_WRITING"


@dataclass
class Item:
    external_id: str
    section: str
    domain: str
    skill: str
    difficulty: str
    fmt: str
    stem: str
    answer: str
    explanation: str
    choices: dict = field(default_factory=dict)
    check: Optional[Callable[[], bool]] = None
    stimulus: Optional[str] = None
    requires_calculator: bool = True
    desmos_relevant: bool = False

    def to_json(self) -> dict:
        out = {
            "externalId": self.external_id,
            "section": self.section,
            "domain": self.domain,
            "skill": self.skill,
            "difficulty": self.difficulty,
            "format": self.fmt,
            "stem": self.stem,
            "correctAnswer": self.answer,
            "explanation": self.explanation,
            "choices": [
                {"label": k, "content": v} for k, v in sorted(self.choices.items())
            ],
            "requiresCalculator": self.requires_calculator,
            "desmosRelevant": self.desmos_relevant,
            "isRegression": False,
            "reviewStatus": "OK",
        }
        if self.stimulus:
            out["stimulus"] = self.stimulus
        return out


def validate(items: list) -> list:
    """Structural + mathematical validation. Raises on the first bad item."""
    errors = []
    seen = set()
    for it in items:
        tag = it.external_id
        if tag in seen:
            errors.append(f"{tag}: duplicate externalId")
        seen.add(tag)

        if it.fmt == "MCQ":
            if sorted(it.choices) != ["A", "B", "C", "D"]:
                errors.append(f"{tag}: MCQ needs exactly choices A-D, got {sorted(it.choices)}")
            if it.answer not in it.choices:
                errors.append(f"{tag}: answer {it.answer!r} not among choices")
            contents = [str(v).strip() for v in it.choices.values()]
            if len(set(contents)) != len(contents):
                errors.append(f"{tag}: duplicate choice contents")
        elif it.fmt == "SPR":
            if it.choices:
                errors.append(f"{tag}: SPR must not carry choices")
            if not re.fullmatch(r"-?\d+(\.\d+)?(/\d+)?", it.answer.strip()):
                errors.append(f"{tag}: SPR answer {it.answer!r} is not a plain number/fraction")
        else:
            errors.append(f"{tag}: unknown format {it.fmt!r}")

        if it.difficulty not in ("EASY", "MEDIUM", "HARD"):
            errors.append(f"{tag}: bad difficulty {it.difficulty!r}")
        if not it.explanation or len(it.explanation) < 60:
            errors.append(f"{tag}: explanation too short to be useful")
        if not it.stem or len(it.stem) < 15:
            errors.append(f"{tag}: stem too short")

        if it.check is not None:
            try:
                ok = it.check()
            except Exception as exc:  # noqa: BLE001 - surfaced as a build error
                errors.append(f"{tag}: check raised {type(exc).__name__}: {exc}")
            else:
                if not ok:
                    errors.append(f"{tag}: CHECK FAILED — answer key does not recompute")

    if errors:
        raise SystemExit("Item validation failed:\n  " + "\n  ".join(errors))
    return items


def frac(n, d) -> str:
    """SPR answers are entered as fractions or decimals; normalize to lowest terms."""
    f = Fraction(n, d)
    return str(f.numerator) if f.denominator == 1 else f"{f.numerator}/{f.denominator}"


def write(items: list, path: str) -> None:
    validate(items)
    with open(path, "w") as fh:
        json.dump([i.to_json() for i in items], fh, indent=2, ensure_ascii=False)
    print(f"wrote {len(items)} items -> {path}")
