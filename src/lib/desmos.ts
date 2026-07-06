// Desmos integration helpers.
//
// We embed the real Desmos GraphingCalculator via its public JS API (the same
// engine behind the College Board test calculator). The script is loaded once
// and cached. For "Desmos solutions" we also derive graphable expressions from
// a question's text so the calculator can open pre-loaded with the relevant
// equations — showing how the problem is solved graphically.

/* eslint-disable @typescript-eslint/no-explicit-any */

const DESMOS_API_KEY = "dcb31709b452b1cf9dc26972add0fda6"; // Desmos public demo key
const DESMOS_SRC = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${DESMOS_API_KEY}`;

let desmosPromise: Promise<any> | null = null;

/** Load the Desmos API script once; resolves with the global `Desmos`. */
export function loadDesmos(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if ((window as any).Desmos) return Promise.resolve((window as any).Desmos);
  if (desmosPromise) return desmosPromise;
  desmosPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-desmos]");
    const done = () =>
      (window as any).Desmos
        ? resolve((window as any).Desmos)
        : reject(new Error("Desmos loaded but global missing"));
    if (existing) {
      existing.addEventListener("load", done);
      existing.addEventListener("error", () => reject(new Error("Desmos script error")));
      if ((window as any).Desmos) done();
      return;
    }
    const s = document.createElement("script");
    s.src = DESMOS_SRC;
    s.async = true;
    s.dataset.desmos = "true";
    s.onload = done;
    s.onerror = () => reject(new Error("Desmos script failed to load"));
    document.head.appendChild(s);
  });
  return desmosPromise;
}

export interface DesmosExpr {
  latex: string;
  color?: string;
}

// Convert a plain-text math expression into Desmos/LaTeX-friendly form.
function toDesmosLatex(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/<=/g, "\\le ")
    .replace(/>=/g, "\\ge ")
    .replace(/π/g, "\\pi ")
    .replace(/·|×|\*/g, "\\cdot ")
    .replace(/√\s*\(([^)]*)\)/g, "\\sqrt{$1}")
    .replace(/√\s*([A-Za-z0-9.]+)/g, "\\sqrt{$1}")
    .replace(/\^(\d+)/g, "^{$1}")
    .replace(/\^\(([^)]*)\)/g, "^{$1}");
}

const LEADING_WORDS = /^(if|when|where|given|and|so|then|that|since|because|is|of|the|for|in|by|line|equation)\b[\s:]*/i;

// Strip prose words that cling to the front of an extracted equation.
function trimEquation(eq: string): string {
  let s = eq.trim().replace(/[.,;:]+$/, "");
  let prev;
  do {
    prev = s;
    s = s.replace(LEADING_WORDS, "").trim();
  } while (s !== prev);
  return s;
}

// A clean two-sided relation with no lingering prose words.
function isCleanRelation(eq: string): boolean {
  if (!/[<>=]/.test(eq)) return false;
  const sides = eq.split(/[<>=]+/);
  if (sides.length !== 2) return false;
  if (sides.some((p) => p.trim().length === 0)) return false;
  // No multi-letter prose words remain (function names f/g/h are fine).
  const stripped = eq.replace(/sqrt|pi|cdot|frac/g, "");
  if (/[A-Za-z]{3,}/.test(stripped)) return false;
  // Must contain a variable somewhere.
  return /[a-wyz]|x/i.test(eq);
}

/**
 * Extract graphable equations from question text so a solution graph can be
 * pre-loaded. For a one-variable equation (contains x, no y) we emit BOTH sides
 * as y = … so the intersection reveals the solution — the standard Desmos SAT
 * technique. Best-effort: returns [] when nothing clean is found.
 */
export function extractDesmosExpressions(text: string): DesmosExpr[] {
  if (!text) return [];
  const colors = ["#274bd6", "#0b8a5f", "#d1435b", "#b5730b", "#7b3fe4"];
  const found = new Set<string>();
  const exprs: DesmosExpr[] = [];
  const push = (latex: string) => {
    if (!latex || found.has(latex) || exprs.length >= 6) return;
    found.add(latex);
    exprs.push({ latex, color: colors[exprs.length % colors.length] });
  };

  const candidates =
    text.match(/[0-9A-Za-z().^√π\/\s+\-*=<>≤≥·×]*[=<>≤≥][0-9A-Za-z().^√π\/\s+\-*=<>≤≥·×]*/g) ?? [];

  for (const rawLine of candidates) {
    const raw = rawLine.replace(/\s{2,}/g, " ").trim();
    // A line may stack equations ("y=6x+3 y=6x+9"): split before a fresh "lhs=".
    const parts = raw.split(/\s+(?=(?:[a-zA-Z]\s*\(?[a-zA-Z]?\)?\s*=|[xy]\s*=))/);
    for (const p of parts) {
      const eq = trimEquation(p);
      if (!isCleanRelation(eq)) continue;
      const hasY = /y/.test(eq);
      const hasX = /x/.test(eq);
      if (hasX && !hasY && /=/.test(eq)) {
        // One-variable equation A = B → graph y=A and y=B (intersection = answer).
        const [lhs, rhs] = eq.split("=");
        push("y=" + toDesmosLatex(lhs));
        push("y=" + toDesmosLatex(rhs));
      } else {
        push(toDesmosLatex(eq));
      }
      if (exprs.length >= 6) break;
    }
    if (exprs.length >= 6) break;
  }
  return exprs;
}
