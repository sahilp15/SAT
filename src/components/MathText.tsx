"use client";

import { InlineMath, BlockMath } from "react-katex";
import React from "react";

// Renders text that may contain inline ($...$) and block ($$...$$) LaTeX.
// - "\$" is treated as a literal dollar sign (so "$80" prices work).
// - Blank lines become paragraph breaks; single newlines become line breaks.
//
// We tokenize manually rather than regex-splitting so escaped delimiters and
// multi-line math are handled correctly.

type Segment =
  | { type: "text"; value: string }
  | { type: "inline"; value: string }
  | { type: "block"; value: string };

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

    // Escaped dollar -> literal "$".
    if (ch === "\\" && next === "$") {
      text += "$";
      i += 2;
      continue;
    }

    if (ch === "$" && next === "$") {
      // Block math until the next unescaped "$$".
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
      // Inline math until the next unescaped "$".
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

function renderTextWithBreaks(value: string, keyBase: string): React.ReactNode[] {
  // Split into paragraphs on blank lines; preserve single newlines as <br/>.
  const parts: React.ReactNode[] = [];
  const lines = value.split("\n");
  lines.forEach((line, idx) => {
    parts.push(<React.Fragment key={`${keyBase}-l${idx}`}>{line}</React.Fragment>);
    if (idx < lines.length - 1) parts.push(<br key={`${keyBase}-br${idx}`} />);
  });
  return parts;
}

export function MathText({ children, className }: { children: string; className?: string }) {
  const segments = tokenize(children ?? "");
  return (
    <span className={className}>
      {segments.map((seg, idx) => {
        if (seg.type === "inline") {
          try {
            return <InlineMath key={idx} math={seg.value} />;
          } catch {
            return <code key={idx}>{seg.value}</code>;
          }
        }
        if (seg.type === "block") {
          try {
            return <BlockMath key={idx} math={seg.value} />;
          } catch {
            return <pre key={idx}>{seg.value}</pre>;
          }
        }
        return (
          <React.Fragment key={idx}>{renderTextWithBreaks(seg.value, `t${idx}`)}</React.Fragment>
        );
      })}
    </span>
  );
}
