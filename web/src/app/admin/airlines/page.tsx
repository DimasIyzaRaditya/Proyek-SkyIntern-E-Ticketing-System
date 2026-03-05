"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import {
  deleteAdminAirline,
  getAdminAirlines,
  type AdminAirline,
} from "@/lib/admin-api";

type SortField = "id" | "code" | "name" | "country";
type SortDirection = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function AdminAirlinesPage() {
  const [airlines, setAirlines] = useState<AdminAirline[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredAndSorted = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const filtered = keyword
      ? airlines.filter((item) =>
          [item.code, item.name, item.country, String(item.id)]
            .join(" ")
            .toLowerCase()
            .includes(keyword),
        )
      : airlines;

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
  }, [airlines, search, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));

  const displayedAirlines = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, currentPage, pageSize]);

  // Reset ke halaman 1 saat filter/sort/pageSize berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortField, sortDirection, pageSize]);

  const loadAirlines = async () => {
    setLoading(true);
    setMessage("");

    try {
      const data = await getAdminAirlines();
      setAirlines(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load airlines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAirlines();
  }, []);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this airline?");
    if (!confirmed) return;

    setMessage("");

    try {
      await deleteAdminAirline(id);
      await loadAirlines();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete airline.");
    }
  };

  return (
    <AdminShell title="Airline Management" description="Click Add Airline to create a new airline. Edit and delete are available in this table and the detail page.">
      <section className="mt-5 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex justify-end">
          <Link
            href="/admin/airlines/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Airline
          </Link>
        </div>

        {message && <p className="mb-3 text-sm text-rose-700">{message}</p>}

        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_150px_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search code, name, country, or ID"
            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
          />
          <select
            value={sortField}
            onChange={(event) => setSortField(event.target.value as SortField)}
            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
          >
            <option value="name">Sort: Name</option>
            <option value="code">Sort: Code</option>
            <option value="country">Sort: Country</option>
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
            Total: {filteredAndSorted.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
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
              ) : displayedAirlines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">No airlines match the current filter.</td>
                </tr>
              ) : displayedAirlines.map((item) => (
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
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/airlines/${item.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <button
                        onClick={() => void handleDelete(item.id)}
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

        {/* Pagination */}
        {!loading && filteredAndSorted.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Baris per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="ml-2 text-slate-500">
                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredAndSorted.length)} dari {filteredAndSorted.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-blue-100"
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-blue-100 bg-blue-50 p-1 text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-blue-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                .reduce<(number | "…")[]>((acc, page, idx, arr) => {
                  if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "…" ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className={`rounded-lg border px-3 py-1 text-sm font-medium ${
                        currentPage === item
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-blue-100 bg-blue-50 p-1 text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-blue-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-blue-100"
              >
                »
              </button>
            </div>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
