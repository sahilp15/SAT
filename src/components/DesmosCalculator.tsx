"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { loadDesmos, type DesmosExpr } from "@/lib/desmos";

interface Props {
  // Pre-loaded expressions (used by solution graphs). Omit for a blank calc.
  expressions?: DesmosExpr[];
  className?: string;
  height?: number | string;
}

// A real Desmos GraphingCalculator, mounted via the Desmos JS API. This is the
// same graphing engine used by the College Board digital SAT test calculator.
export function DesmosCalculator({ expressions, className = "", height = 420 }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const calcRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Mount the calculator once.
  useEffect(() => {
    let cancelled = false;
    let calc: any = null;
    loadDesmos()
      .then((Desmos) => {
        if (cancelled || !hostRef.current) return;
        calc = Desmos.GraphingCalculator(hostRef.current, {
          keypad: true,
          expressions: true,
          settingsMenu: true,
          zoomButtons: true,
          expressionsTopbar: true,
          border: false,
          lockViewport: false,
          graphpaper: true,
          fontSize: 15,
        });
        calcRef.current = calc;
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
      try {
        calc?.destroy?.();
      } catch {
        /* noop */
      }
      calcRef.current = null;
    };
  }, []);

  // Apply / update pre-loaded expressions.
  useEffect(() => {
    const calc = calcRef.current;
    if (!calc || status !== "ready") return;
    calc.setBlank();
    if (expressions && expressions.length) {
      expressions.forEach((e, i) =>
        calc.setExpression({ id: `sol-${i}`, latex: e.latex, color: e.color })
      );
    }
  }, [expressions, status]);

  const h = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${className}`}
      style={{ borderColor: "var(--border-strong)", height: h }}
    >
      <div ref={hostRef} className="h-full w-full" />
      {status !== "ready" ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm"
          style={{ background: "var(--surface)", color: "var(--ink-faint)" }}
        >
          {status === "loading" ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading Desmos…
            </>
          ) : (
            <div className="max-w-xs text-center">
              Couldn&apos;t load the Desmos calculator (offline?).{" "}
              <a
                className="font-semibold underline"
                href="https://www.desmos.com/calculator"
                target="_blank"
                rel="noreferrer"
              >
                Open Desmos in a new tab →
              </a>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
