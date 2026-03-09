"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, RefreshCcw, Zap } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import {
  generateAdminSeats,
  getAdminFlights,
  getAdminSeatMap,
  type AdminFlight,
  type AdminSeat,
} from "@/lib/admin-api";

const statusColor = (status: AdminSeat["status"]) => {
  if (status === "AVAILABLE") return "bg-emerald-500 text-white";
  if (status === "RESERVED") return "bg-amber-400 text-white";
  return "bg-slate-500 text-white";
};

const classColor = (cls: AdminSeat["seat"]["seatClass"]) => {
  if (cls === "FIRST") return "ring-2 ring-yellow-400";
  if (cls === "BUSINESS") return "ring-2 ring-blue-400";
  return "";
};

export default function AdminSeatsPage() {
  const [flights, setFlights] = useState<AdminFlight[]>([]);
  const [selectedFlightId, setSelectedFlightId] = useState<number | null>(null);
  const [seats, setSeats] = useState<AdminSeat[]>([]);
  const [loadingFlights, setLoadingFlights] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const [flightSearch, setFlightSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadSeatMap = async (flightId: number) => {
    setLoadingSeats(true);
    setMessage("");
    try {
      const data = await getAdminSeatMap(flightId);
      setSeats(data);
    } catch (error) {
      setSeats([]);
      setMessage(error instanceof Error ? error.message : "Gagal memuat seat map.");
      setMessageType("error");
    } finally {
      setLoadingSeats(false);
    }
  };

  // Load all flights on mount
  useEffect(() => {
    const load = async () => {
      setLoadingFlights(true);
      try {
        const data = await getAdminFlights();
        setFlights(data);
        if (data.length > 0) {
          setSelectedFlightId(data[0].id);
        } else {
          setSelectedFlightId(null);
          setSeats([]);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Gagal memuat daftar penerbangan.");
        setMessageType("error");
      } finally {
        setLoadingFlights(false);
      }
    };
    void load();
  }, []);

  // Load seat map when selected flight changes
  useEffect(() => {
    if (!selectedFlightId) return;
    void loadSeatMap(selectedFlightId);
  }, [selectedFlightId]);

  const handleGenerate = async () => {
    if (!selectedFlightId) return;
    setGenerating(true);
    setMessage("");
    try {
      const result = await generateAdminSeats(selectedFlightId);
      setMessage(result.message || "Kursi berhasil di-generate.");
      setMessageType("success");
      // Reload seat map
      const updated = await getAdminSeatMap(selectedFlightId);
      setSeats(updated);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal generate kursi.");
      setMessageType("error");
    } finally {
      setGenerating(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredFlights = useMemo(() => {
    const q = flightSearch.toLowerCase();
    if (!q) return flights;
    return flights.filter(
      (f) =>
        f.flightNumber.toLowerCase().includes(q) ||
        f.airline.name.toLowerCase().includes(q) ||
        (f.origin?.city ?? "").toLowerCase().includes(q) ||
        (f.destination?.city ?? "").toLowerCase().includes(q),
    );
  }, [flights, flightSearch]);

  const selectedFlight = useMemo(
    () => flights.find((f) => f.id === selectedFlightId) ?? null,
    [flights, selectedFlightId],
  );

const stats = useMemo(() => {
  if (!seats) return { available: 0, reserved: 0, occupied: 0, total: 0 };

  const available = seats.filter((s) => s.status === "AVAILABLE").length;
  const reserved = seats.filter((s) => s.status === "RESERVED").length;
  const occupied = seats.filter((s) => s.status === "OCCUPIED").length;

  return { available, reserved, occupied, total: seats.length };
}, [seats]);
  return (
    <AdminShell title="Seat Management" description="Konfigurasi dan generate kursi per penerbangan dari API.">

      {/* Flight selector */}
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-48">
            <label className="mb-1 block text-xs font-semibold text-slate-600">Pilih Penerbangan</label>
            {loadingFlights ? (
              <p className="text-sm text-slate-500">Memuat penerbangan...</p>
            ) : (
              <div className="relative" ref={dropdownRef}>
                {/* Trigger */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex w-full items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  <span className="truncate">
                    {selectedFlight
                      ? `[${selectedFlight.flightNumber}] ${selectedFlight.airline.name} — ${selectedFlight.origin?.city ?? "Origin"} → ${selectedFlight.destination?.city ?? "Destination"}`
                      : "Pilih penerbangan"}
                  </span>
                  <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full min-w-70 rounded-xl border border-blue-100 bg-white shadow-lg">
                    {/* Search input */}
                    <div className="p-2">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Cari nomor, maskapai, atau kota..."
                        value={flightSearch}
                        onChange={(e) => setFlightSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400"
                      />
                    </div>

                    {/* List */}
                    <ul className="max-h-60 overflow-y-auto pb-1">
                      <li
                        className="cursor-pointer px-3 py-2 text-sm text-slate-400 hover:bg-blue-50"
                        onClick={() => { setSelectedFlightId(null); setDropdownOpen(false); setFlightSearch(""); }}
                      >
                        Pilih penerbangan
                      </li>
                      {filteredFlights.map((f) => (
                        <li
                          key={f.id}
                          className={`cursor-pointer px-3 py-2 text-sm font-semibold hover:bg-blue-50 ${
                            f.id === selectedFlightId ? "bg-blue-100 text-blue-700" : "text-slate-700"
                          }`}
                          onClick={() => { setSelectedFlightId(f.id); setDropdownOpen(false); setFlightSearch(""); }}
                        >
                          [{f.flightNumber}] {f.airline.name} — {f.origin?.city ?? "Origin"} → {f.destination?.city ?? "Destination"}
                        </li>
                      ))}
                      {filteredFlights.length === 0 && (
                        <li className="px-3 py-2 text-sm text-slate-400">Tidak ada hasil ditemukan.</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                if (!selectedFlightId) return;
                void loadSeatMap(selectedFlightId);
              }}
              disabled={!selectedFlightId || loadingSeats}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>

            <button
              onClick={() => void handleGenerate()}
              disabled={!selectedFlightId || generating}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Zap className="h-4 w-4" /> {generating ? "Generating..." : "Generate Seats"}
            </button>
          </div>
        </div>

        {message && (
          <p className={`mt-3 text-sm font-medium ${messageType === "success" ? "text-emerald-700" : "text-rose-700"}`}>
            {message}
          </p>
        )}
      </section>

      {/* Seat stats */}
      {selectedFlight && seats.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-white p-4 text-center shadow-sm">
            <p className="text-xs text-slate-500">Total Kursi</p>
            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center shadow-sm">
            <p className="text-xs text-slate-500">Available</p>
            <p className="text-2xl font-black text-emerald-700">{stats.available}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-center shadow-sm">
            <p className="text-xs text-slate-500">Reserved</p>
            <p className="text-2xl font-black text-amber-700">{stats.reserved}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center shadow-sm">
            <p className="text-xs text-slate-500">Occupied</p>
            <p className="text-2xl font-black text-slate-700">{stats.occupied}</p>
          </div>
        </div>
      )}

      {/* Seat map */}
      <section className="mt-4 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-4 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500 inline-block" /> Available</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-400 inline-block" /> Reserved</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-500 inline-block" /> Occupied</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded ring-2 ring-yellow-400 bg-white inline-block" /> First Class</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded ring-2 ring-blue-400 bg-white inline-block" /> Business</span>
        </div>

        {loadingSeats ? (
          <p className="py-8 text-center text-sm text-slate-500">Memuat seat map dari backend...</p>
        ) : seats.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="font-semibold text-amber-700">Belum ada kursi untuk penerbangan ini.</p>
            <p className="mt-1 text-sm text-amber-600">Klik <strong>Generate Seats</strong> untuk membuat layout kursi standar.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {seats.map((seat) => (
              <div
                key={seat.id}
                className={`rounded-lg px-2.5 py-2 text-xs font-semibold ${statusColor(seat.status)} ${classColor(seat.seat.seatClass)}`}
                title={`${seat.seat.seatNumber} · ${seat.seat.seatClass} · ${seat.status}${seat.seat.isExitRow ? " · Exit Row" : ""}${seat.additionalPrice > 0 ? ` · +Rp${seat.additionalPrice.toLocaleString("id-ID")}` : ""}`}
              >
                {seat.seat.seatNumber}
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
