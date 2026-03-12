export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-14">
      {/* Hero skeleton */}
      <div className="flex flex-col gap-4 py-12 sm:py-20">
        <div className="skeleton h-5 w-32 rounded-full" />
        <div className="skeleton h-14 w-3/4 max-w-lg rounded-xl" />
        <div className="skeleton h-14 w-1/2 max-w-sm rounded-xl" />
        <div className="skeleton mt-2 h-5 w-full max-w-md rounded-lg" />
        <div className="mt-4 flex gap-3">
          <div className="skeleton h-11 w-40 rounded-full" />
          <div className="skeleton h-11 w-36 rounded-full" />
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border/50 bg-card p-6">
            <div className="skeleton mb-4 h-10 w-10 rounded-xl" />
            <div className="skeleton mb-2 h-5 w-32 rounded-lg" />
            <div className="skeleton h-4 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </main>
  );
}
