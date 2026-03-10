/** Auth pages loading skeleton */
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

      <main className="mx-auto max-w-sm px-4 py-16">
        <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-xl">
          {/* Logo / icon */}
          <div className="skeleton mx-auto mb-5 h-12 w-12 rounded-2xl" />
          {/* Title */}
          <div className="skeleton mx-auto mb-2 h-7 w-36 rounded-xl" />
          <div className="skeleton mx-auto mb-6 h-4 w-52 rounded-lg" />

          {/* Form fields */}
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="skeleton h-3.5 w-16 rounded" />
                <div className="skeleton h-11 w-full rounded-xl" />
              </div>
            ))}
            <div className="skeleton h-11 w-full rounded-xl bg-blue-100" />
          </div>

          <div className="skeleton mx-auto mt-5 h-4 w-40 rounded" />
        </div>
      </main>
    </div>
  );
}
