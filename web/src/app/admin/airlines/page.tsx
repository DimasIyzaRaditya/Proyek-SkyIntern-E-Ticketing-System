"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmDialog from "@/components/ConfirmDialog";
import ResponsiveSelect from "@/components/ResponsiveSelect";
import {
  deleteAdminAirline,
  getAdminAirlinesPage,
  type AdminAirline,
} from "@/lib/admin-api";

type SortField = "id" | "code" | "name" | "country";
type SortDirection = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const SORT_FIELD_OPTIONS: Array<{ value: SortField; label: string }> = [
  { value: "name", label: "Name" },
  { value: "code", label: "Code" },
  { value: "country", label: "Country" },
  { value: "id", label: "ID" },
];
const SORT_DIRECTION_OPTIONS: Array<{ value: SortDirection; label: string }> = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

export default function AdminAirlinesPage() {
  const [airlines, setAirlines] = useState<AdminAirline[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pendingDelete, setPendingDelete] = useState<AdminAirline | null>(null);
  const trimmedSearch = search.trim();
  const isSearchInvalid = trimmedSearch.length > 0 && trimmedSearch.length < 3;
  const effectiveSearch = isSearchInvalid ? "" : trimmedSearch;

  // Reset ke halaman 1 saat filter/pageSize berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  const loadAirlines = async () => {
    setLoading(true);
    setMessage("");

    try {
      const result = await getAdminAirlinesPage({
        page: currentPage,
        limit: pageSize,
        search: effectiveSearch,
        sortBy: sortField,
        sortDirection,
      });
      setAirlines(result.data);
      setTotalItems(result.pagination.totalItems);
      setTotalPages(result.pagination.totalPages);
      if (result.pagination.page !== currentPage) {
        setCurrentPage(result.pagination.page);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load airlines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAirlines();
  }, [currentPage, pageSize, search, sortField, sortDirection]);

  const handleDelete = async (id: number) => {
    setMessage("");

    try {
      await deleteAdminAirline(id);
      if (airlines.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await loadAirlines();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete airline.");
    }
  };

  return (
    <AdminShell title="Airline Management" description="Click Add Airline to create a new airline. Edit and delete are available in this table and the detail page.">
      <section className="mt-5 max-w-full overflow-hidden rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex justify-end">
          <Link
            href="/admin/airlines/create"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Add Airline
          </Link>
        </div>

        {message && <p className="mb-3 text-sm text-rose-700">{message}</p>}

        <div className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_150px_auto]">
          <div className="w-full min-w-0 lg:col-span-1">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search code, name, country, or ID"
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
          <div className="flex items-center justify-start text-sm font-medium text-slate-600 sm:justify-end lg:justify-end">
            Total: {totalItems}
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="min-w-180 w-full text-left text-sm">
            <thead className="bg-blue-50 text-slate-600">
              <tr>
                <th className="rounded-l-xl p-3">Logo</th>
                <th className="p-3">Code</th>
                <th className="p-3">Airline Name</th>
                <th className="p-3">Country</th>
                <th className="p-3">ID</th>
                <th className="rounded-r-xl p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">Loading airlines...</td>
                </tr>
              ) : airlines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">No airlines match the current filter.</td>
                </tr>
              ) : airlines.map((item) => (
                <tr key={item.id} className="border-b border-blue-100 last:border-0">
                  <td className="p-3">
                    {item.logo ? (
                      <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-blue-100 bg-blue-50">
                        <Image src={item.logo} alt={item.name} fill className="object-contain p-1" unoptimized />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-slate-300">
                        <ImagePlus className="h-4 w-4" />
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-semibold">{item.code}</td>
                  <td className="p-3 font-semibold">{item.name}</td>
                  <td className="p-3">{item.country}</td>
                  <td className="p-3">{item.id}</td>
                  <td className="whitespace-nowrap p-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/airlines/${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <button
                        onClick={() => setPendingDelete(item)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
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
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            pageSizeId="rows-per-view-airlines"
          />
        )}
      </section>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Hapus Maskapai"
        description={`Data maskapai "${pendingDelete?.name ?? ""}" akan dihapus dari sistem.`}
        confirmLabel="Ya, Hapus"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          void handleDelete(pendingDelete.id).finally(() => setPendingDelete(null));
        }}
      />
    </AdminShell>
  );
}
