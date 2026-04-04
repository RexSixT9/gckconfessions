import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-14"
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      {/* Hero skeleton */}
      <div className="flex flex-col gap-4 py-12 sm:py-20">
        <Skeleton className="h-5 w-32 rounded-full" />
        <Skeleton className="h-14 w-3/4 max-w-lg rounded-xl" />
        <Skeleton className="h-14 w-1/2 max-w-sm rounded-xl" />
        <Skeleton className="mt-2 h-5 w-full max-w-md rounded-lg" />
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-11 w-40 rounded-full" />
          <Skeleton className="h-11 w-36 rounded-full" />
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border/50 bg-card p-6">
            <Skeleton className="mb-4 h-10 w-10 rounded-xl" />
            <Skeleton className="mb-2 h-5 w-32 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </main>
  );
}
