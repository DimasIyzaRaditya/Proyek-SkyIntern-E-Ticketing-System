"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { airportSamples, type AirportItem } from "@/lib/mock-data";

export default function AdminAirportsPage() {
  const [airports, setAirports] = useState<AirportItem[]>(airportSamples);
  const [form, setForm] = useState<AirportItem>({ code: "", name: "", location: "" });
  const [editingCode, setEditingCode] = useState<string | null>(null);

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim() || !form.location.trim()) return;

    if (editingCode) {
      setAirports((prev) => prev.map((item) => (item.code === editingCode ? form : item)));
      setEditingCode(null);
    } else {
      setAirports((prev) => [...prev, { ...form, code: form.code.toUpperCase() }]);
    }

    setForm({ code: "", name: "", location: "" });
  };

  const handleEdit = (item: AirportItem) => {
    setForm(item);
    setEditingCode(item.code);
  };

  const handleDelete = (code: string) => {
    setAirports((prev) => prev.filter((item) => item.code !== code));
  };

  return (
    <AdminShell title="Airport Management (CRUD)" description="Tambah, edit, dan hapus data bandara: kode, nama, dan lokasi.">
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} placeholder="Code" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Name" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} placeholder="Location" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <button onClick={handleSave} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> {editingCode ? "Update" : "Add Airport"}
          </button>
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50 text-slate-600">
              <tr>
                <th className="rounded-l-xl p-3">Code</th>
                <th className="p-3">Name</th>
                <th className="p-3">Location</th>
                <th className="rounded-r-xl p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {airports.map((item) => (
                <tr key={item.code} className="border-b border-blue-100 last:border-0">
                  <td className="p-3 font-semibold">{item.code}</td>
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.location}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(item)} className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                      <button onClick={() => handleDelete(item.code)} className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
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
