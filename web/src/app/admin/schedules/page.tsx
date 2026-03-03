"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { scheduleSamples, type ScheduleItem, formatRupiah } from "@/lib/mock-data";

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(scheduleSamples);
  const [form, setForm] = useState<ScheduleItem>({
    id: "",
    origin: "CGK",
    destination: "DPS",
    basePrice: 0,
    departureTime: "07:00",
    arrivalTime: "09:00",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = () => {
    if (editingId) {
      setSchedules((prev) => prev.map((item) => (item.id === editingId ? form : item)));
      setEditingId(null);
    } else {
      setSchedules((prev) => [...prev, { ...form, id: `SCH${String(prev.length + 1).padStart(3, "0")}` }]);
    }

    setForm({ id: "", origin: "CGK", destination: "DPS", basePrice: 0, departureTime: "07:00", arrivalTime: "09:00" });
  };

  const handleEdit = (item: ScheduleItem) => {
    setForm(item);
    setEditingId(item.id);
  };

  const handleDelete = (id: string) => {
    setSchedules((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <AdminShell title="Flight Schedule Management" description="Atur rute, harga dasar tiket, waktu keberangkatan dan kedatangan.">
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <input value={form.origin} onChange={(event) => setForm((prev) => ({ ...prev, origin: event.target.value.toUpperCase() }))} placeholder="Origin" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input value={form.destination} onChange={(event) => setForm((prev) => ({ ...prev, destination: event.target.value.toUpperCase() }))} placeholder="Destination" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input type="number" value={form.basePrice} onChange={(event) => setForm((prev) => ({ ...prev, basePrice: Number(event.target.value) || 0 }))} placeholder="Base Price" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input type="time" value={form.departureTime} onChange={(event) => setForm((prev) => ({ ...prev, departureTime: event.target.value }))} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input type="time" value={form.arrivalTime} onChange={(event) => setForm((prev) => ({ ...prev, arrivalTime: event.target.value }))} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <button onClick={handleSave} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> {editingId ? "Update Schedule" : "Save Schedule"}
          </button>
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50 text-slate-600">
              <tr>
                <th className="rounded-l-xl p-3">Route</th>
                <th className="p-3">Base Price</th>
                <th className="p-3">Departure</th>
                <th className="p-3">Arrival</th>
                <th className="rounded-r-xl p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((item) => (
                <tr key={item.id} className="border-b border-blue-100 last:border-0">
                  <td className="p-3 font-semibold">{item.origin} → {item.destination}</td>
                  <td className="p-3">{formatRupiah(item.basePrice)}</td>
                  <td className="p-3">{item.departureTime}</td>
                  <td className="p-3">{item.arrivalTime}</td>
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
