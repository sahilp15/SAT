"use client";

import { useEffect } from "react";
import Link from "next/link";
import { IconAlert, IconRefresh } from "@/components/ui/icons";

// Route-level error boundary. Shows a usable recovery path rather than a blank
// screen, and never leaks a stack trace into the UI.
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server logs carry the full detail; the digest is the link between them.
    console.error("Route error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bad-weak text-bad">
        <IconAlert size={22} />
      </span>
      <h1 className="text-xl text-ink">Something went wrong on this page</h1>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-3">
        Your progress is saved — this is a rendering problem, not a data problem. Try again, and if
        it persists check that the database has been migrated and seeded.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[0.6875rem] text-ink-3">ref {error.digest}</p>
      ) : null}
      <div className="mt-7 flex flex-wrap justify-center gap-2.5">
        <button type="button" className="btn btn-primary" onClick={reset}>
          <IconRefresh size={14} />
          Try again
        </button>
        <Link href="/dashboard" className="btn btn-secondary">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
