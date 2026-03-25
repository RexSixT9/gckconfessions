export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8">
      {/* Hero skeleton */}
      <div className="flex flex-col gap-4 py-10 sm:py-16">
        <div className="skeleton h-5 w-36 rounded-sm" />
        <div className="skeleton h-14 w-3/4 max-w-xl rounded-md" />
        <div className="skeleton h-14 w-1/2 max-w-md rounded-md" />
        <div className="skeleton mt-2 h-5 w-full max-w-md rounded-lg" />
        <div className="mt-4 flex gap-3">
          <div className="skeleton h-11 w-40 rounded-md" />
          <div className="skeleton h-11 w-36 rounded-md" />
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-md border border-border/60 bg-card p-6">
            <div className="skeleton mb-4 h-10 w-10 rounded-md" />
            <div className="skeleton mb-2 h-5 w-32 rounded-lg" />
            <div className="skeleton h-4 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </main>
  );
}
