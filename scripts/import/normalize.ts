// Text + math normalization for imported question content.
//
// Official SAT Question Bank PDFs render variables using Unicode "Mathematical
// Alphanumeric Symbols" (e.g. 𝑥 = U+1D465). NFKC normalization maps these back
// to plain ASCII letters (𝑥 -> x, ℎ -> h), which is exactly what we want before
// wrapping expressions for KaTeX. We deliberately do NOT try to reconstruct full
// LaTeX automatically (too error-prone); instead we clean the text and flag
// anything that still looks broken for manual review in the admin UI.

/** Characters that signal lossy/garbled extraction (mojibake from bad decoding). */
const MOJIBAKE_RE = /[ð�]/;

/** Mathematical Alphanumeric Symbols + letterlike math constants range. */
const MATH_ALNUM_RE = /[\u{1D400}-\u{1D7FF}ℎ]/u;

export function normalizeText(input: string | null | undefined): string {
  if (!input) return "";
  let s = input.normalize("NFKC");
  // Normalize curly quotes/dashes for consistent display.
  s = s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–|—/g, "-")
    .replace(/ /g, " ");
  // Collapse runs of blank lines to a single blank line; trim trailing spaces.
  s = s
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return s;
}

/**
 * Heuristic confidence signals for a parsed question. Returns a list of human
 * readable issues; an empty list means the parse looks clean.
 */
export function detectIssues(opts: {
  section: "MATH" | "READING_WRITING";
  stem: string;
  stimulus: string | null;
  format: "MCQ" | "SPR";
  choices: { content: string }[];
  correctAnswer: string;
  domain: string;
  skill: string;
  explanation: string | null;
}): string[] {
  const issues: string[] = [];
  const blob = `${opts.stimulus ?? ""}\n${opts.stem}`;

  if (!opts.stem || opts.stem.length < 8) issues.push("Stem is empty or very short");
  if (!opts.domain) issues.push("Missing domain");
  if (!opts.skill) issues.push("Missing skill");
  if (!opts.correctAnswer) issues.push("Missing correct answer");
  if (!opts.explanation) issues.push("Missing explanation");

  if (opts.format === "MCQ") {
    if (opts.choices.length < 2) {
      issues.push("Fewer than 2 answer choices parsed");
    } else {
      const empty = opts.choices.filter((c) => c.content.trim().length === 0).length;
      if (empty > 0) issues.push(`${empty} answer choice(s) have no text (likely image/equation)`);
    }
  }

  // Mojibake / unresolved math glyphs anywhere in the question content.
  if (MOJIBAKE_RE.test(blob) || opts.choices.some((c) => MOJIBAKE_RE.test(c.content))) {
    issues.push("Garbled math characters detected — needs cleanup");
  }
  if (MATH_ALNUM_RE.test(blob)) {
    issues.push("Unconverted math symbols present");
  }

  // Figure/graph/table references whose visual likely didn't extract.
  if (/\b(graph|figure|table|diagram|shown|scatterplot|number line)\b/i.test(blob)) {
    issues.push("References a figure/table/graph — verify the visual is present");
  }

  // Dangling references that suggest missing inline values, e.g. "slope of  and"
  // or sentences ending right before a period with a gap.
  if (/\b(of|through|point|value of|equation)\s{2,}/.test(blob) || /\s\.\s/.test(blob)) {
    issues.push("Possible missing inline value (gap in text)");
  }

  return issues;
}

/** Map a list of issues to a 0..1 confidence score. */
export function scoreConfidence(issues: string[]): number {
  if (issues.length === 0) return 1;
  // Each issue chips away at confidence; garbled math / empty choices hurt most.
  let score = 1;
  for (const i of issues) {
    if (i.includes("Garbled") || i.includes("no text")) score -= 0.4;
    else if (i.includes("Missing") || i.includes("empty")) score -= 0.3;
    else score -= 0.15;
  }
  return Math.max(0, Math.round(score * 100) / 100);
}

export { MOJIBAKE_RE, MATH_ALNUM_RE };
