/** Global fallback loading screen */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8fbff]">
      {/* Nav skeleton */}
      <div className="sticky top-0 z-30 border-b border-blue-100 bg-white/95 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="skeleton h-7 w-32 rounded-lg" />
          <div className="flex gap-3">
            <div className="skeleton h-8 w-20 rounded-lg" />
            <div className="skeleton h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>
      {/* Content skeleton */}
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-10">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-4 w-72 rounded-lg" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton mt-4 h-48 w-full rounded-3xl" />
      </main>
    </div>
  );
}
