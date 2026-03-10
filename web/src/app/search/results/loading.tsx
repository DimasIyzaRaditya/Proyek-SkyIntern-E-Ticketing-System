/** Search results loading skeleton — mirrors the real two-column layout */
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

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Page title row */}
        <div className="skeleton mb-1 h-9 w-72 rounded-xl" />
        <div className="skeleton mb-6 h-4 w-96 rounded" />

        {/* Two-column grid — matches lg:grid-cols-[260px_1fr] */}
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Filter sidebar */}
          <aside className="h-fit rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="skeleton mb-4 h-6 w-32 rounded-lg" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-10 w-full rounded-xl" />
              ))}
            </div>
          </aside>

          {/* Flight card list */}
          <section className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                  {/* Left: airline name + time grid + tabs + tab content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      {/* Airline name */}
                      <div className="skeleton h-6 w-44 rounded-lg" />

                      {/* Time row: dep — duration bar — arr */}
                      <div className="grid min-w-60 grid-cols-[auto_1fr_auto] items-center gap-4 text-center">
                        <div className="space-y-1.5">
                          <div className="skeleton h-9 w-16 rounded-lg" />
                          <div className="skeleton mx-auto h-3 w-10 rounded" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="skeleton mx-auto h-3 w-14 rounded" />
                          <div className="skeleton mx-auto h-0.5 w-16 rounded" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="skeleton h-9 w-16 rounded-lg" />
                          <div className="skeleton mx-auto h-3 w-10 rounded" />
                        </div>
                      </div>
                    </div>

                    {/* Tabs row — 5 tabs */}
                    <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-slate-200 pt-4">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div key={j} className="skeleton h-4 w-20 rounded" />
                      ))}
                    </div>

                    {/* Tab content box */}
                    <div className="skeleton mt-3 h-10 w-full rounded-xl" />
                  </div>

                  {/* Right: price + book button */}
                  <div className="w-full space-y-3 lg:w-44 lg:text-right">
                    <div className="skeleton h-9 w-40 rounded-lg lg:ml-auto" />
                    <div className="skeleton mt-1 h-4 w-16 rounded lg:ml-auto" />
                    <div className="skeleton h-10 w-full rounded-xl bg-blue-100" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
