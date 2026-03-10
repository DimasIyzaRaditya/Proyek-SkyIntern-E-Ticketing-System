/** Admin dashboard loading skeleton — mirrors the real stat cards + chart + status + table layout */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8fbff]">
      {/* Top nav */}
      <div className="sticky top-0 z-30 border-b border-blue-100 bg-white/95 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="skeleton h-7 w-36 rounded-lg" />
          <div className="flex gap-2">
            <div className="skeleton h-8 w-16 rounded-lg" />
            <div className="skeleton h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Admin sub-nav */}
      <div className="border-b border-blue-50 bg-white px-4 py-2">
        <div className="mx-auto flex max-w-7xl gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-24 rounded-xl" />
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        {/* Page title */}
        <div className="space-y-2">
          <div className="skeleton h-8 w-52 rounded-xl" />
          <div className="skeleton h-4 w-80 rounded-lg" />
        </div>

        {/* 4 stat cards — admin info, total booking, tickets, revenue */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Admin info card */}
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="skeleton mb-2 h-3.5 w-16 rounded" />
            <div className="skeleton h-6 w-36 rounded-lg" />
            <div className="skeleton mt-1.5 h-3.5 w-44 rounded" />
          </div>
          {/* Total booking card */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 shadow-sm">
            <div className="skeleton mb-2 h-3.5 w-24 rounded" />
            <div className="skeleton h-10 w-16 rounded-lg" />
            <div className="skeleton mt-1.5 h-3 w-32 rounded" />
          </div>
          {/* Tickets sold card */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <div className="skeleton mb-2 h-3.5 w-24 rounded" />
            <div className="skeleton h-10 w-16 rounded-lg" />
            <div className="skeleton mt-1.5 h-3 w-36 rounded" />
          </div>
          {/* Revenue card */}
          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5 shadow-sm">
            <div className="skeleton mb-2 h-3.5 w-24 rounded" />
            <div className="skeleton h-7 w-40 rounded-lg" />
            <div className="skeleton mt-1.5 h-3 w-36 rounded" />
          </div>
        </div>

        {/* Chart (2/3) + Status breakdown (1/3) side-by-side */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Chart card */}
          <div className="col-span-2 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="skeleton h-5 w-5 rounded" />
                <div className="skeleton h-6 w-36 rounded-lg" />
              </div>
              <div className="skeleton h-9 w-52 rounded-xl" />
            </div>
            <div className="skeleton mb-4 h-3.5 w-32 rounded" />
            <div className="skeleton h-56 w-full rounded-2xl" />
          </div>

          {/* Status breakdown card — 4 rows: Issued, Paid, Pending, Cancelled */}
          <div className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="skeleton mb-4 h-6 w-36 rounded-lg" />
            <div className="space-y-3">
              {/* Issued */}
              <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-3 sm:p-4">
                <div className="skeleton h-5 w-5 shrink-0 rounded" />
                <div className="space-y-1.5">
                  <div className="skeleton h-3 w-12 rounded" />
                  <div className="skeleton h-7 w-10 rounded-lg" />
                </div>
              </div>
              {/* Paid */}
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 sm:p-4">
                <div className="skeleton h-5 w-5 shrink-0 rounded" />
                <div className="space-y-1.5">
                  <div className="skeleton h-3 w-8 rounded" />
                  <div className="skeleton h-7 w-10 rounded-lg" />
                </div>
              </div>
              {/* Pending */}
              <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-3 sm:p-4">
                <div className="skeleton h-5 w-5 shrink-0 rounded" />
                <div className="space-y-1.5">
                  <div className="skeleton h-3 w-14 rounded" />
                  <div className="skeleton h-7 w-10 rounded-lg" />
                </div>
              </div>
              {/* Cancelled */}
              <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-3 sm:p-4">
                <div className="skeleton h-5 w-5 shrink-0 rounded" />
                <div className="space-y-1.5">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-7 w-10 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent bookings table — 6 columns: Kode, User, Penerbangan, Total, Tanggal, Status */}
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="skeleton mb-4 h-7 w-44 rounded-xl" />
          <div className="space-y-0">
            {/* Table header */}
            <div className="grid grid-cols-6 gap-3 rounded-xl bg-blue-50 px-4 py-3">
              {["Kode", "User", "Penerbangan", "Total", "Tanggal", "Status"].map((_, j) => (
                <div key={j} className="skeleton h-3 rounded" />
              ))}
            </div>
            {/* Table rows */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-3 border-b border-blue-50 px-4 py-3 last:border-0">
                {/* Kode: short colored text */}
                <div className="skeleton h-4 w-20 rounded" />
                {/* User: name + email stacked */}
                <div className="space-y-1">
                  <div className="skeleton h-4 w-full rounded" />
                  <div className="skeleton h-3 w-3/4 rounded" />
                </div>
                {/* Penerbangan */}
                <div className="skeleton h-4 w-full rounded" />
                {/* Total */}
                <div className="skeleton h-4 w-full rounded" />
                {/* Tanggal: icon + text */}
                <div className="flex items-center gap-1">
                  <div className="skeleton h-3.5 w-3.5 rounded" />
                  <div className="skeleton h-3.5 flex-1 rounded" />
                </div>
                {/* Status badge */}
                <div className="skeleton h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

