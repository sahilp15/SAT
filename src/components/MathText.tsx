"use client";

import { InlineMath, BlockMath } from "react-katex";
import React from "react";

// Renders SAT question text that may contain:
//   - inline math:  $...$   or  \(...\)
//   - block math:   $$...$$ or  \[...\]
//   - markdown pipe tables (for data/scatterplot tables)
//   - "\$" as a literal dollar sign (so "$80" prices work)
// Blank lines become paragraph breaks; single newlines become line breaks.
//
// We tokenize manually so escaped delimiters and multi-line math are handled
// correctly, and KaTeX (via react-katex) renders the math with proper notation.

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

function renderInlineSegments(value: string, keyBase: string): React.ReactNode {
  const segments = tokenize(value);
  return segments.map((seg, idx) => {
    if (seg.type === "inline") {
      return <InlineMath key={`${keyBase}-i${idx}`} math={seg.value} />;
    }
    if (seg.type === "block") {
      return <BlockMath key={`${keyBase}-b${idx}`} math={seg.value} />;
    }
    // plain text with line breaks
    const lines = seg.value.split("\n");
    return (
      <React.Fragment key={`${keyBase}-t${idx}`}>
        {lines.map((line, li) => (
          <React.Fragment key={li}>
            {line}
            {li < lines.length - 1 ? <br /> : null}
          </React.Fragment>
        ))}
      </React.Fragment>
    );
  });
}

// A markdown table is a run of >= 2 consecutive lines that start & end with "|".
// The 2nd line (---|---) is treated as the header separator if present.
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

function Table({ lines, keyBase }: { lines: string[]; keyBase: string }) {
  const rows = lines.map(parseTableCells);
  let header: string[] | null = null;
  let body = rows;
  if (rows.length >= 2 && isSeparatorRow(rows[1])) {
    header = rows[0];
    body = rows.slice(2);
  }
  return (
    <div className="my-3 overflow-x-auto">
      <table className="min-w-[240px] border-collapse text-sm">
        {header ? (
          <thead>
            <tr>
              {header.map((c, i) => (
                <th
                  key={i}
                  className="border border-slate-300 bg-slate-100 px-3 py-1.5 text-left font-semibold"
                >
                  {renderInlineSegments(c, `${keyBase}-h${i}`)}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {body.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} className="border border-slate-300 px-3 py-1.5">
                  {renderInlineSegments(c, `${keyBase}-r${ri}c${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Split content into table blocks and non-table blocks, preserving order.
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

export function MathText({ children, className }: { children: string; className?: string }) {
  const normalized = normalizeDelimiters(children ?? "");
  const blocks = splitBlocks(normalized);
  return (
    <span className={className}>
      {blocks.map((blk, idx) => {
        if (blk.type === "table" && blk.lines.length >= 2) {
          return <Table key={`tbl${idx}`} lines={blk.lines} keyBase={`tbl${idx}`} />;
        }
        return (
          <React.Fragment key={`txt${idx}`}>
            {renderInlineSegments(blk.lines.join("\n"), `txt${idx}`)}
          </React.Fragment>
        );
      })}
    </span>
  );
}
