// Core parser for SAT Suite Question Bank text exports.
//
// The export linearizes each question into a block that begins with
// "Question ID <hex>". Field order differs between Math and Reading & Writing,
// so we parse by ANCHORED LABELS rather than by position:
//   - "ID: <id> Answer"        -> boundary between stem/choices and the answer section
//   - "Correct Answer: <X>"    -> the answer (single A-D letter => MCQ, else SPR)
//   - "Rationale"              -> start of the official explanation
//   - "Question Difficulty: X" -> difficulty (also marks end of the rationale)
//   - "Domain" / "Skill"       -> label lines; value is on the next non-empty line
//
// Everything is best-effort: anything that looks incomplete (empty MCQ choices,
// garbled math, figure references) is flagged NEEDS_REVIEW with a confidence
// score so it can be fixed in the admin UI rather than silently shipped wrong.

import type { ParsedChoice, ParsedQuestion } from "./types";
import { normalizeText, detectIssues, scoreConfidence } from "./normalize";

const QUESTION_DELIM = /Question ID\s+([0-9a-fA-F]{6,})/g;
const CONFIDENCE_REVIEW_THRESHOLD = 0.75;

function mapDifficulty(raw: string | null): "EASY" | "MEDIUM" | "HARD" {
  switch ((raw ?? "").toLowerCase()) {
    case "easy":
      return "EASY";
    case "hard":
      return "HARD";
    default:
      return "MEDIUM";
  }
}

function firstMatch(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

/** Split a block's rationale into per-choice segments keyed by letter. */
function splitChoiceRationales(rationale: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!rationale) return out;
  // Matches "Choice A is correct", "Choice B is incorrect", etc.
  const re = /Choice\s+([A-D])\s+is\s+(?:correct|incorrect)[^.]*\.?/gi;
  const markers: { letter: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(rationale)) !== null) {
    markers.push({ letter: m[1].toUpperCase(), index: m.index });
  }
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index;
    const end = i + 1 < markers.length ? markers[i + 1].index : rationale.length;
    out[markers[i].letter] = rationale.slice(start, end).trim();
  }
  return out;
}

/** Parse the A-D choices out of the pre-answer region; returns stem + choices. */
function parseChoices(region: string): { stemPart: string; choices: ParsedChoice[] } {
  // Zero-width lookbehind/lookahead so adjacent labels ("A. B. C. D.") are all
  // detected — the separator is not consumed by the previous match.
  const labelRe = /(?<=^|\s)([A-D])\.(?=\s|$)/g;
  const found: { label: string; idx: number; after: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = labelRe.exec(region)) !== null) {
    found.push({ label: m[1], idx: m.index, after: m.index + m[0].length });
  }
  // Keep the first strictly-increasing A,B,C,D sequence (ignores stray "A." in prose).
  const seq = ["A", "B", "C", "D"];
  const ordered: typeof found = [];
  let expect = 0;
  for (const f of found) {
    if (f.label === seq[expect]) {
      ordered.push(f);
      expect++;
      if (expect >= seq.length) break;
    }
  }

  if (ordered.length < 2) return { stemPart: region, choices: [] };

  const stemPart = region.slice(0, ordered[0].idx);
  const choices: ParsedChoice[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const contentStart = ordered[i].after;
    const contentEnd = i + 1 < ordered.length ? ordered[i + 1].idx : region.length;
    const content = normalizeText(region.slice(contentStart, contentEnd));
    choices.push({ label: ordered[i].label, content, isCorrect: false });
  }
  return { stemPart, choices };
}

/** Strip header/label noise from the pre-answer region of a block. */
function stripHeaderNoise(region: string, externalId: string): string {
  let s = region;
  // Remove the metadata block R&W puts before the passage, WHEREVER it appears
  //   Domain / <domain> / Skill / <skill> / Difficulty
  // (chart-axis noise sometimes precedes it, so this isn't anchored to the start).
  s = s.replace(
    /\bDomain\s*\n+[^\n]+\n+\s*Skill\s*\n+[^\n]+\n+\s*Difficulty\s*\n*/gi,
    "\n"
  );
  // Remove stray single-token header lines.
  s = s.replace(
    /^(?:\s*(?:Assessment|Test|SAT|Reading and Writing|Math|ID:\s*[0-9a-fA-F]+)\s*\n)+/gim,
    ""
  );
  s = s.replace(new RegExp(`ID:\\s*${externalId}\\s*`, "g"), "");
  return s.trim();
}

/** Heuristic split of a Reading & Writing passage (stimulus) from the question stem. */
function splitStimulusStem(text: string): { stimulus: string | null; stem: string } {
  const clean = normalizeText(text);
  // If it's short or has no question mark, treat the whole thing as the stem.
  const qIdx = clean.lastIndexOf("?");
  if (clean.length < 280 || qIdx === -1) {
    return { stimulus: null, stem: clean };
  }
  // The stem is the sentence containing the final "?". Find the sentence start.
  const before = clean.slice(0, qIdx);
  const sentenceStart = Math.max(
    before.lastIndexOf(". "),
    before.lastIndexOf("\n"),
    before.lastIndexOf(": ")
  );
  if (sentenceStart <= 0) return { stimulus: null, stem: clean };
  const stem = clean.slice(sentenceStart + 1).trim();
  const stimulus = clean.slice(0, sentenceStart + 1).trim();
  return { stimulus: stimulus.length > 0 ? stimulus : null, stem };
}

export function parseQuestionBankText(
  fullText: string,
  opts: { source: string }
): ParsedQuestion[] {
  const text = fullText.replace(/\r\n/g, "\n");
  const results: ParsedQuestion[] = [];

  // Collect delimiter positions to slice blocks.
  const delims: { id: string; index: number; afterIndex: number }[] = [];
  let m: RegExpExecArray | null;
  QUESTION_DELIM.lastIndex = 0;
  while ((m = QUESTION_DELIM.exec(text)) !== null) {
    delims.push({ id: m[1].toLowerCase(), index: m.index, afterIndex: QUESTION_DELIM.lastIndex });
  }

  for (let i = 0; i < delims.length; i++) {
    const start = delims[i].afterIndex;
    const end = i + 1 < delims.length ? delims[i + 1].index : text.length;
    const externalId = delims[i].id;
    const block = text.slice(start, end);

    const section: "MATH" | "READING_WRITING" = /Reading and Writing/.test(block)
      ? "READING_WRITING"
      : "MATH";

    const correctRaw = firstMatch(block, /Correct Answer:\s*([^\n]+)/);
    const correctAnswer = correctRaw ? normalizeText(correctRaw) : "";
    const difficulty = mapDifficulty(firstMatch(block, /Question Difficulty:\s*(Easy|Medium|Hard)/i));
    const domain = normalizeText(firstMatch(block, /\bDomain\s*\n+\s*([^\n]+)/) ?? "");
    const skill = normalizeText(firstMatch(block, /\bSkill\s*\n+\s*([^\n]+)/) ?? "");

    // Rationale: between "Rationale" and "Question Difficulty:" (or end).
    let explanation: string | null = null;
    const ratStart = block.search(/\bRationale\s*\n/);
    if (ratStart !== -1) {
      const after = block.slice(ratStart).replace(/^[^\n]*\n/, ""); // drop the "Rationale" line
      const stopIdx = after.search(/Question Difficulty:/);
      explanation = normalizeText(stopIdx !== -1 ? after.slice(0, stopIdx) : after);
    }

    // Pre-answer region: between the stem's "ID: <id>" and "ID: <id> Answer".
    const answerMarkerRe = new RegExp(`ID:\\s*${externalId}\\s+Answer`, "i");
    const answerMatch = block.match(answerMarkerRe);
    let region = "";
    if (answerMatch && answerMatch.index !== undefined) {
      const idRe = new RegExp(`ID:\\s*${externalId}(?!\\s+Answer)`, "gi");
      let idMatch: RegExpExecArray | null;
      let lastIdIndex = -1;
      while ((idMatch = idRe.exec(block)) !== null) {
        if (idMatch.index < answerMatch.index) lastIdIndex = idMatch.index;
      }
      const regionStart = lastIdIndex !== -1 ? lastIdIndex : 0;
      region = block.slice(regionStart, answerMatch.index);
    } else {
      region = block;
    }
    region = stripHeaderNoise(region, externalId);

    const format: "MCQ" | "SPR" = /^[A-D]$/.test(correctAnswer) ? "MCQ" : "SPR";

    let stimulus: string | null = null;
    let stem = "";
    let choices: ParsedChoice[] = [];

    if (format === "MCQ") {
      const parsed = parseChoices(region);
      choices = parsed.choices.map((c) => ({ ...c, isCorrect: c.label === correctAnswer }));
      const split = splitStimulusStem(parsed.stemPart);
      stimulus = split.stimulus;
      stem = split.stem;
      // Attach per-choice rationale from the explanation.
      const choiceRationales = splitChoiceRationales(explanation ?? "");
      for (const c of choices) {
        if (!c.isCorrect && choiceRationales[c.label]) c.rationaleWrong = choiceRationales[c.label];
      }
    } else {
      const split = splitStimulusStem(region);
      stimulus = split.stimulus;
      stem = split.stem;
    }

    const isRegression =
      section === "MATH" &&
      (/regression|line of best fit|scatterplot/i.test(`${stem} ${skill}`) ?? false);

    const issues = detectIssues({
      section,
      stem,
      stimulus,
      format,
      choices,
      correctAnswer,
      domain,
      skill,
      explanation,
    });
    const confidence = scoreConfidence(issues);
    // Any of these means a human must look before this is used in practice:
    //  - an MCQ without 4 usable choices (content missing / rendered as image),
    //  - garbled math, or
    //  - a referenced figure/table/graph whose visual didn't extract.
    const hardFail =
      (format === "MCQ" &&
        (choices.length < 4 || choices.some((c) => c.content.trim() === ""))) ||
      issues.some((x) => x.includes("Garbled") || x.includes("figure/table/graph"));
    const reviewStatus: "OK" | "NEEDS_REVIEW" =
      hardFail || confidence < CONFIDENCE_REVIEW_THRESHOLD ? "NEEDS_REVIEW" : "OK";

    results.push({
      externalId,
      section,
      domain: domain || "Uncategorized",
      skill: skill || "Uncategorized",
      difficulty,
      format,
      stimulus,
      stem,
      correctAnswer,
      explanation,
      choices,
      source: opts.source,
      isBluebook: false,
      requiresCalculator: section === "MATH",
      desmosRelevant: section === "MATH",
      isRegression,
      reviewStatus,
      importConfidence: confidence,
      importNotes: issues.length ? issues.join("; ") : null,
    });
  }

  return results;
}
