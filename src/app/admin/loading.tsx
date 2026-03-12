export default function AdminLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      {/* Page header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="skeleton h-5 w-24 rounded-full" />
          <div className="skeleton h-10 w-56 rounded-xl" />
          <div className="skeleton h-4 w-72 rounded-lg" />
        </div>
        <div className="skeleton h-9 w-28 rounded-full" />
      </div>

      {/* Stats bar */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border/50 bg-card px-4 py-4 sm:px-6 sm:py-5">
            <div className="skeleton mb-3 h-4 w-20 rounded-lg" />
            <div className="skeleton h-9 w-16 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Main list card */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card p-6 sm:p-8">
        {/* Toolbar */}
        <div className="mb-5 flex gap-3">
          <div className="skeleton h-9 flex-1 rounded-xl" />
          <div className="skeleton h-9 w-20 rounded-xl" />
        </div>

        {/* Filter pills */}
        <div className="mb-5 flex gap-2 pb-4">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="skeleton h-8 w-64 rounded-lg" />
        </div>

        {/* Confession cards */}
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border/50">
              <div className="px-5 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="skeleton h-5 w-16 rounded-full" />
                  <div className="skeleton h-5 w-12 rounded-full" />
                  <div className="skeleton ml-auto h-4 w-28 rounded-lg" />
                </div>
                <div className="skeleton h-16 rounded-xl" />
                <div className="mt-3 flex gap-2">
                  <div className="skeleton h-7 w-24 rounded-lg" />
                  <div className="skeleton h-7 w-20 rounded-lg" />
                  <div className="skeleton ml-auto h-7 w-16 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
