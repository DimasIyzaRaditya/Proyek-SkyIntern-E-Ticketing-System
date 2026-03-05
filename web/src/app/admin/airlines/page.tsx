"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ImagePlus, Pencil, Plus } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import {
  getAdminAirlines,
  type AdminAirline,
} from "@/lib/admin-api";

type SortField = "id" | "code" | "name" | "country";
type SortDirection = "asc" | "desc";

export default function AdminAirlinesPage() {
  const [airlines, setAirlines] = useState<AdminAirline[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const displayedAirlines = useMemo(() => {
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

  const loadAirlines = async () => {
    setLoading(true);
    setMessage("");

    try {
      const data = await getAdminAirlines();
      setAirlines(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat data maskapai.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAirlines();
  }, []);

  return (
    <AdminShell title="Airline Management" description="Klik Add Airline untuk menambah data maskapai. Edit dan delete dilakukan di halaman detail maskapai.">
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
            placeholder="Cari code, nama, country, atau ID"
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
            Total: {displayedAirlines.length}
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
                  <td colSpan={6} className="p-4 text-center text-slate-500">Memuat data maskapai...</td>
                </tr>
              ) : displayedAirlines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">Tidak ada data yang sesuai filter.</td>
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
                        <Pencil className="h-3.5 w-3.5" /> Kelola
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
