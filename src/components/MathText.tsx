"use client";

import { InlineMath, BlockMath } from "react-katex";
import React from "react";

// Renders SAT question text that may contain:
//   - inline math:  $...$   or  \(...\)
//   - block math:   $$...$$ or  \[...\]
//   - markdown pipe tables (for data/scatterplot tables)
//   - "\$" as a literal dollar sign (so "$80" prices work)
//
// When `autoMath` is set (Math section), plain-text mathematical expressions
// that were not wrapped in delimiters — e.g. "3x-8=7", "(0,-5)", "h(x)=-x+41" —
// are detected and rendered through KaTeX too, so every Math item reads in a
// proper math font. Prose stays in the body font.

type Segment =
  | { type: "text"; value: string }
  | { type: "inline"; value: string }
  | { type: "block"; value: string };

// Convert LaTeX \(...\) and \[...\] delimiters to the $/$$ forms the tokenizer
// understands. Done first so downstream logic only handles one delimiter style.
function normalizeDelimiters(input: string): string {
  return input
    .replace(/\\\[/g, "$$$$")
    .replace(/\\\]/g, "$$$$")
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$");
}

function tokenize(input: string): Segment[] {
  const segments: Segment[] = [];
  let i = 0;
  let text = "";
  const pushText = () => {
    if (text) segments.push({ type: "text", value: text });
    text = "";
  };

  while (i < input.length) {
    const ch = input[i];
    const next = input[i + 1];

    if (ch === "\\" && next === "$") {
      text += "$";
      i += 2;
      continue;
    }

    if (ch === "$" && next === "$") {
      const end = input.indexOf("$$", i + 2);
      if (end === -1) {
        text += "$$";
        i += 2;
        continue;
      }
      pushText();
      segments.push({ type: "block", value: input.slice(i + 2, end) });
      i = end + 2;
      continue;
    }

    if (ch === "$") {
      let j = i + 1;
      while (j < input.length) {
        if (input[j] === "\\" && input[j + 1] === "$") {
          j += 2;
          continue;
        }
        if (input[j] === "$") break;
        j++;
      }
      if (j >= input.length) {
        text += "$";
        i += 1;
        continue;
      }
      pushText();
      segments.push({ type: "inline", value: input.slice(i + 1, j) });
      i = j + 1;
      continue;
    }

    text += ch;
    i += 1;
  }
  pushText();
  return segments;
}

// ---------------------------------------------------------------------------
// Auto-math: detect plain-text math and turn it into LaTeX.
// ---------------------------------------------------------------------------

// A token "looks like math" if it carries clear mathematical signal: an
// operator/relation, a coordinate/paren group, exponent, fraction, a
// digit-adjacent variable (3x), function application f(...), or units like a
// bare number tied to symbols. Standalone plain words never match.
function tokenIsMath(tok: string): boolean {
  const t = tok.trim();
  if (!t) return false;
  // Relations / operators (but not a lone hyphen inside a word).
  if (/[=<>≤≥≠]/.test(t)) return true;
  if (/\^/.test(t)) return true; // exponent
  if (/√|π|·|×|÷|≈|∞|°|𝓁|ℓ|∑|∏|∫|≤|≥|≠/.test(t)) return true;
  // Coordinate or grouped expression: (…,…) or (number/expr)
  if (/^\(?-?[\d.]+\s*,\s*-?[\d.]+\)?$/.test(t)) return true;
  if (/^[A-Za-z]?\([^)]*[\d,][^)]*\)[.,;:]?$/.test(t)) return true; // f(2), h(x), (3,4)
  // Digit adjacent to a variable letter (3x, 2y, x2 is rarer) or fraction a/b.
  if (/\d[a-zA-Z]|[a-zA-Z]\d/.test(t)) return true;
  if (/^-?\d+\s*\/\s*\d+[.,;:]?$/.test(t)) return true; // 3/4 fraction
  if (/^-?\$?\d[\d,]*\.?\d*%?$/.test(t) === false && /[+\-*/](?=.*\d)/.test(t) && /\d/.test(t)) {
    // arithmetic like 12+7 or 3*4 but not a plain signed number
    if (/[a-zA-Z0-9)][+\-*/][a-zA-Z0-9(]/.test(t)) return true;
  }
  return false;
}

// Some tokens are "connectors" that belong to a math run when sandwiched
// between math tokens: a lone operator/relation.
function tokenIsConnector(tok: string): boolean {
  return /^[=+\-*/<>≤≥≠·×÷]$/.test(tok.trim());
}

// Convert a detected plain math run into a KaTeX-friendly LaTeX string.
function toLatex(run: string): string {
  let s = run.trim();
  // Preserve a trailing sentence punctuation outside the math (handled by caller).
  s = s
    .replace(/<=/g, "\\le ")
    .replace(/>=/g, "\\ge ")
    .replace(/!=/g, "\\ne ")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/≠/g, "\\ne ")
    .replace(/≈/g, "\\approx ")
    .replace(/·|×/g, "\\cdot ")
    .replace(/÷/g, "\\div ")
    .replace(/π/g, "\\pi ")
    .replace(/𝓁|ℓ/g, "\\ell ")
    .replace(/√\s*\(([^)]*)\)/g, "\\sqrt{$1}")
    .replace(/√\s*([A-Za-z0-9.]+)/g, "\\sqrt{$1}")
    .replace(/√/g, "\\surd ")
    .replace(/°/g, "^{\\circ}")
    .replace(/\*/g, "\\cdot ");
  // Simple integer fractions a/b -> \frac{a}{b} (avoid touching f(x)/g(x)).
  s = s.replace(/(?<![\w)])(-?\d+)\s*\/\s*(\d+)(?![\w(])/g, "\\dfrac{$1}{$2}");
  return s;
}

// Split a line of plain text into interleaved text + auto-detected math spans.
function autoMathSegments(line: string): Segment[] {
  const words = line.split(/(\s+)/); // keep whitespace tokens
  const out: Segment[] = [];
  let textBuf = "";
  let mathBuf: string[] = [];

  const flushText = () => {
    if (textBuf) out.push({ type: "text", value: textBuf });
    textBuf = "";
  };
  const flushMath = () => {
    if (mathBuf.length) {
      // Strip trailing sentence punctuation off the last token into text.
      let joined = mathBuf.join("");
      let trailing = "";
      const m = joined.match(/([.,;:]+)$/);
      if (m) {
        trailing = m[1];
        joined = joined.slice(0, -trailing.length);
      }
      flushText();
      out.push({ type: "inline", value: toLatex(joined) });
      if (trailing) out.push({ type: "text", value: trailing });
    }
    mathBuf = [];
  };

  for (let k = 0; k < words.length; k++) {
    const w = words[k];
    if (/^\s+$/.test(w)) {
      // whitespace: keep inside a math run if the next non-space is math
      if (mathBuf.length) {
        const nextTok = words[k + 1] ?? "";
        if (tokenIsMath(nextTok) || tokenIsConnector(nextTok)) {
          mathBuf.push(w);
        } else {
          flushMath();
          textBuf += w;
        }
      } else {
        textBuf += w;
      }
      continue;
    }
    const isMath =
      tokenIsMath(w) || (mathBuf.length > 0 && tokenIsConnector(w));
    if (isMath) {
      if (!mathBuf.length) flushText();
      mathBuf.push(w);
    } else {
      flushMath();
      textBuf += w;
    }
  }
  flushMath();
  flushText();
  return out;
}

function renderSegment(seg: Segment, key: string): React.ReactNode {
  if (seg.type === "inline") {
    try {
      return <InlineMath key={key} math={seg.value} />;
    } catch {
      return <span key={key}>{seg.value}</span>;
    }
  }
  if (seg.type === "block") {
    return <BlockMath key={key} math={seg.value} />;
  }
  const lines = seg.value.split("\n");
  return (
    <React.Fragment key={key}>
      {lines.map((line, li) => (
        <React.Fragment key={li}>
          {line}
          {li < lines.length - 1 ? <br /> : null}
        </React.Fragment>
      ))}
    </React.Fragment>
  );
}

function renderInlineSegments(
  value: string,
  keyBase: string,
  autoMath: boolean
): React.ReactNode {
  const segments = tokenize(value);
  const expanded: { seg: Segment; key: string }[] = [];
  segments.forEach((seg, idx) => {
    if (autoMath && seg.type === "text") {
      // Auto-detect math within each text line, preserving newlines.
      const lines = seg.value.split("\n");
      lines.forEach((line, li) => {
        autoMathSegments(line).forEach((s, si) =>
          expanded.push({ seg: s, key: `${keyBase}-a${idx}-${li}-${si}` })
        );
        if (li < lines.length - 1) {
          expanded.push({ seg: { type: "text", value: "\n" }, key: `${keyBase}-nl${idx}-${li}` });
        }
      });
    } else {
      expanded.push({ seg, key: `${keyBase}-s${idx}` });
    }
  });
  return expanded.map(({ seg, key }) => renderSegment(seg, key));
}

// A markdown table is a run of >= 2 consecutive lines that start & end with "|".
function isTableLine(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.endsWith("|") && t.length > 1;
}

function parseTableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.every((c) => /^:?-{2,}:?$/.test(c.replace(/\s/g, "")) || /^-+$/.test(c));
}

function Table({
  lines,
  keyBase,
  autoMath,
}: {
  lines: string[];
  keyBase: string;
  autoMath: boolean;
}) {
  const rows = lines.map(parseTableCells);
  let header: string[] | null = null;
  let body = rows;
  if (rows.length >= 2 && isSeparatorRow(rows[1])) {
    header = rows[0];
    body = rows.slice(2);
  }
  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-auto border-collapse font-math text-[0.95rem]">
        {header ? (
          <thead>
            <tr>
              {header.map((c, i) => (
                <th
                  key={i}
                  className="border px-3.5 py-2 text-center font-semibold"
                  style={{
                    borderColor: "var(--border-strong)",
                    background: "var(--surface-2)",
                    color: "var(--ink)",
                  }}
                >
                  {renderInlineSegments(c, `${keyBase}-h${i}`, autoMath)}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {body.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td
                  key={ci}
                  className="border px-3.5 py-2 text-center"
                  style={{ borderColor: "var(--border-strong)", color: "var(--ink)" }}
                >
                  {renderInlineSegments(c, `${keyBase}-r${ri}c${ci}`, autoMath)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function splitBlocks(input: string): { type: "table" | "text"; lines: string[] }[] {
  const out: { type: "table" | "text"; lines: string[] }[] = [];
  const lines = input.split("\n");
  let buf: string[] = [];
  let mode: "table" | "text" = "text";
  const flush = () => {
    if (buf.length) out.push({ type: mode, lines: buf });
    buf = [];
  };
  for (const line of lines) {
    const t: "table" | "text" = isTableLine(line) ? "table" : "text";
    if (t !== mode) {
      flush();
      mode = t;
    }
    buf.push(line);
  }
  flush();
  return out;
}

export function MathText({
  children,
  className,
  autoMath = false,
}: {
  children: string;
  className?: string;
  autoMath?: boolean;
}) {
  const normalized = normalizeDelimiters(children ?? "");
  const blocks = splitBlocks(normalized);
  return (
    <span className={className}>
      {blocks.map((blk, idx) => {
        if (blk.type === "table" && blk.lines.length >= 2) {
          return (
            <Table key={`tbl${idx}`} lines={blk.lines} keyBase={`tbl${idx}`} autoMath={autoMath} />
          );
        }
        return (
          <React.Fragment key={`txt${idx}`}>
            {renderInlineSegments(blk.lines.join("\n"), `txt${idx}`, autoMath)}
          </React.Fragment>
        );
      })}
    </span>
  );
}
