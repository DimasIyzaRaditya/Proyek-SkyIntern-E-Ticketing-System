"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCcw } from "lucide-react";
import MainNav from "@/components/MainNav";
import { formatRupiah } from "@/lib/currency";
import { isAuthenticated, getAuthToken } from "@/lib/auth";
import { getFlightDetailFromApi, type FlightCardItem } from "@/lib/flight-api";
import { getAdminSeatMap, holdFlightSeats, releaseFlightSeats, type AdminSeat } from "@/lib/admin-api";
import { API_BASE_URL } from "@/lib/api-client";


function SeatSelectionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flightId = searchParams.get("flightId") ?? "";
  const adult = Math.max(1, parseInt(searchParams.get("adult") ?? "1", 10) || 1);
  const child = Math.max(0, parseInt(searchParams.get("child") ?? "0", 10) || 0);
  const totalPassengers = adult + child;
  const [authenticated, setAuthenticated] = useState(true);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [holdingSeats, setHoldingSeats] = useState<Set<string>>(new Set());
  const [flight, setFlight] = useState<FlightCardItem | null>(null);
  const [isLoadingFlight, setIsLoadingFlight] = useState(true);
  const [flightError, setFlightError] = useState<string | null>(null);
  const [seatData, setSeatData] = useState<AdminSeat[]>([]);
  const [seatLoading, setSeatLoading] = useState(false);
  const [seatError, setSeatError] = useState<string | null>(null);

  // Refs for cleanup (beforeunload captures stale closures without refs)
  const selectedSeatsRef = useRef<string[]>([]);
  const seatIdMapRef = useRef<Map<string, number>>(new Map());

  // Derived seat sets from API data
  const occupiedSeats = useMemo(
    () => new Set(seatData.filter((s) => s.status !== "AVAILABLE").map((s) => s.seat.seatNumber)),
    [seatData],
  );
  const specialSeats = useMemo(
    () => new Set(seatData.filter((s) => s.additionalPrice > 0).map((s) => s.seat.seatNumber)),
    [seatData],
  );
  const specialPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    seatData.forEach((s) => {
      if (s.additionalPrice > 0) map.set(s.seat.seatNumber, s.additionalPrice);
    });
    return map;
  }, [seatData]);
  // All seat numbers from API (for grid)
  const allSeatNumbers = useMemo(
    () => seatData.map((s) => s.seat.seatNumber),
    [seatData],
  );
  // Map seat number → FlightSeat ID (needed for hold/release API calls)
  const seatIdMap = useMemo(() => {
    const map = new Map<string, number>();
    seatData.forEach((s) => map.set(s.seat.seatNumber, s.id));
    seatIdMapRef.current = map;
    return map;
  }, [seatData]);

  useEffect(() => {
    if (!authenticated) {
      const redirect = encodeURIComponent(`/booking/seat?${searchParams.toString()}`);
      router.replace(`/auth/login?redirect=${redirect}`);
    }
  }, [authenticated, router, searchParams]);

  const fallbackFlight = useMemo<FlightCardItem>(() => ({
    id: flightId || "-",
    flightNumber: (searchParams.get("flightNumber") ?? flightId) || "-",
    airline: searchParams.get("airlineName") ?? "Airline",
    logo: "✈️",
    aircraft: "Aircraft",
    origin: searchParams.get("origin") ?? "Origin",
    destination: searchParams.get("destination") ?? "Destination",
    departureTime: "-",
    arrivalTime: "-",
    duration: "-",
    price: Number(searchParams.get("price") ?? "0"),
    basePrice: Number(searchParams.get("price") ?? "0"),
    tax: 0,
    adminFee: 0,
    facilities: ["Cabin Bag 7kg"],
  }), [flightId, searchParams]);

  useEffect(() => {
    let isMounted = true;

    const loadFlight = async () => {
      if (!flightId) {
        setFlight(fallbackFlight);
        setIsLoadingFlight(false);
        return;
      }

      try {
        setIsLoadingFlight(true);
        setFlightError(null);
        const data = await getFlightDetailFromApi(flightId);
        if (!isMounted) return;
        setFlight(data);
      } catch (error) {
        if (!isMounted) return;
        setFlight(fallbackFlight);
        setFlightError(error instanceof Error ? error.message : "Gagal memuat data flight dari backend.");
      } finally {
        if (isMounted) {
          setIsLoadingFlight(false);
        }
      }
    };

    loadFlight();

    return () => {
      isMounted = false;
    };
  }, [fallbackFlight, flightId]);

  useEffect(() => {
    if (!flightId) return;
    setSeatLoading(true);
    setSeatError(null);
    getAdminSeatMap(Number(flightId))
      .then((seats) => setSeatData(seats))
      .catch((err) => setSeatError(err instanceof Error ? err.message : "Gagal memuat peta kursi."))
      .finally(() => setSeatLoading(false));
  }, [flightId]);

  const reloadSeats = useCallback(() => {
    if (!flightId) return;
    setSeatLoading(true);
    setSeatError(null);
    getAdminSeatMap(Number(flightId))
      .then((seats) => setSeatData(seats))
      .catch((err) => setSeatError(err instanceof Error ? err.message : "Gagal memuat peta kursi."))
      .finally(() => setSeatLoading(false));
  }, [flightId]);

  // Polling setiap 15 detik agar perubahan dari user lain langsung terlihat
  useEffect(() => {
    if (!flightId) return;
    const interval = setInterval(() => {
      getAdminSeatMap(Number(flightId))
        .then((seats) => setSeatData(seats))
        .catch(() => { /* silent fail on background poll */ });
    }, 15000);
    return () => clearInterval(interval);
  }, [flightId]);

  // Lepaskan semua hold saat user menutup tab/browser (best-effort)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const ids = selectedSeatsRef.current
        .map((sn) => seatIdMapRef.current.get(sn))
        .filter((id): id is number => id !== undefined);
      if (ids.length > 0 && flightId) {
        const token = getAuthToken();
        void fetch(`${API_BASE_URL}/api/flights/${flightId}/seats/release`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ seatIds: ids }),
          keepalive: true,
        });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [flightId]);

  // Lepaskan semua hold saat komponen di-unmount (navigasi ke halaman lain)
  useEffect(() => {
    return () => {
      const ids = selectedSeatsRef.current
        .map((sn) => seatIdMapRef.current.get(sn))
        .filter((id): id is number => id !== undefined);
      if (ids.length > 0 && flightId) {
        releaseFlightSeats(Number(flightId), ids).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSeat = async (seatNumber: string) => {
    if (occupiedSeats.has(seatNumber) || holdingSeats.has(seatNumber)) return;

    const flightSeatId = seatIdMap.get(seatNumber);
    if (!flightSeatId || !flightId) return;

    const isSelected = selectedSeats.includes(seatNumber);

    // Jika kursi penuh dan user ingin menambah kursi baru, tolak
    if (!isSelected && selectedSeats.length >= totalPassengers) return;

    // Tandai sebagai "sedang diproses" agar tidak di-klik ganda
    setHoldingSeats((prev) => new Set([...prev, seatNumber]));

    try {
      if (isSelected) {
        // Deselect: lepas hold ke server
        await releaseFlightSeats(Number(flightId), [flightSeatId]);
        const next = selectedSeats.filter((s) => s !== seatNumber);
        setSelectedSeats(next);
        selectedSeatsRef.current = next;
      } else {
        // Select: kunci seat di server
        await holdFlightSeats(Number(flightId), [flightSeatId]);
        const next = [...selectedSeats, seatNumber];
        setSelectedSeats(next);
        selectedSeatsRef.current = next;
      }
    } catch {
      // Hold gagal (kursi sudah diambil pengguna lain) → refresh peta kursi
      if (!isSelected) {
        reloadSeats();
      }
    } finally {
      setHoldingSeats((prev) => {
        const next = new Set(prev);
        next.delete(seatNumber);
        return next;
      });
    }
  };

  const extraPrice = selectedSeats.reduce((acc, seat) => acc + (specialPriceMap.get(seat) ?? 0), 0);

  const continueToPassenger = () => {
    if (selectedSeats.length !== totalPassengers) return;

    const existingBookingId = searchParams.get("existingBookingId") ?? "";
    // Kumpulkan FlightSeat ID (integer) dari setiap nomor kursi yang dipilih
    const flightSeatIds = selectedSeats
      .map((sn) => seatIdMap.get(sn))
      .filter((id): id is number => id !== undefined);

    const params: Record<string, string> = {
      flightId,
      origin: searchParams.get("origin") ?? "",
      destination: searchParams.get("destination") ?? "",
      departureDate: searchParams.get("departureDate") ?? "",
      returnDate: searchParams.get("returnDate") ?? searchParams.get("departureDate") ?? "",
      adult: searchParams.get("adult") ?? "1",
      child: searchParams.get("child") ?? "0",
      seats: selectedSeats.join(","),
      seatFlightIds: flightSeatIds.join(","),
      extraPrice: String(extraPrice),
    };
    if (existingBookingId) params.existingBookingId = existingBookingId;

    router.push(`/booking/passenger?${new URLSearchParams(params).toString()}`);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
        <MainNav />
      </div>
    );
  }

  if (isLoadingFlight) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
        <MainNav />
        <main className="mx-auto max-w-7xl px-6 py-10">
          <section className="rounded-3xl border border-blue-100 bg-white p-8 text-sm text-slate-600 shadow-lg">
            Memuat data penerbangan dari backend...
          </section>
        </main>
      </div>
    );
  }

  const activeFlight = flight ?? fallbackFlight;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-7xl px-3 sm:px-6 py-6 sm:py-10">
        <section className="rounded-2xl sm:rounded-3xl border border-blue-100 bg-white p-4 sm:p-6 lg:p-8 shadow-lg">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900">Pilih Kursi</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">{activeFlight.airline} • {activeFlight.flightNumber} • Pilih kursi yang tersedia.</p>
          <p className="mt-1 text-xs text-slate-500">{adult} Dewasa{child > 0 ? ` + ${child} Anak` : ""} — Pilih tepat <span className="font-semibold text-blue-700">{totalPassengers} kursi</span></p>
          {flightError && <p className="mt-2 text-xs text-amber-700">{flightError}</p>}

          <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 md:grid-cols-[1fr_260px] lg:grid-cols-[1fr_320px]">
            <div>
              <div className="mb-3 sm:mb-4 flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 sm:h-4 sm:w-4 rounded bg-green-500" /> Tersedia</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 sm:h-4 sm:w-4 rounded bg-blue-600" /> Dipilih</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 sm:h-4 sm:w-4 rounded bg-red-400" /> Terisi</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 sm:h-4 sm:w-4 rounded bg-orange-500" /> Spesial (+harga)</span>
              </div>

              {seatLoading ? (
                <p className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">
                  Memuat peta kursi...
                </p>
              ) : seatError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-700">{seatError}</p>
                  <button onClick={reloadSeats} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200">
                    <RefreshCcw className="h-3.5 w-3.5" /> Coba Lagi
                  </button>
                </div>
              ) : allSeatNumbers.length === 0 ? (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-700">Peta kursi belum tersedia untuk penerbangan ini.</p>
                  <p className="mt-1 text-xs text-amber-600">Kode Penerbangan: <code>{activeFlight.flightNumber || "(kosong)"}</code> — Minta admin untuk generate kursi.</p>
                  <button onClick={reloadSeats} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200">
                    <RefreshCcw className="h-3.5 w-3.5" /> Refresh
                  </button>
                </div>
              ) : (
                <div className="rounded-xl sm:rounded-2xl border border-blue-100 bg-blue-50 p-2 sm:p-4">
                  <div className="grid grid-cols-6 gap-1 sm:gap-2">
                  {allSeatNumbers.map((seatId) => {
                    const isOccupied = occupiedSeats.has(seatId);
                    const isSelected = selectedSeats.includes(seatId);
                    const isHolding = holdingSeats.has(seatId);
                    const isSpecial = specialSeats.has(seatId);
                    const isFull = !isSelected && selectedSeats.length >= totalPassengers;
                    const extraAmt = specialPriceMap.get(seatId) ?? 0;

                    let className = "bg-green-500 text-white hover:bg-green-600 ring-1 ring-green-600";
                    if (isOccupied) className = "cursor-not-allowed bg-red-400 text-white ring-1 ring-red-500";
                    else if (isHolding) className = "cursor-wait bg-yellow-300 text-slate-700";
                    else if (isSelected) className = "bg-blue-600 text-white ring-2 ring-blue-800 scale-105";
                    else if (isFull) className = "cursor-not-allowed bg-slate-200 text-slate-400 ring-1 ring-slate-300";
                    else if (isSpecial) className = "bg-orange-500 text-white hover:bg-orange-600 ring-1 ring-orange-700";

                    return (
                      <button
                        key={seatId}
                        disabled={isOccupied || isHolding || isFull}
                        onClick={() => { void toggleSeat(seatId); }}
                        title={isOccupied ? "Sudah terisi" : isFull ? `Batas ${totalPassengers} kursi tercapai` : isSpecial ? `+${formatRupiah(extraAmt)}` : seatId}
                        className={`flex items-center justify-center rounded-md sm:rounded-lg px-0.5 py-1 text-[9px] xs:text-[10px] sm:px-2 sm:py-2 sm:text-xs font-semibold leading-none transition ${className}`}
                      >
                        {isHolding ? "..." : seatId}
                      </button>
                    );
                  })}
                  </div>
                </div>
              )}
            </div>

            <aside className="rounded-xl sm:rounded-2xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Selected Seat Info</h2>

              {/* Passenger seat counter */}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-xs text-slate-500">Kursi terpilih</span>
                <span className={`text-sm font-bold ${
                  selectedSeats.length === totalPassengers ? "text-green-600" : "text-blue-700"
                }`}>
                  {selectedSeats.length} / {totalPassengers}
                </span>
              </div>

              {/* Slot indicators */}
              <div className="mt-2 flex gap-1.5">
                {Array.from({ length: totalPassengers }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      i < selectedSeats.length ? "bg-blue-500" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              <div className="mt-3 min-h-16 space-x-2 space-y-2">
                {selectedSeats.length ? (
                  selectedSeats.map((seat) => (
                    <span key={seat} className="inline-block rounded-xl bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">{seat}</span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Belum ada kursi dipilih.</p>
                )}
              </div>
              <p className="mt-4 text-sm text-slate-600">Extra Price: <span className="font-bold text-blue-700">{formatRupiah(extraPrice)}</span></p>
              <p className="mt-1 text-xs text-slate-500">Kursi khusus seperti Exit Row otomatis menambah biaya kursi.</p>
              {selectedSeats.length < totalPassengers && (
                <p className="mt-2 text-xs font-medium text-amber-600">Pilih {totalPassengers - selectedSeats.length} kursi lagi untuk melanjutkan.</p>
              )}
              <button
                onClick={continueToPassenger}
                disabled={selectedSeats.length !== totalPassengers}
                className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Continue
              </button>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function SeatSelectionPage() {
  return (
    <Suspense>
      <SeatSelectionPageContent />
    </Suspense>
  );
}
