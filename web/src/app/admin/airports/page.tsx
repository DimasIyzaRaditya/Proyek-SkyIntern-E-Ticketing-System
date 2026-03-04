"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import {
  createAdminAirport,
  deleteAdminAirport,
  getAdminAirports,
  type AdminAirport,
  updateAdminAirport,
} from "@/lib/admin-api";

type AirportForm = {
  name: string;
  city: string;
  country: string;
  timezone: string;
};

export default function AdminAirportsPage() {
  const [airports, setAirports] = useState<AdminAirport[]>([]);
  const [form, setForm] = useState<AirportForm>({
    name: "",
    city: "",
    country: "Indonesia",
    timezone: "Asia/Jakarta",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadAirports = async () => {
    setLoading(true);
    setMessage("");

    try {
      const data = await getAdminAirports();
      setAirports(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat data bandara.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAirports();
  }, []);

  const handleSave = async () => {
    if (!form.name.trim() || !form.city.trim() || !form.country.trim() || !form.timezone.trim()) return;

    setSaving(true);
    setMessage("");

    try {
      if (editingId) {
        await updateAdminAirport(editingId, {
          name: form.name.trim(),
          city: form.city.trim(),
          country: form.country.trim(),
          timezone: form.timezone.trim(),
        });
      } else {
        await createAdminAirport({
          name: form.name.trim(),
          city: form.city.trim(),
          country: form.country.trim(),
          timezone: form.timezone.trim(),
        });
      }

      setEditingId(null);
      setForm({
        name: "",
        city: "",
        country: "Indonesia",
        timezone: "Asia/Jakarta",
      });
      await loadAirports();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan data bandara.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: AdminAirport) => {
    setForm({
      name: item.name,
      city: item.city,
      country: item.country,
      timezone: item.timezone,
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id: number) => {
    setMessage("");

    try {
      await deleteAdminAirport(id);
      await loadAirports();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menghapus data bandara.");
    }
  };

  return (
    <AdminShell title="Airport Management (CRUD)" description="Tambah, edit, dan hapus data bandara: kode, nama, dan lokasi.">
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Name" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} placeholder="City" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} placeholder="Country" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input value={form.timezone} onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))} placeholder="Timezone" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <button disabled={saving} onClick={() => void handleSave()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 md:col-span-4">
            <Plus className="h-4 w-4" /> {editingId ? "Update" : "Add Airport"}
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-rose-700">{message}</p>}
      </section>

      <section className="mt-5 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
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
                  <td colSpan={6} className="p-4 text-center text-slate-500">Memuat data bandara...</td>
                </tr>
              ) : airports.map((item) => (
                <tr key={item.id} className="border-b border-blue-100 last:border-0">
                  <td className="p-3 font-semibold">{item.id}</td>
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.city}</td>
                  <td className="p-3">{item.country}</td>
                  <td className="p-3">{item.timezone}</td>
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
