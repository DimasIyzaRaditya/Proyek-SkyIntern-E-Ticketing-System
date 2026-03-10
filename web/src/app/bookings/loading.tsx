/** Bookings page loading skeleton — mirrors the real booking card layout */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      {/* Nav */}
      <div className="sticky top-0 z-30 border-b border-blue-100 bg-white/95 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="skeleton h-7 w-36 rounded-lg" />
          <div className="flex gap-2">
            <div className="skeleton h-8 w-16 rounded-lg" />
            <div className="skeleton h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Page title */}
        <div className="skeleton mb-1 h-8 w-40 rounded-xl" />
        <div className="skeleton mb-6 h-4 w-64 rounded" />

        {/* Tab bar — Upcoming / Completed / Cancelled */}
        <div className="mb-6 flex gap-1 rounded-2xl border border-blue-100 bg-white p-1.5 shadow-sm">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-9 flex-1 rounded-xl" />
          ))}
        </div>

        {/* Booking cards */}
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                {/* Left: airline + route + date + flight/seat info */}
                <div className="space-y-1.5">
                  {/* Airline icon + name */}
                  <div className="flex items-center gap-2">
                    <div className="skeleton h-4 w-4 rounded" />
                    <div className="skeleton h-5 w-36 rounded-lg" />
                  </div>
                  {/* Route */}
                  <div className="skeleton h-4 w-48 rounded" />
                  {/* Date */}
                  <div className="flex items-center gap-1">
                    <div className="skeleton h-3.5 w-3.5 rounded" />
                    <div className="skeleton h-3.5 w-28 rounded" />
                  </div>
                  {/* Flight number + seat */}
                  <div className="flex items-center gap-1">
                    <div className="skeleton h-3.5 w-3.5 rounded" />
                    <div className="skeleton h-3.5 w-44 rounded" />
                  </div>
                </div>

                {/* Right: status badge + action buttons */}
                <div className="flex flex-col items-start gap-2 md:items-end">
                  <div className="skeleton h-7 w-24 rounded-full" />
                  <div className="flex flex-wrap gap-2">
                    <div className="skeleton h-9 w-24 rounded-xl" />
                    <div className="skeleton h-9 w-32 rounded-xl" />
                    <div className="skeleton h-9 w-32 rounded-xl bg-blue-100" />
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

