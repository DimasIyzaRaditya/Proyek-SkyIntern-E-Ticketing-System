"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmDialog from "@/components/ConfirmDialog";
import ResponsiveSelect from "@/components/ResponsiveSelect";
import { getAdminAirportsPage, deleteAdminAirport, type AdminAirport } from "@/lib/admin-api";

type SortField = "id" | "name" | "city" | "country" | "timezone";
type SortDirection = "asc" | "desc";

const SORT_FIELD_OPTIONS: Array<{ value: SortField; label: string }> = [
  { value: "name", label: "Name" },
  { value: "city", label: "City" },
  { value: "country", label: "Country" },
  { value: "timezone", label: "Timezone" },
  { value: "id", label: "ID" },
];

const SORT_DIRECTION_OPTIONS: Array<{ value: SortDirection; label: string }> = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

export default function AdminAirportsPage() {
  const [airports, setAirports] = useState<AdminAirport[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [rowsPerView, setRowsPerView] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<AdminAirport | null>(null);
  const trimmedSearch = search.trim();
  const isSearchInvalid = trimmedSearch.length > 0 && trimmedSearch.length < 3;
  const effectiveSearch = isSearchInvalid ? "" : trimmedSearch;

  useEffect(() => {
    const loadAirports = async () => {
      setLoading(true);
      setMessage("");

      try {
        const result = await getAdminAirportsPage({
          page: currentPage,
          limit: rowsPerView,
          search: effectiveSearch,
          sortBy: sortField,
          sortDirection,
        });
        setAirports(result.data);
        setTotalItems(result.pagination.totalItems);
        setTotalPages(result.pagination.totalPages);
        if (result.pagination.page !== currentPage) {
          setCurrentPage(result.pagination.page);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load airports.");
      } finally {
        setLoading(false);
      }
    };

    void loadAirports();
  }, [currentPage, rowsPerView, search, sortField, sortDirection]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, rowsPerView]);

  const handleDelete = async () => {
    if (!pendingDelete) return;

    setDeletingId(pendingDelete.id);
    try {
      await deleteAdminAirport(pendingDelete.id);
      if (airports.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        setAirports((prev) => prev.filter((a) => a.id !== pendingDelete.id));
        setTotalItems((prev) => Math.max(0, prev - 1));
      }
      setPendingDelete(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal menghapus bandara.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminShell title="Airport Management" description="Manage airports from the list. Use Add Airport to create a new record.">
      <section className="mt-5 max-w-full overflow-hidden rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex justify-end">
          <Link
            href="/admin/airports/create"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Add Airport
          </Link>
        </div>

        {message && <p className="mb-3 text-sm text-rose-700">{message}</p>}

        <div className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_150px_auto]">
          <div className="w-full min-w-0">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ID, name, city, country, or timezone"
              className="w-full min-w-0 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
            />
            {isSearchInvalid && (
              <p className="mt-1 text-xs text-slate-500">Ketik minimal 3 karakter untuk mencari.</p>
            )}
          </div>
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

        <div className="max-w-full overflow-x-auto">
          <table className="min-w-180 w-full text-left text-sm">
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
              ) : airports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">No airports match the current filter.</td>
                </tr>
              ) : airports.map((item) => (
                <tr key={item.id} className="border-b border-blue-100 last:border-0">
                  <td className="p-3 font-semibold">{item.id}</td>
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.city}</td>
                  <td className="p-3">{item.country}</td>
                  <td className="p-3">{item.timezone}</td>
                  <td className="whitespace-nowrap p-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/airports/${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <button
                        onClick={() => setPendingDelete(item)}
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

        {!loading && totalItems > 0 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={rowsPerView}
            onPageChange={setCurrentPage}
            onPageSizeChange={setRowsPerView}
            pageSizeId="rows-per-view"
          />
        )}
      </section>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Hapus Bandara"
        description={`Data bandara "${pendingDelete?.name ?? ""}" akan dihapus dari sistem.`}
        confirmLabel="Ya, Hapus"
        loading={deletingId !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </AdminShell>
  );
}
