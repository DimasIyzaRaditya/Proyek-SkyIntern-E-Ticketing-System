"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { getAdminAirports, deleteAdminAirport, type AdminAirport } from "@/lib/admin-api";

type SortField = "id" | "name" | "city" | "country" | "timezone";
type SortDirection = "asc" | "desc";

export default function AdminAirportsPage() {
  const [airports, setAirports] = useState<AdminAirport[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [rowsPerView, setRowsPerView] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const displayedAirports = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const filtered = keyword
      ? airports.filter((item) =>
          [String(item.id), item.name, item.city, item.country, item.timezone]
            .join(" ")
            .toLowerCase()
            .includes(keyword),
        )
      : airports;

    return [...filtered].sort((a, b) => {
      const directionFactor = sortDirection === "asc" ? 1 : -1;

      if (sortField === "id") {
        return (a.id - b.id) * directionFactor;
      }

      const left = a[sortField].toLowerCase();
      const right = b[sortField].toLowerCase();

      if (left < right) return -1 * directionFactor;
      if (left > right) return 1 * directionFactor;
      return 0;
    });
  }, [airports, search, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(displayedAirports.length / rowsPerView));

  const visibleAirports = useMemo(() => {
    const start = (currentPage - 1) * rowsPerView;
    const end = start + rowsPerView;
    return displayedAirports.slice(start, end);
  }, [displayedAirports, currentPage, rowsPerView]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    const normalizedStart = Math.max(1, end - 4);

    return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index);
  }, [currentPage, totalPages]);

  useEffect(() => {
    const loadAirports = async () => {
      setLoading(true);
      setMessage("");

      try {
        const data = await getAdminAirports();
        setAirports(data);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load airports.");
      } finally {
        setLoading(false);
      }
    };

    void loadAirports();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortField, sortDirection, rowsPerView]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <AdminShell title="Airport Management" description="Manage airports from the list. Use Add Airport to create a new record.">
      <section className="mt-5 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex justify-end">
          <Link
            href="/admin/airports/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Airport
          </Link>
        </div>

        {message && <p className="mb-3 text-sm text-rose-700">{message}</p>}

        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_150px_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ID, name, city, country, or timezone"
            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
          />
          <select
            value={sortField}
            onChange={(event) => setSortField(event.target.value as SortField)}
            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
          >
            <option value="name">Sort: Name</option>
            <option value="city">Sort: City</option>
            <option value="country">Sort: Country</option>
            <option value="timezone">Sort: Timezone</option>
            <option value="id">Sort: ID</option>
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
            Total: {displayedAirports.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50 text-slate-600">
              <tr>
                <th className="rounded-l-xl p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">City</th>
                <th className="p-3">Country</th>
                <th className="p-3">Timezone</th>
                <th className="rounded-r-xl p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">Loading airports...</td>
                </tr>
              ) : displayedAirports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">No airports match the current filter.</td>
                </tr>
              ) : visibleAirports.map((item) => (
                <tr key={item.id} className="border-b border-blue-100 last:border-0">
                  <td className="p-3 font-semibold">{item.id}</td>
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.city}</td>
                  <td className="p-3">{item.country}</td>
                  <td className="p-3">{item.timezone}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/airports/${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <button
                        onClick={async () => {
                          if (!confirm(`Hapus bandara "${item.name}"?`)) return;
                          setDeletingId(item.id);
                          try {
                            await deleteAdminAirport(item.id);
                            setAirports((prev) => prev.filter((a) => a.id !== item.id));
                          } catch (err) {
                            setMessage(err instanceof Error ? err.message : "Gagal menghapus bandara.");
                          } finally {
                            setDeletingId(null);
                          }
                        }}
                        disabled={deletingId === item.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60"
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

        {!loading && displayedAirports.length > 0 && (
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                Menampilkan {(currentPage - 1) * rowsPerView + 1} - {Math.min(currentPage * rowsPerView, displayedAirports.length)} dari {displayedAirports.length} data.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-100 pt-3">
              <div className="inline-flex items-center gap-2">
                <label htmlFor="rows-per-view" className="font-medium text-slate-700">Tampilkan</label>
                <select
                  id="rows-per-view"
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
