export default function SubmitLoading() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Back button */}
      <div className="skeleton mb-8 h-9 w-32 rounded-xl" />

      {/* Main card */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        {/* Card header */}
        <div className="mb-6 space-y-3">
          <div className="skeleton h-5 w-36 rounded-full" />
          <div className="skeleton h-8 w-64 rounded-xl" />
          <div className="skeleton h-4 w-full max-w-sm rounded-lg" />
        </div>

        {/* Textarea placeholder */}
        <div className="skeleton mb-4 h-56 rounded-xl" />

        {/* Char counter strip */}
        <div className="mb-5 flex justify-between">
          <div className="skeleton h-4 w-24 rounded-lg" />
          <div className="skeleton h-4 w-16 rounded-lg" />
        </div>

        {/* Music input */}
        <div className="skeleton mb-6 h-10 w-full rounded-lg" />

        {/* Safety checklist */}
        <div className="mb-6 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="skeleton h-4 w-4 rounded-full" />
              <div className="skeleton h-4 w-40 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Submit button */}
        <div className="skeleton h-11 w-full rounded-xl" />
      </div>
    </main>
  );
}
