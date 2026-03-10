/** Profile page loading skeleton — mirrors the real lg:grid-cols-[1.2fr_0.8fr] layout */
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

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr]">

          {/* Left: profile form card */}
          <div className="rounded-3xl border border-blue-100 bg-white p-4 shadow-lg sm:p-6 md:p-8">
            {/* Title + subtitle */}
            <div className="skeleton mb-1 h-8 w-52 rounded-xl" />
            <div className="skeleton mb-5 h-4 w-64 rounded" />

            {/* Avatar + name/email row */}
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-3 sm:gap-4 sm:p-4">
              <div className="skeleton h-14 w-14 shrink-0 rounded-full sm:h-20 sm:w-20" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-40 rounded-lg" />
                <div className="skeleton h-3.5 w-52 rounded" />
                <div className="skeleton h-7 w-32 rounded-lg bg-blue-100" />
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-3 sm:space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <div className="skeleton h-3.5 w-20 rounded" />
                <div className="skeleton h-11 w-full rounded-2xl" />
              </div>
              {/* Phone number (half-width grid) */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="skeleton h-3.5 w-28 rounded" />
                  <div className="skeleton h-11 w-full rounded-2xl" />
                </div>
              </div>
              {/* Email (readonly) */}
              <div className="space-y-1.5">
                <div className="skeleton h-3.5 w-12 rounded" />
                <div className="skeleton h-11 w-full rounded-2xl bg-slate-100" />
              </div>
            </div>

            {/* Action buttons row */}
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
              <div className="skeleton h-10 w-28 rounded-2xl bg-blue-100" />
              <div className="skeleton h-10 w-24 rounded-2xl" />
            </div>
          </div>

          {/* Right: upcoming trip card */}
          <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg">
            <div className="skeleton mb-4 h-6 w-36 rounded-lg" />
            <div className="rounded-2xl border border-blue-50 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <div className="skeleton h-10 w-10 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-40 rounded" />
                  <div className="skeleton h-3.5 w-32 rounded" />
                  <div className="skeleton h-3.5 w-24 rounded" />
                  <div className="skeleton mt-1 h-6 w-28 rounded-full bg-blue-100" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

