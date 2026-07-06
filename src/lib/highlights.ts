"use client";

// Text-annotation store built on the CSS Custom Highlight API. Highlights and
// underlines are drawn from live Range objects WITHOUT mutating the DOM, so
// they never fight React's reconciliation. All Highlightable instances share
// this one store, contributing ranges to two global named highlights.

export type AnnKind = "hl" | "ul";

interface Entry {
  id: string;
  range: Range;
  kind: AnnKind;
}

const entries = new Map<string, Entry>();

export function highlightsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as unknown as { Highlight?: unknown }).Highlight !== "undefined" &&
    typeof CSS !== "undefined" &&
    typeof (CSS as unknown as { highlights?: unknown }).highlights !== "undefined"
  );
}

function rebuild() {
  if (!highlightsSupported()) return;
  const hl = new Highlight();
  const ul = new Highlight();
  for (const e of entries.values()) {
    try {
      (e.kind === "hl" ? hl : ul).add(e.range);
    } catch {
      /* stale range — skip */
    }
  }
  CSS.highlights.set("sat-hl", hl);
  CSS.highlights.set("sat-ul", ul);
}

export function addAnnotation(id: string, range: Range, kind: AnnKind) {
  entries.set(id, { id, range, kind });
  rebuild();
}

export function removeAnnotation(id: string) {
  entries.delete(id);
  rebuild();
}

/** Remove all annotations whose id starts with the given prefix (one instance). */
export function clearScope(prefix: string) {
  let changed = false;
  for (const key of Array.from(entries.keys())) {
    if (key.startsWith(prefix)) {
      entries.delete(key);
      changed = true;
    }
  }
  if (changed) rebuild();
}

/** Entries within a scope that intersect the given range. */
export function intersecting(prefix: string, range: Range): Entry[] {
  const out: Entry[] = [];
  for (const e of entries.values()) {
    if (!e.id.startsWith(prefix)) continue;
    try {
      const before = range.compareBoundaryPoints(Range.END_TO_START, e.range) >= 0;
      const after = range.compareBoundaryPoints(Range.START_TO_END, e.range) <= 0;
      if (!before && !after) out.push(e);
    } catch {
      /* skip */
    }
  }
  return out;
}
