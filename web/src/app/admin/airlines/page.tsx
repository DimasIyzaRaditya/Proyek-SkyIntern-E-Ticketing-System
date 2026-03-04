"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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

export default function AdminAirlinesPage() {
  const [airlines, setAirlines] = useState<AdminAirline[]>([]);
  const [form, setForm] = useState<AirlineForm>({ code: "", name: "", country: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.country.trim()) return;

    setSaving(true);
    setMessage("");

    try {
      if (editingId) {
        await updateAdminAirline(editingId, {
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          country: form.country.trim(),
        });
      } else {
        await createAdminAirline({
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          country: form.country.trim(),
        });
      }

      setEditingId(null);
      setForm({ code: "", name: "", country: "" });
      await loadAirlines();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan data maskapai.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: AdminAirline) => {
    setForm({ code: item.code, name: item.name, country: item.country });
    setEditingId(item.id);
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
          <button disabled={saving} onClick={() => void handleSave()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
            <Plus className="h-4 w-4" /> {editingId ? "Update" : "Add Airline"}
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-rose-700">{message}</p>}
      </section>

      <section className="mt-5 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50 text-slate-600">
              <tr>
                <th className="rounded-l-xl p-3">Code</th>
                <th className="p-3">Airline Name</th>
                <th className="p-3">Country</th>
                <th className="p-3">ID</th>
                <th className="rounded-r-xl p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">Memuat data maskapai...</td>
                </tr>
              ) : airlines.map((item) => (
                <tr key={item.id} className="border-b border-blue-100 last:border-0">
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
