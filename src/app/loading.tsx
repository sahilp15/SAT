import { CardSkeleton, Skeleton } from "@/components/ui/primitives";

// Shared route-loading skeleton. Mirrors the common page shape — header, stat
// row, content grid — so navigation feels like the page filling in rather than
// a spinner replacing everything.
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-7 w-64" />
        <Skeleton className="mt-2.5 h-3.5 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-6 w-16" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CardSkeleton lines={5} />
        </div>
        <CardSkeleton lines={4} />
      </div>
    </div>
  );
}
