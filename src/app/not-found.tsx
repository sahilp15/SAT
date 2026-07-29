import Link from "next/link";
import { IconSearch } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-ink-3">
        <IconSearch size={22} />
      </span>
      <h1 className="text-xl text-ink">That page doesn&apos;t exist</h1>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-3">
        Press <kbd className="rounded border border-line px-1 font-mono text-[0.75rem]">⌘K</kbd> to
        search, or head back to the dashboard.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2.5">
        <Link href="/dashboard" className="btn btn-primary">
          Dashboard
        </Link>
        <Link href="/practice" className="btn btn-secondary">
          Practice
        </Link>
      </div>
    </div>
  );
}
