import { Skeleton } from "@/components/ui/skeleton";

export default function SubmitLoading() {
  return (
    <main
      className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12"
      role="status"
      aria-live="polite"
      aria-label="Loading submission form"
    >
      {/* Back button */}
      <Skeleton className="mb-6 h-8 w-28 rounded-full" />

      {/* Main card */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card p-6 sm:p-8">
        {/* Card header */}
        <div className="mb-6 space-y-3">
          <Skeleton className="h-5 w-36 rounded-full" />
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-sm rounded-lg" />
        </div>

        {/* Textarea placeholder */}
        <Skeleton className="mb-4 h-52 rounded-xl" />

        {/* Char counter strip */}
        <div className="mb-5 flex justify-between">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="h-4 w-16 rounded-lg" />
        </div>

        {/* Music input */}
        <Skeleton className="mb-6 h-10 w-full rounded-lg" />

        {/* Safety checklist */}
        <div className="mb-6 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-40 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Submit button */}
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </main>
  );
}
