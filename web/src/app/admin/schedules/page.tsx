"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import ResponsiveSelect from "@/components/ResponsiveSelect";
import { formatRupiah } from "@/lib/currency";
import { getAdminFlightsPage, deleteAdminFlight, type AdminFlight } from "@/lib/admin-api";

type SortField = "flightNumber" | "route" | "basePrice" | "departureTime" | "arrivalTime";
type SortDirection = "asc" | "desc";

const SORT_FIELD_OPTIONS: Array<{ value: SortField; label: string }> = [
  { value: "departureTime", label: "Departure" },
  { value: "arrivalTime", label: "Arrival" },
  { value: "flightNumber", label: "Flight" },
  { value: "route", label: "Route" },
  { value: "basePrice", label: "Base Price" },
];

const SORT_DIRECTION_OPTIONS: Array<{ value: SortDirection; label: string }> = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

export default function AdminSchedulesPage() {
  const [flights, setFlights] = useState<AdminFlight[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("departureTime");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [rowsPerView, setRowsPerView] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

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
      const result = await getAdminFlightsPage({
        page: currentPage,
        limit: rowsPerView,
        search,
        sortBy: sortField,
        sortDirection,
      });
      setFlights(result.data);
      setTotalItems(result.pagination.totalItems);
      setTotalPages(result.pagination.totalPages);
      if (result.pagination.page !== currentPage) {
        setCurrentPage(result.pagination.page);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load schedules.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerView, search, sortField, sortDirection]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortField, sortDirection, rowsPerView]);

  return (
    <AdminShell title="Flight Schedule Management" description="Manage flight schedules from the list. Use Add Schedule to create new data.">
      <section className="mt-5 max-w-full overflow-hidden rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex justify-end">
          <Link
            href="/admin/schedules/create"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Add Schedule
          </Link>
        </div>

        {message && <p className="mb-3 text-sm text-rose-700">{message}</p>}

        <div className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_150px_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search flight, airline, origin, or destination"
            className="w-full min-w-0 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
          />
          <ResponsiveSelect
            value={sortField}
            onChange={(nextValue) => setSortField(nextValue as SortField)}
            options={SORT_FIELD_OPTIONS}
            placeholder="Sort by"
          />
          <ResponsiveSelect
            value={sortDirection}
            onChange={(nextValue) => setSortDirection(nextValue as SortDirection)}
            options={SORT_DIRECTION_OPTIONS}
            placeholder="Direction"
          />
          <div className="flex items-center justify-start text-sm font-medium text-slate-600 sm:justify-end">
            Total: {totalItems}
          </div>
        </div>

        <p className="mb-3 text-sm text-slate-500">
          Tabel ini menampilkan jadwal penerbangan aktif. Geser ke samping pada layar kecil untuk melihat semua kolom.
        </p>

        <div className="max-w-full overflow-x-auto rounded-2xl">
          <table className="min-w-180 w-full text-left text-sm">
            <thead className="bg-blue-50 text-slate-600">
              <tr>
                <th className="rounded-l-xl p-3">Flight</th>
                <th className="p-3">Route</th>
                <th className="p-3">Base Price</th>
                <th className="p-3">Departure</th>
                <th className="p-3">Arrival</th>
                <th className="p-3">Aircraft</th>
                <th className="rounded-r-xl p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-500">Loading schedules...</td>
                </tr>
              ) : flights.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-500">No schedules match the current filter.</td>
                </tr>
              ) : flights.map((item) => (
                <tr key={item.id} className="border-b border-blue-100 last:border-0">
                  <td className="p-3 font-semibold">{item.flightNumber}</td>
                  <td className="p-3 font-semibold">{item.origin.city} → {item.destination.city}</td>
                  <td className="p-3">{formatRupiah(item.basePrice)}</td>
                  <td className="p-3">{new Date(item.departureTime).toLocaleString("id-ID")}</td>
                  <td className="p-3">{new Date(item.arrivalTime).toLocaleString("id-ID")}</td>
                  <td className="p-3">{item.aircraft ?? "—"}</td>
                  <td className="whitespace-nowrap p-3">
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
                            if (flights.length === 1 && currentPage > 1) {
                              setCurrentPage((prev) => prev - 1);
                            } else {
                              setFlights((prev) => prev.filter((f) => f.id !== item.id));
                              setTotalItems((prev) => Math.max(0, prev - 1));
                            }
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

        {!loading && totalItems > 0 && (
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                Menampilkan {(currentPage - 1) * rowsPerView + 1} - {Math.min(currentPage * rowsPerView, totalItems)} dari {totalItems} data.
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
