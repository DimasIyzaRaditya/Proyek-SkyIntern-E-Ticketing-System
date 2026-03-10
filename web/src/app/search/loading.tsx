/** Search page loading skeleton */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_40%,#f0f7ff_100%)]">
      {/* Nav skeleton */}
      <div className="sticky top-0 z-30 border-b border-blue-100 bg-white/95 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="skeleton h-7 w-36 rounded-lg" />
          <div className="hidden gap-4 sm:flex">
            <div className="skeleton h-4 w-16 rounded" />
            <div className="skeleton h-4 w-16 rounded" />
            <div className="skeleton h-4 w-20 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-8 w-16 rounded-lg" />
            <div className="skeleton h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        {/* Hero text */}
        <div className="mb-8 text-center">
          <div className="skeleton mx-auto mb-3 h-10 w-72 rounded-xl" />
          <div className="skeleton mx-auto h-5 w-52 rounded-lg" />
        </div>

        {/* Search card */}
        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl">
          {/* Trip type tabs */}
          <div className="flex border-b border-blue-100 px-6 pt-5">
            <div className="skeleton mr-4 h-8 w-28 rounded-full" />
            <div className="skeleton h-8 w-28 rounded-full" />
          </div>

          <div className="space-y-4 p-6">
            {/* Origin / Destination row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="skeleton h-16 rounded-2xl" />
              <div className="skeleton h-16 rounded-2xl" />
            </div>
            {/* Date row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="skeleton h-16 rounded-2xl" />
              <div className="skeleton h-16 rounded-2xl" />
            </div>
            {/* Guests row */}
            <div className="skeleton h-16 rounded-2xl" />
            {/* Search button */}
            <div className="skeleton h-12 w-full rounded-2xl bg-blue-100" />
          </div>
        </div>

        {/* Recent searches */}
        <div className="mt-8 space-y-3">
          <div className="skeleton h-5 w-36 rounded-lg" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-14 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
