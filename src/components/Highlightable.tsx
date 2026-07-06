"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  addAnnotation,
  clearScope,
  highlightsSupported,
  intersecting,
  removeAnnotation,
  type AnnKind,
} from "@/lib/highlights";

interface PopoverState {
  x: number;
  y: number;
  range: Range;
  hasExisting: boolean;
}

// Wraps text content and lets the user drag-select to highlight or underline,
// mirroring the digital SAT annotation tools. Uses the CSS Custom Highlight API
// so nothing in the DOM is mutated.
export function Highlightable({
  children,
  className,
  // Changing `resetKey` (e.g. per question) clears this instance's annotations.
  resetKey,
  enabled = true,
}: {
  children: React.ReactNode;
  className?: string;
  resetKey?: string | number;
  enabled?: boolean;
}) {
  const scope = useId();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const counter = useRef(0);
  const [pop, setPop] = useState<PopoverState | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => setSupported(highlightsSupported()), []);

  // Clear this instance's annotations when the content changes.
  useEffect(() => {
    clearScope(scope);
    setPop(null);
    return () => clearScope(scope);
  }, [scope, resetKey]);

  const onMouseUp = useCallback(() => {
    if (!enabled || !supported) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setPop(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const host = hostRef.current;
    if (!host || !host.contains(range.commonAncestorContainer)) {
      setPop(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    const existing = intersecting(scope, range.cloneRange());
    setPop({
      x: rect.left + rect.width / 2,
      y: rect.top,
      range: range.cloneRange(),
      hasExisting: existing.length > 0,
    });
  }, [enabled, supported, scope]);

  const annotate = (kind: AnnKind) => {
    if (!pop) return;
    const id = `${scope}-${counter.current++}`;
    addAnnotation(id, pop.range, kind);
    window.getSelection()?.removeAllRanges();
    setPop(null);
  };

  const removeHere = () => {
    if (!pop) return;
    for (const e of intersecting(scope, pop.range)) removeAnnotation(e.id);
    window.getSelection()?.removeAllRanges();
    setPop(null);
  };

  // Dismiss popover on outside interaction / scroll.
  useEffect(() => {
    if (!pop) return;
    const dismiss = (e: Event) => {
      const t = e.target as Node;
      if (t instanceof Element && t.closest("[data-ann-pop]")) return;
      setPop(null);
    };
    const onScroll = () => setPop(null);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("mousedown", dismiss);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("mousedown", dismiss);
    };
  }, [pop]);

  return (
    <>
      <div ref={hostRef} onMouseUp={onMouseUp} className={className}>
        {children}
      </div>
      {pop ? (
        <div
          data-ann-pop
          className="fixed z-50 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-lg border p-1 animate-fade-in"
          style={{
            left: pop.x,
            top: pop.y - 8,
            background: "var(--surface)",
            borderColor: "var(--border-strong)",
            boxShadow: "var(--shadow-pop, 0 6px 20px -6px rgb(16 24 40 / 0.28))",
          }}
        >
          <button type="button" className="toolbtn" onMouseDown={(e) => e.preventDefault()} onClick={() => annotate("hl")}>
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "var(--highlight)" }} />
            Highlight
          </button>
          <button type="button" className="toolbtn" onMouseDown={(e) => e.preventDefault()} onClick={() => annotate("ul")}>
            <span className="underline decoration-2" style={{ textDecorationColor: "var(--accent)" }}>U</span>
            Underline
          </button>
          {pop.hasExisting ? (
            <button type="button" className="toolbtn" onMouseDown={(e) => e.preventDefault()} onClick={removeHere}>
              ✕ Remove
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
