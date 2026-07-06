"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DesmosCalculator } from "./DesmosCalculator";

// A draggable, closable floating Desmos window — the same interaction model as
// the College Board digital-test calculator. Rendered on every Math question.
export function DesmosPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const winRef = useRef<HTMLDivElement | null>(null);

  // Initialise position to the right side once opened (client-only).
  useEffect(() => {
    if (open && pos === null && typeof window !== "undefined") {
      const w = 440;
      setPos({ x: Math.max(16, window.innerWidth - w - 32), y: 96 });
    }
  }, [open, pos]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current) return;
    const x = e.clientX - dragRef.current.dx;
    const y = e.clientY - dragRef.current.dy;
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 80;
    setPos({
      x: Math.min(Math.max(-120, x), maxX),
      y: Math.min(Math.max(8, y), maxY),
    });
  }, []);

  const stopDrag = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", stopDrag);
  }, [onPointerMove]);

  const startDrag = (e: React.PointerEvent) => {
    if (!winRef.current) return;
    const rect = winRef.current.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDrag);
  };

  useEffect(() => () => stopDrag(), [stopDrag]);

  if (!open || !pos) return null;

  return (
    <div
      ref={winRef}
      className="fixed z-50 w-[min(440px,92vw)] animate-fade-in rounded-xl border"
      style={{
        left: pos.x,
        top: pos.y,
        background: "var(--surface)",
        borderColor: "var(--border-strong)",
        boxShadow: "var(--tw-shadow, 0 10px 30px -10px rgb(16 24 40 / 0.35))",
      }}
    >
      <div
        onPointerDown={startDrag}
        className="flex cursor-grab items-center justify-between gap-2 rounded-t-xl border-b px-3 py-2 active:cursor-grabbing"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--ink)" }}>
          <span aria-hidden>📊</span> Desmos Graphing Calculator
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close calculator"
          className="rounded-md px-2 py-0.5 text-sm font-semibold"
          style={{ color: "var(--ink-faint)" }}
        >
          ✕
        </button>
      </div>
      <div className="p-2">
        <DesmosCalculator height={430} />
      </div>
    </div>
  );
}
