"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { IconCheckCircle, IconClose, IconInfo, IconAlert } from "./icons";
import { cx } from "./primitives";

// App-wide toasts. Announced politely to screen readers, auto-dismissed, and
// pausable — hovering the stack cancels the timers so a message can be read.

export type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  body?: string;
}

interface ToastApi {
  toast: (t: Omit<Toast, "id">) => void;
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DURATION_MS = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((t: Omit<Toast, "id">) => {
    setToasts((list) => [...list.slice(-2), { ...t, id: Date.now() + Math.random() }]);
  }, []);

  useEffect(() => {
    if (paused || toasts.length === 0) return;
    const timer = window.setTimeout(() => setToasts((list) => list.slice(1)), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toasts, paused]);

  const api = useMemo<ToastApi>(
    () => ({
      toast: push,
      success: (title, body) => push({ tone: "success", title, body }),
      error: (title, body) => push({ tone: "error", title, body }),
      info: (title, body) => push({ tone: "info", title, body }),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted
        ? createPortal(
            <div
              className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div aria-live="polite" aria-atomic="false" className="contents">
                {toasts.map((t) => (
                  <ToastRow key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
                ))}
              </div>
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}

function ToastRow({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon =
    toast.tone === "success" ? IconCheckCircle : toast.tone === "error" ? IconAlert : IconInfo;
  const iconColor =
    toast.tone === "success" ? "text-good" : toast.tone === "error" ? "text-bad" : "text-accent";
  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={cx(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border border-line bg-surface p-3.5 shadow-pop",
        "animate-fade-up"
      )}
    >
      <span className={cx("mt-0.5 shrink-0", iconColor)}>
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem] font-semibold text-ink">{toast.title}</p>
        {toast.body ? (
          <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-3">{toast.body}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 rounded p-1 text-ink-3 transition-colors hover:text-ink"
      >
        <IconClose size={14} />
      </button>
    </div>
  );
}

/**
 * Toasts are optional: components deep in the tree can call this without the
 * provider being present (e.g. in a test render) and simply get no-ops.
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  return (
    ctx ?? {
      toast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    }
  );
}
