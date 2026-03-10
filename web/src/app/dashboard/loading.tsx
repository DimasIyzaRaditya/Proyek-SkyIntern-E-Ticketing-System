/** Dashboard loading skeleton — mirrors the real profile + history layout */
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

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6 sm:py-10">

        {/* Profile section card */}
        <div className="rounded-3xl border border-blue-100 bg-white p-4 shadow-lg sm:p-6">
          {/* Title */}
          <div className="skeleton mb-1 h-7 w-40 rounded-xl sm:h-8 sm:w-48" />
          <div className="skeleton mb-4 h-3.5 w-64 rounded" />

          {/* Avatar + upload row */}
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-3 sm:flex-row sm:items-center sm:p-4">
            <div className="skeleton h-20 w-20 shrink-0 rounded-full" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-3.5 w-44 rounded" />
              <div className="skeleton h-7 w-28 rounded-lg bg-blue-100" />
            </div>
          </div>

          {/* 3 info boxes: Nama, Email, No. HP */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-blue-100 bg-blue-50 p-3 sm:p-4">
                <div className="skeleton mb-1.5 h-3 w-16 rounded" />
                <div className="skeleton h-5 w-32 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Booking history section card */}
        <div className="rounded-3xl border border-blue-100 bg-white p-4 shadow-lg sm:p-6">
          {/* Section header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="skeleton h-4 w-4 rounded" />
              <div className="skeleton h-6 w-40 rounded-lg" />
            </div>
            <div className="skeleton h-4 w-16 rounded" />
          </div>

          {/* Booking rows */}
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                {/* Airline + flight number */}
                <div className="flex items-center gap-2">
                  <div className="skeleton h-4 w-4 rounded" />
                  <div className="skeleton h-5 w-48 rounded-lg" />
                </div>
                {/* Route */}
                <div className="skeleton mt-1.5 h-4 w-40 rounded" />
                {/* Date */}
                <div className="skeleton mt-1.5 h-3.5 w-36 rounded" />
                {/* Status */}
                <div className="skeleton mt-2 h-4 w-28 rounded" />
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

