"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import ResponsiveSelect from "@/components/ResponsiveSelect";
import {
  createAdminFlight,
  getAdminAirlines,
  getAdminAirports,
  type AdminAirline,
  type AdminAirport,
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

const toIsoDateTime = (value: string) => new Date(value).toISOString();

const formatAirportOption = (airport: AdminAirport) => `${airport.city} - ${airport.name}`;

const splitLocalDateTime = (value: string) => {
  if (!value.includes("T")) {
    return { date: "", time: "" };
  }

  const [date, time] = value.split("T");
  return { date, time: (time ?? "").slice(0, 5) };
};

const mergeLocalDateTime = (date: string, time: string) => {
  if (!date) return "";
  return `${date}T${(time || "00:00").slice(0, 5)}`;
};

export default function AdminScheduleCreatePage() {
  const router = useRouter();

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const airlineOptions = useMemo(
    () => airlines.map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` })),
    [airlines],
  );
  const airportOptions = useMemo(
    () => airports.map((item) => ({ value: item.id, label: formatAirportOption(item) })),
    [airports],
  );
  const departureParts = useMemo(() => splitLocalDateTime(form.departureTime), [form.departureTime]);
  const arrivalParts = useMemo(() => splitLocalDateTime(form.arrivalTime), [form.arrivalTime]);

  useEffect(() => {
    const loadLookups = async () => {
      setLoading(true);
      setMessage("");

      try {
        const [airlineData, airportData] = await Promise.all([
          getAdminAirlines(),
          getAdminAirports(),
        ]);

        setAirlines(airlineData);
        setAirports(airportData);
        setForm((prev) => ({
          ...prev,
          airlineId: airlineData[0]?.id || 0,
          originId: airportData[0]?.id || 0,
          destinationId: airportData[1]?.id || airportData[0]?.id || 0,
        }));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load airline and airport options.");
      } finally {
        setLoading(false);
      }
    };

    void loadLookups();
  }, []);

  const handleSave = async () => {
    if (!form.flightNumber.trim() || !form.airlineId || !form.originId || !form.destinationId || !form.departureTime || !form.arrivalTime) {
      setMessage("Please complete all required schedule fields.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await createAdminFlight({
        flightNumber: form.flightNumber.trim().toUpperCase(),
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

      router.push("/admin/schedules");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create schedule.");
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Add Schedule" description="Create a new flight schedule and save it to the backend.">
      <section className="max-w-full overflow-hidden rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/admin/schedules"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-slate-600">Loading options...</p>
        ) : (
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">Flight Number</label>
              <input value={form.flightNumber} onChange={(event) => setForm((prev) => ({ ...prev, flightNumber: event.target.value.toUpperCase() }))} placeholder="GA-001" className="w-full min-w-0 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">Airline</label>
              <ResponsiveSelect value={form.airlineId} onChange={(nextValue) => setForm((prev) => ({ ...prev, airlineId: nextValue }))} options={airlineOptions} placeholder="Pilih maskapai" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">Origin</label>
              <ResponsiveSelect value={form.originId} onChange={(nextValue) => setForm((prev) => ({ ...prev, originId: nextValue }))} options={airportOptions} placeholder="Pilih bandara asal" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">Destination</label>
              <ResponsiveSelect value={form.destinationId} onChange={(nextValue) => setForm((prev) => ({ ...prev, destinationId: nextValue }))} options={airportOptions} placeholder="Pilih bandara tujuan" />
            </div>
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
              <label className="block text-xs font-semibold text-slate-600">Departure Time</label>
              <div className="grid grid-cols-1 gap-2 rounded-xl border border-blue-100 bg-blue-50 p-2 transition-all duration-300 ease-out focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-200 sm:grid-cols-2">
                <input
                  type="date"
                  value={departureParts.date}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      departureTime: mergeLocalDateTime(event.target.value, splitLocalDateTime(prev.departureTime).time),
                    }))
                  }
                  className="w-full min-w-0 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm outline-none ring-blue-200 transition duration-200 focus:ring"
                />
                <input
                  type="time"
                  value={departureParts.time}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      departureTime: mergeLocalDateTime(splitLocalDateTime(prev.departureTime).date, event.target.value),
                    }))
                  }
                  className="w-full min-w-0 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm outline-none ring-blue-200 transition duration-200 focus:ring"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">Arrival Time</label>
              <div className="grid grid-cols-1 gap-2 rounded-xl border border-blue-100 bg-blue-50 p-2 transition-all duration-300 ease-out focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-200 sm:grid-cols-2">
                <input
                  type="date"
                  value={arrivalParts.date}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      arrivalTime: mergeLocalDateTime(event.target.value, splitLocalDateTime(prev.arrivalTime).time),
                    }))
                  }
                  className="w-full min-w-0 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm outline-none ring-blue-200 transition duration-200 focus:ring"
                />
                <input
                  type="time"
                  value={arrivalParts.time}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      arrivalTime: mergeLocalDateTime(splitLocalDateTime(prev.arrivalTime).date, event.target.value),
                    }))
                  }
                  className="w-full min-w-0 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm outline-none ring-blue-200 transition duration-200 focus:ring"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">Aircraft</label>
              <input value={form.aircraft} onChange={(event) => setForm((prev) => ({ ...prev, aircraft: event.target.value }))} placeholder="Boeing 737-800" className="w-full min-w-0 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
            </div>
            <div className="sm:col-span-2 xl:col-span-3">
              <button disabled={saving} onClick={() => void handleSave()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto">
                <Plus className="h-4 w-4" /> Save Schedule
              </button>
            </div>
          </div>
        )}

        {message && <p className="mt-3 text-sm text-rose-700">{message}</p>}
      </section>
    </AdminShell>
  );
}
