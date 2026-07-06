"use client";

import { useMemo, useState } from "react";
import { MathText } from "./MathText";
import { DesmosCalculator } from "./DesmosCalculator";
import { extractDesmosExpressions } from "@/lib/desmos";

// The post-answer solution for a Math question: the official written
// explanation (rendered in a proper math font) plus an optional Desmos
// solution graph pre-loaded with the equations pulled from the question — the
// same graphical approach you'd use on the digital SAT.
export function DesmosSolution({
  explanation,
  stem,
  showExplanation = true,
}: {
  explanation: string | null;
  stem: string;
  showExplanation?: boolean;
}) {
  const [showGraph, setShowGraph] = useState(false);
  const exprs = useMemo(() => extractDesmosExpressions(stem), [stem]);

  return (
    <div className="space-y-3">
      {showExplanation && explanation ? (
        <div className="mathprose text-[0.95rem] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          <MathText autoMath>{explanation}</MathText>
        </div>
      ) : null}

      <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            📊 Solve it on Desmos
          </div>
          <button type="button" className="toolbtn" onClick={() => setShowGraph((s) => !s)}>
            {showGraph ? "Hide graph" : exprs.length ? "Show graphed solution" : "Open a graph"}
          </button>
        </div>
        {exprs.length ? (
          <p className="mt-1.5 text-xs" style={{ color: "var(--ink-faint)" }}>
            Pre-loaded with the equations from this problem. Read the answer from the
            point(s) of intersection.
          </p>
        ) : (
          <p className="mt-1.5 text-xs" style={{ color: "var(--ink-faint)" }}>
            Enter the equations to graph and solve visually.
          </p>
        )}
        {showGraph ? (
          <div className="mt-3 animate-fade-in">
            <DesmosCalculator expressions={exprs} height={360} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
