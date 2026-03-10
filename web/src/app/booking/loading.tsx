/** Booking flow (seat / passenger / payment) loading skeleton */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eff6ff_0%,#f8faff_100%)]">
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

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton h-9 w-9 rounded-full" />
              {i < 2 && <div className="skeleton h-1 w-12 rounded-full" />}
            </div>
          ))}
        </div>

        {/* Flight summary card */}
        <div className="mb-5 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="skeleton mb-3 h-5 w-32 rounded-lg" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="skeleton h-6 w-20 rounded-lg" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
            <div className="skeleton h-px w-16 rounded" />
            <div className="space-y-2 text-right">
              <div className="skeleton h-6 w-20 rounded-lg" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
          </div>
        </div>

        {/* Main content card */}
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="skeleton mb-6 h-7 w-48 rounded-xl" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="skeleton h-3.5 w-24 rounded" />
                <div className="skeleton h-11 w-full rounded-xl" />
              </div>
            ))}
            <div className="skeleton mt-4 h-12 w-full rounded-2xl bg-blue-100" />
          </div>
        </div>
      </main>
    </div>
  );
}
