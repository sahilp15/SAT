// Validate the auto-math detection against the real Math bank: run every
// produced LaTeX fragment through KaTeX and report parse failures.
import fs from "fs";
import katex from "katex";

function tokenIsMath(tok) {
  const t = tok.trim();
  if (!t) return false;
  if (/[=<>≤≥≠]/.test(t)) return true;
  if (/\^/.test(t)) return true;
  if (/√|π|·|×|÷|≈|∞|°|𝓁|ℓ|∑|∏|∫|≤|≥|≠/.test(t)) return true;
  if (/^\(?-?[\d.]+\s*,\s*-?[\d.]+\)?$/.test(t)) return true;
  if (/^[A-Za-z]?\([^)]*[\d,][^)]*\)[.,;:]?$/.test(t)) return true;
  if (/\d[a-zA-Z]|[a-zA-Z]\d/.test(t)) return true;
  if (/^-?\d+\s*\/\s*\d+[.,;:]?$/.test(t)) return true;
  if (/^-?\$?\d[\d,]*\.?\d*%?$/.test(t) === false && /[+\-*/](?=.*\d)/.test(t) && /\d/.test(t)) {
    if (/[a-zA-Z0-9)][+\-*/][a-zA-Z0-9(]/.test(t)) return true;
  }
  return false;
}
function tokenIsConnector(tok) {
  return /^[=+\-*/<>≤≥≠·×÷]$/.test(tok.trim());
}
function toLatex(run) {
  let s = run.trim();
  s = s
    .replace(/<=/g, "\\le ").replace(/>=/g, "\\ge ").replace(/!=/g, "\\ne ")
    .replace(/≤/g, "\\le ").replace(/≥/g, "\\ge ").replace(/≠/g, "\\ne ")
    .replace(/≈/g, "\\approx ").replace(/·|×/g, "\\cdot ").replace(/÷/g, "\\div ")
    .replace(/π/g, "\\pi ").replace(/𝓁|ℓ/g, "\\ell ")
    .replace(/√\s*\(([^)]*)\)/g, "\\sqrt{$1}").replace(/√\s*([A-Za-z0-9.]+)/g, "\\sqrt{$1}")
    .replace(/√/g, "\\surd ").replace(/°/g, "^{\\circ}").replace(/\*/g, "\\cdot ");
  s = s.replace(/(?<![\w)])(-?\d+)\s*\/\s*(\d+)(?![\w(])/g, "\\dfrac{$1}{$2}");
  return s;
}
function autoMathRuns(line) {
  const words = line.split(/(\s+)/);
  const runs = [];
  let mathBuf = [];
  const flush = () => {
    if (mathBuf.length) {
      let joined = mathBuf.join("");
      const m = joined.match(/([.,;:]+)$/);
      if (m) joined = joined.slice(0, -m[1].length);
      if (joined.trim()) runs.push(toLatex(joined));
    }
    mathBuf = [];
  };
  for (let k = 0; k < words.length; k++) {
    const w = words[k];
    if (/^\s+$/.test(w)) {
      if (mathBuf.length) {
        const nx = words[k + 1] ?? "";
        if (tokenIsMath(nx) || tokenIsConnector(nx)) mathBuf.push(w);
        else flush();
      }
      continue;
    }
    if (tokenIsMath(w) || (mathBuf.length > 0 && tokenIsConnector(w))) mathBuf.push(w);
    else flush();
  }
  flush();
  return runs;
}

const math = JSON.parse(fs.readFileSync("prisma/bankMath.json", "utf-8"));
let total = 0, fail = 0;
const failures = [];
for (const q of math) {
  const texts = [q.stem, q.explanation, ...(q.choices || []).map((c) => c.content)];
  for (const t of texts) {
    if (!t) continue;
    for (const line of t.split("\n")) {
      for (const run of autoMathRuns(line)) {
        total++;
        try {
          katex.renderToString(run, { throwOnError: true });
        } catch (e) {
          fail++;
          if (failures.length < 25) failures.push({ run, err: String(e).split("\n")[0] });
        }
      }
    }
  }
}
console.log(`Auto-math fragments: ${total}, KaTeX failures: ${fail}`);
for (const f of failures) console.log("  FAIL:", JSON.stringify(f.run), "|", f.err);
