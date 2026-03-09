"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { formatRupiah } from "@/lib/currency";
import { getAdminFlights, deleteAdminFlight, type AdminFlight } from "@/lib/admin-api";

type SortField = "flightNumber" | "route" | "basePrice" | "departureTime" | "arrivalTime";
type SortDirection = "asc" | "desc";

export default function AdminSchedulesPage() {
  const [flights, setFlights] = useState<AdminFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("departureTime");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [rowsPerView, setRowsPerView] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const displayedFlights = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const filtered = keyword
      ? flights.filter((item) =>
          [
            item.flightNumber,
            item.airline.code,
            item.airline.name,
            item.origin.city,
            item.origin.name,
            item.destination.city,
            item.destination.name,
          ]
            .join(" ")
            .toLowerCase()
            .includes(keyword),
        )
      : flights;

    return [...filtered].sort((a, b) => {
      const directionFactor = sortDirection === "asc" ? 1 : -1;

      if (sortField === "route") {
        const left = `${a.origin.city}-${a.destination.city}`.toLowerCase();
        const right = `${b.origin.city}-${b.destination.city}`.toLowerCase();
        if (left < right) return -1 * directionFactor;
        if (left > right) return 1 * directionFactor;
        return 0;
      }

      if (sortField === "basePrice") {
        return (a.basePrice - b.basePrice) * directionFactor;
      }

      if (sortField === "departureTime" || sortField === "arrivalTime") {
        const left = new Date(a[sortField]).getTime();
        const right = new Date(b[sortField]).getTime();
        return (left - right) * directionFactor;
      }

      const left = a.flightNumber.toLowerCase();
      const right = b.flightNumber.toLowerCase();
      if (left < right) return -1 * directionFactor;
      if (left > right) return 1 * directionFactor;
      return 0;
    });
  }, [flights, search, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(displayedFlights.length / rowsPerView));

  const visibleFlights = useMemo(() => {
    const start = (currentPage - 1) * rowsPerView;
    const end = start + rowsPerView;
    return displayedFlights.slice(start, end);
  }, [displayedFlights, currentPage, rowsPerView]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    const normalizedStart = Math.max(1, end - 4);

    return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index);
  }, [currentPage, totalPages]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const flightData = await getAdminFlights();
      setFlights(flightData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load schedules.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortField, sortDirection, rowsPerView]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <AdminShell title="Flight Schedule Management" description="Manage flight schedules from the list. Use Add Schedule to create new data.">
      <section className="mt-5 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex justify-end">
          <Link
            href="/admin/schedules/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Schedule
          </Link>
        </div>

        {message && <p className="mb-3 text-sm text-rose-700">{message}</p>}

        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_150px_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search flight, airline, origin, or destination"
            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
          />
          <select
            value={sortField}
            onChange={(event) => setSortField(event.target.value as SortField)}
            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
          >
            <option value="departureTime">Sort: Departure</option>
            <option value="arrivalTime">Sort: Arrival</option>
            <option value="flightNumber">Sort: Flight</option>
            <option value="route">Sort: Route</option>
            <option value="basePrice">Sort: Base Price</option>
          </select>
          <select
            value={sortDirection}
            onChange={(event) => setSortDirection(event.target.value as SortDirection)}
            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
          <div className="flex items-center justify-end text-sm font-medium text-slate-600">
            Total: {displayedFlights.length}
          </div>
        </div>

        <p className="mb-3 text-sm text-slate-500">
          Tabel ini menampilkan jadwal penerbangan aktif. Geser ke samping pada layar kecil untuk melihat semua kolom.
        </p>

        <div className="overflow-x-auto rounded-2xl">
          <table className="min-w-195 w-full text-left text-sm">
            <thead className="bg-blue-50 text-slate-600">
              <tr>
                <th className="rounded-l-xl p-3">Flight</th>
                <th className="p-3">Route</th>
                <th className="p-3">Base Price</th>
                <th className="p-3">Departure</th>
                <th className="p-3">Arrival</th>
                <th className="rounded-r-xl p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">Loading schedules...</td>
                </tr>
              ) : displayedFlights.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">No schedules match the current filter.</td>
                </tr>
              ) : visibleFlights.map((item) => (
                <tr key={item.id} className="border-b border-blue-100 last:border-0">
                  <td className="whitespace-nowrap p-3 font-semibold">{item.flightNumber}</td>
                  <td className="whitespace-nowrap p-3 font-semibold">{item.origin.city} → {item.destination.city}</td>
                  <td className="whitespace-nowrap p-3">{formatRupiah(item.basePrice)}</td>
                  <td className="whitespace-nowrap p-3">{new Date(item.departureTime).toLocaleString("id-ID")}</td>
                  <td className="whitespace-nowrap p-3">{new Date(item.arrivalTime).toLocaleString("id-ID")}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/schedules/${item.id}`}
                        className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <button
                        onClick={async () => {
                          if (!confirm(`Hapus jadwal "${item.flightNumber}"?`)) return;
                          setDeletingId(item.id);
                          try {
                            await deleteAdminFlight(item.id);
                            setFlights((prev) => prev.filter((f) => f.id !== item.id));
                          } catch (err) {
                            setMessage(err instanceof Error ? err.message : "Gagal menghapus jadwal.");
                          } finally {
                            setDeletingId(null);
                          }
                        }}
                        disabled={deletingId === item.id}
                        className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> {deletingId === item.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && displayedFlights.length > 0 && (
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                Menampilkan {(currentPage - 1) * rowsPerView + 1} - {Math.min(currentPage * rowsPerView, displayedFlights.length)} dari {displayedFlights.length} data.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-100 pt-3">
              <div className="inline-flex items-center gap-2">
                <label htmlFor="rows-per-view-schedules" className="font-medium text-slate-700">Tampilkan</label>
                <select
                  id="rows-per-view-schedules"
                  value={rowsPerView}
                  onChange={(event) => setRowsPerView(Number(event.target.value))}
                  className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
                >
                  <option value={10}>10 data</option>
                  <option value={20}>20 data</option>
                  <option value={50}>50 data</option>
                  <option value={100}>100 data</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                      page === currentPage
                        ? "bg-blue-600 text-white"
                        : "border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
