"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, RefreshCcw, Zap } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import {
  generateAdminSeats,
  getAdminFlightsPage,
  getAdminSeatMap,
  type AdminFlight,
  type AdminSeat,
} from "@/lib/admin-api";

const FLIGHT_PAGE_SIZE = 25;

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
  const [flightPage, setFlightPage] = useState(1);
  const [flightTotalItems, setFlightTotalItems] = useState(0);
  const [flightHasNextPage, setFlightHasNextPage] = useState(false);
  const [loadingMoreFlights, setLoadingMoreFlights] = useState(false);
  const [flightSearch, setFlightSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

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

  const loadFlightsPage = async (nextPage: number, append: boolean, searchTerm: string) => {
    if (append) setLoadingMoreFlights(true);
    else setLoadingFlights(true);

    try {
      const result = await getAdminFlightsPage({
        page: nextPage,
        limit: FLIGHT_PAGE_SIZE,
        search: searchTerm.trim() || undefined,
        sortBy: "departureTime",
        sortDirection: "asc",
      });

      setFlights((prev) => {
        if (!append) return result.data;

        const seen = new Set(prev.map((item) => item.id));
        const merged = [...prev];
        for (const item of result.data) {
          if (!seen.has(item.id)) {
            merged.push(item);
            seen.add(item.id);
          }
        }
        return merged;
      });

      setFlightPage(result.pagination.page);
      setFlightTotalItems(result.pagination.totalItems);
      setFlightHasNextPage(result.pagination.hasNextPage);

      setSelectedFlightId((prevSelected) => {
        if (prevSelected !== null) return prevSelected;
        return result.data[0]?.id ?? null;
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat daftar penerbangan.");
      setMessageType("error");
    } finally {
      setLoadingFlights(false);
      setLoadingMoreFlights(false);
    }
  };

  // Load first page of flights on mount
  useEffect(() => {
    void loadFlightsPage(1, false, "");
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      void loadFlightsPage(1, false, flightSearch);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [flightSearch]);

  const handleLoadMoreFlights = async () => {
    if (loadingMoreFlights || !flightHasNextPage) return;
    await loadFlightsPage(flightPage + 1, true, flightSearch);
  };

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

  const filteredFlights = useMemo(() => flights, [flights]);

  const selectedFlight = useMemo(
    () => flights.find((f) => f.id === selectedFlightId) ?? null,
    [flights, selectedFlightId],
  );

  const selectedFlightLabel = selectedFlight
    ? `[${selectedFlight.flightNumber}] ${selectedFlight.airline.name} — ${selectedFlight.origin?.city ?? "Origin"} → ${selectedFlight.destination?.city ?? "Destination"}`
    : "Pilih penerbangan";

  const stats = useMemo(() => {
    if (!seats) return { available: 0, reserved: 0, occupied: 0, total: 0 };

    const available = seats.filter((s) => s.status === "AVAILABLE").length;
    const reserved = seats.filter((s) => s.status === "RESERVED").length;
    const occupied = seats.filter((s) => s.status === "OCCUPIED").length;

    return { available, reserved, occupied, total: seats.length };
  }, [seats]);

  return (
    <AdminShell title="Seat Management" description="Konfigurasi dan generate kursi per penerbangan dari API.">
      <div className="w-full space-y-4">

        {/* Flight selector */}
        <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="order-2 min-w-0 flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-600">Pilih Penerbangan</label>
              {loadingFlights ? (
                <p className="text-sm text-slate-500">Memuat penerbangan...</p>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  {/* Trigger */}
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex min-h-11 w-full items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-left text-sm font-semibold text-slate-700"
                  >
                    <span className="min-w-0 flex-1 truncate text-left">
                      {selectedFlightLabel}
                    </span>
                    <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown panel */}
                  {dropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full max-w-full overflow-hidden rounded-xl border border-blue-100 bg-white shadow-lg">
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
                        <p className="mt-1 text-[11px] text-slate-500">
                          Menampilkan {flights.length} dari {flightTotalItems} penerbangan.
                        </p>
                      </div>

                      {/* List */}
                      <ul
                        className="max-h-64 overflow-y-auto pb-1"
                        style={{ WebkitOverflowScrolling: "touch" }}
                      >
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
                            <span className="line-clamp-2 wrap-break-word">
                              [{f.flightNumber}] {f.airline.name} — {f.origin?.city ?? "Origin"} → {f.destination?.city ?? "Destination"}
                            </span>
                          </li>
                        ))}
                        {filteredFlights.length === 0 && (
                          <li className="px-3 py-2 text-sm text-slate-400">Tidak ada hasil ditemukan.</li>
                        )}
                        {flightHasNextPage && (
                          <li className="border-t border-slate-100 p-2">
                            <button
                              type="button"
                              onClick={() => void handleLoadMoreFlights()}
                              disabled={loadingMoreFlights}
                              className="w-full rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {loadingMoreFlights ? "Memuat..." : "Muat lebih banyak penerbangan"}
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="order-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                onClick={() => void handleGenerate()}
                disabled={!selectedFlightId || generating}
                className="inline-flex min-w-0 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Zap className="h-4 w-4" /> {generating ? "Generating..." : "Generate Seats"}
              </button>

              <button
                onClick={() => {
                  if (!selectedFlightId) return;
                  void loadSeatMap(selectedFlightId);
                }}
                disabled={!selectedFlightId || loadingSeats}
                className="inline-flex min-w-0 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
              >
                <RefreshCcw className="h-4 w-4" /> Refresh
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
        <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="mb-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs font-semibold sm:grid-cols-3 lg:grid-cols-5">
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
            <div className="flex flex-wrap gap-1.5">
              {seats.map((seat) => (
                <div
                  key={seat.id}
                  className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold ${statusColor(seat.status)} ${classColor(seat.seat.seatClass)}`}
                  title={`${seat.seat.seatNumber} · ${seat.seat.seatClass} · ${seat.status}${seat.seat.isExitRow ? " · Exit Row" : ""}${seat.additionalPrice > 0 ? ` · +Rp${seat.additionalPrice.toLocaleString("id-ID")}` : ""}`}
                >
                  {seat.seat.seatNumber}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
