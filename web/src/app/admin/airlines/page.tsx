"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { airlineSamples, type AirlineItem } from "@/lib/mock-data";

export default function AdminAirlinesPage() {
  const [airlines, setAirlines] = useState<AirlineItem[]>(airlineSamples);
  const [form, setForm] = useState<AirlineItem>({ id: "", name: "", logo: "✈️" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = () => {
    if (!form.name.trim()) return;

    if (editingId) {
      setAirlines((prev) => prev.map((item) => (item.id === editingId ? form : item)));
      setEditingId(null);
    } else {
      setAirlines((prev) => [...prev, { ...form, id: `AL${String(prev.length + 1).padStart(3, "0")}` }]);
    }

    setForm({ id: "", name: "", logo: "✈️" });
  };

  const handleEdit = (item: AirlineItem) => {
    setForm(item);
    setEditingId(item.id);
  };

  const handleDelete = (id: string) => {
    setAirlines((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <AdminShell title="Airline Management" description="Input data maskapai, logo, dan lakukan add/edit/delete.">
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Airline Name" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input value={form.logo} onChange={(event) => setForm((prev) => ({ ...prev, logo: event.target.value }))} placeholder="Logo (emoji/url text)" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <button onClick={handleSave} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> {editingId ? "Update" : "Add Airline"}
          </button>
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50 text-slate-600">
              <tr>
                <th className="rounded-l-xl p-3">Logo</th>
                <th className="p-3">Airline Name</th>
                <th className="p-3">ID</th>
                <th className="rounded-r-xl p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {airlines.map((item) => (
                <tr key={item.id} className="border-b border-blue-100 last:border-0">
                  <td className="p-3 text-xl">{item.logo}</td>
                  <td className="p-3 font-semibold">{item.name}</td>
                  <td className="p-3">{item.id}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(item)} className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
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
