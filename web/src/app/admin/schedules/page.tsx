"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { formatRupiah } from "@/lib/currency";
import {
  createAdminFlight,
  deleteAdminFlight,
  getAdminAirlines,
  getAdminAirports,
  getAdminFlights,
  type AdminAirline,
  type AdminAirport,
  type AdminFlight,
  updateAdminFlight,
} from "@/lib/admin-api";

type ScheduleForm = {
  flightNumber: string;
  airlineId: number;
  originId: number;
  destinationId: number;
  basePrice: number;
  tax: number;
  adminFee: number;
  departureTime: string;
  arrivalTime: string;
  aircraft: string;
};

const toInputDateTime = (value: string) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const toIsoDateTime = (value: string) => new Date(value).toISOString();

export default function AdminSchedulesPage() {
  const [flights, setFlights] = useState<AdminFlight[]>([]);
  const [airlines, setAirlines] = useState<AdminAirline[]>([]);
  const [airports, setAirports] = useState<AdminAirport[]>([]);
  const [form, setForm] = useState<ScheduleForm>({
    flightNumber: "",
    airlineId: 0,
    originId: 0,
    destinationId: 0,
    basePrice: 0,
    tax: 0,
    adminFee: 0,
    departureTime: "",
    arrivalTime: "",
    aircraft: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const [flightData, airlineData, airportData] = await Promise.all([
        getAdminFlights(),
        getAdminAirlines(),
        getAdminAirports(),
      ]);

      setFlights(flightData);
      setAirlines(airlineData);
      setAirports(airportData);

      if (!editingId) {
        setForm((prev) => ({
          ...prev,
          airlineId: prev.airlineId || airlineData[0]?.id || 0,
          originId: prev.originId || airportData[0]?.id || 0,
          destinationId: prev.destinationId || airportData[1]?.id || airportData[0]?.id || 0,
        }));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat data jadwal.");
    } finally {
      setLoading(false);
    }
  }, [editingId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!form.flightNumber.trim() || !form.airlineId || !form.originId || !form.destinationId || !form.departureTime || !form.arrivalTime) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      if (editingId) {
        await updateAdminFlight(editingId, {
          flightNumber: form.flightNumber.trim(),
          airlineId: form.airlineId,
          originId: form.originId,
          destinationId: form.destinationId,
          departureTime: toIsoDateTime(form.departureTime),
          arrivalTime: toIsoDateTime(form.arrivalTime),
          basePrice: form.basePrice,
          tax: form.tax,
          adminFee: form.adminFee,
          aircraft: form.aircraft.trim(),
          status: "SCHEDULED",
        });
      } else {
        await createAdminFlight({
          flightNumber: form.flightNumber.trim(),
          airlineId: form.airlineId,
          originId: form.originId,
          destinationId: form.destinationId,
          departureTime: toIsoDateTime(form.departureTime),
          arrivalTime: toIsoDateTime(form.arrivalTime),
          basePrice: form.basePrice,
          tax: form.tax,
          adminFee: form.adminFee,
          aircraft: form.aircraft.trim(),
        });
      }

      setEditingId(null);
      setForm((prev) => ({
        flightNumber: "",
        airlineId: prev.airlineId,
        originId: prev.originId,
        destinationId: prev.destinationId,
        basePrice: 0,
        tax: 0,
        adminFee: 0,
        departureTime: "",
        arrivalTime: "",
        aircraft: "",
      }));
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan jadwal.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: AdminFlight) => {
    setForm({
      flightNumber: item.flightNumber,
      airlineId: item.airlineId,
      originId: item.originId,
      destinationId: item.destinationId,
      basePrice: item.basePrice,
      tax: item.tax,
      adminFee: item.adminFee,
      departureTime: toInputDateTime(item.departureTime),
      arrivalTime: toInputDateTime(item.arrivalTime),
      aircraft: item.aircraft ?? "",
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id: number) => {
    setMessage("");

    try {
      await deleteAdminFlight(id);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menghapus jadwal.");
    }
  };

  return (
    <AdminShell title="Flight Schedule Management" description="Atur rute, harga dasar tiket, waktu keberangkatan dan kedatangan.">
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <input value={form.flightNumber} onChange={(event) => setForm((prev) => ({ ...prev, flightNumber: event.target.value.toUpperCase() }))} placeholder="Flight Number (GA-001)" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <select value={form.airlineId} onChange={(event) => setForm((prev) => ({ ...prev, airlineId: Number(event.target.value) }))} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
            {airlines.map((item) => (
              <option key={item.id} value={item.id}>{item.code} - {item.name} ({item.country})</option>
            ))}
          </select>
          <select value={form.originId} onChange={(event) => setForm((prev) => ({ ...prev, originId: Number(event.target.value) }))} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
            {airports.map((item) => (
              <option key={item.id} value={item.id}>{item.city} - {item.name}</option>
            ))}
          </select>
          <select value={form.destinationId} onChange={(event) => setForm((prev) => ({ ...prev, destinationId: Number(event.target.value) }))} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
            {airports.map((item) => (
              <option key={item.id} value={item.id}>{item.city} - {item.name}</option>
            ))}
          </select>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Base Price (Rp)</label>
            <input type="number" value={form.basePrice} onChange={(event) => setForm((prev) => ({ ...prev, basePrice: Number(event.target.value) || 0 }))} placeholder="Base Price" className="w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Tax (Rp)</label>
            <input type="number" value={form.tax} onChange={(event) => setForm((prev) => ({ ...prev, tax: Number(event.target.value) || 0 }))} placeholder="Tax" className="w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Admin Fee (Rp)</label>
            <input type="number" value={form.adminFee} onChange={(event) => setForm((prev) => ({ ...prev, adminFee: Number(event.target.value) || 0 }))} placeholder="Admin Fee" className="w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Aircraft / Tipe Pesawat</label>
            <input value={form.aircraft} onChange={(event) => setForm((prev) => ({ ...prev, aircraft: event.target.value }))} placeholder="Aircraft" className="w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Waktu Keberangkatan</label>
            <input type="datetime-local" value={form.departureTime} onChange={(event) => setForm((prev) => ({ ...prev, departureTime: event.target.value }))} className="w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Waktu Kedatangan</label>
            <input type="datetime-local" value={form.arrivalTime} onChange={(event) => setForm((prev) => ({ ...prev, arrivalTime: event.target.value }))} className="w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          </div>
          <button disabled={saving} onClick={() => void handleSave()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 md:col-span-3">
            <Plus className="h-4 w-4" /> {editingId ? "Update Schedule" : "Save Schedule"}
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-rose-700">{message}</p>}
      </section>

      <section className="mt-5 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50 text-slate-600">
              <tr>
                <th className="rounded-l-xl p-3">Flight</th>
                <th className="p-3">Route</th>
                <th className="p-3">Base Price</th>
                <th className="p-3">Departure</th>
                <th className="p-3">Arrival</th>
                <th className="rounded-r-xl p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">Memuat jadwal penerbangan...</td>
                </tr>
              ) : flights.map((item) => (
                <tr key={item.id} className="border-b border-blue-100 last:border-0">
                  <td className="p-3 font-semibold">{item.flightNumber}</td>
                  <td className="p-3 font-semibold">{item.origin.city} → {item.destination.city}</td>
                  <td className="p-3">{formatRupiah(item.basePrice)}</td>
                  <td className="p-3">{new Date(item.departureTime).toLocaleString("id-ID")}</td>
                  <td className="p-3">{new Date(item.arrivalTime).toLocaleString("id-ID")}</td>
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
