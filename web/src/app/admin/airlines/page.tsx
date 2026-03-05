"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import {
  createAdminAirline,
  deleteAdminAirline,
  getAdminAirlines,
  type AdminAirline,
  updateAdminAirline,
} from "@/lib/admin-api";

type AirlineForm = {
  code: string;
  name: string;
  country: string;
};

type SortField = "id" | "code" | "name" | "country";
type SortDirection = "asc" | "desc";

export default function AdminAirlinesPage() {
  const [airlines, setAirlines] = useState<AdminAirline[]>([]);
  const [form, setForm] = useState<AirlineForm>({ code: "", name: "", country: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setLogoFile(file);
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoPreview(null);
    }
  };

  const resetLogoSelection = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveLogo = () => {
    resetLogoSelection();
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.country.trim()) return;

    const normalizedCode = form.code.trim().toUpperCase();
    const isDuplicateCode = airlines.some(
      (item) => item.code.toUpperCase() === normalizedCode && item.id !== editingId,
    );

    if (isDuplicateCode) {
      setMessage("Kode maskapai sudah digunakan.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      if (editingId) {
        await updateAdminAirline(editingId, {
          code: normalizedCode,
          name: form.name.trim(),
          country: form.country.trim(),
          logo: logoFile ?? undefined,
        });
      } else {
        await createAdminAirline({
          code: normalizedCode,
          name: form.name.trim(),
          country: form.country.trim(),
          logo: logoFile ?? undefined,
        });
      }

      setEditingId(null);
      setForm({ code: "", name: "", country: "" });
      resetLogoSelection();
      await loadAirlines();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan data maskapai.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: AdminAirline) => {
    setForm({ code: item.code, name: item.name, country: item.country });
    setLogoFile(null);
    setLogoPreview(item.logo ?? null);
    setEditingId(item.id);
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ code: "", name: "", country: "" });
    resetLogoSelection();
    setMessage("");
  };

  const handleDelete = async (id: number) => {
    setMessage("");

    try {
      await deleteAdminAirline(id);
      await loadAirlines();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menghapus maskapai.");
    }
  };

  return (
    <AdminShell title="Airline Management" description="Input data maskapai, logo, dan lakukan add/edit/delete.">
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[160px_1fr_1fr_auto]">
          <input value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))} placeholder="Code (GA)" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Airline Name" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} placeholder="Country" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <div className="flex gap-2">
            <button disabled={saving} onClick={() => void handleSave()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              <Plus className="h-4 w-4" /> {editingId ? "Update" : "Add Airline"}
            </button>
            {editingId && (
              <button onClick={handleCancel} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50">
                <X className="h-4 w-4" /> Cancel
              </button>
            )}
          </div>
        </div>

        {/* Logo Upload */}
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-slate-600">Logo Maskapai {editingId ? "(kosongkan jika tidak diubah)" : "(opsional)"}</p>
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-blue-100 bg-blue-50">
                <Image src={logoPreview} alt="Logo preview" fill className="object-contain p-1" unoptimized />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute right-0.5 top-0.5 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-300">
                <ImagePlus className="h-6 w-6" />
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                <ImagePlus className="h-4 w-4" /> Pilih Gambar
              </label>
              {logoFile && <p className="mt-1 text-xs text-slate-500">{logoFile.name}</p>}
            </div>
          </div>
        </div>

        {message && <p className="mt-3 text-sm text-rose-700">{message}</p>}
      </section>

      <section className="mt-5 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
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
                      <button onClick={() => handleEdit(item)} className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                      <button onClick={() => void handleDelete(item.id)} className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
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
