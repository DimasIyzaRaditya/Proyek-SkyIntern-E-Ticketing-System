"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MainNav from "@/components/MainNav";
import { formatRupiah } from "@/lib/currency";
import { isAuthenticated } from "@/lib/auth";
import { getFlightDetailFromApi, type FlightCardItem } from "@/lib/flight-api";

const occupiedSeats = new Set(["2B", "3F", "5D", "7A", "8C", "10F"]);
const systemBlockedSeats = new Set(["4C", "6E"]);
const specialSeats = new Set(["1A", "1B", "1C", "1D", "12A", "12F"]);

function SeatSelectionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flightId = searchParams.get("flightId") ?? "";
  const authenticated = isAuthenticated();

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [flight, setFlight] = useState<FlightCardItem | null>(null);
  const [isLoadingFlight, setIsLoadingFlight] = useState(true);
  const [flightError, setFlightError] = useState<string | null>(null);

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

  const toggleSeat = (seat: string) => {
    if (occupiedSeats.has(seat) || systemBlockedSeats.has(seat)) return;
    setSelectedSeats((prev) => (prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]));
  };

  const extraPrice = selectedSeats.reduce((acc, seat) => acc + (specialSeats.has(seat) ? 150000 : 0), 0);

  const continueToPassenger = () => {
    if (!selectedSeats.length) return;

    const query = new URLSearchParams({
      flightId,
      origin: searchParams.get("origin") ?? "",
      destination: searchParams.get("destination") ?? "",
      departureDate: searchParams.get("departureDate") ?? "",
      returnDate: searchParams.get("returnDate") ?? searchParams.get("departureDate") ?? "",
      adult: searchParams.get("adult") ?? "1",
      child: searchParams.get("child") ?? "0",
      seats: selectedSeats.join(","),
      extraPrice: String(extraPrice),
    });

    router.push(`/booking/passenger?${query.toString()}`);
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
      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-3xl border border-blue-100 bg-white p-8 shadow-lg">
          <h1 className="text-3xl font-black text-slate-900">Seat Selection Page</h1>
          <p className="mt-1 text-sm text-slate-600">{activeFlight.airline} • {activeFlight.flightNumber} • Pilih kursi yang tersedia.</p>
          {flightError && <p className="mt-2 text-xs text-amber-700">{flightError}</p>}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="mb-4 flex flex-wrap gap-4 text-sm">
                <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded bg-green-500" /> Available</span>
                <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded bg-blue-600" /> Selected</span>
                <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded bg-slate-400" /> Occupied (Gray)</span>
                <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded bg-red-500" /> Occupied (Red)</span>
                <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded bg-amber-500" /> Special Seat (+{formatRupiah(150000)})</span>
              </div>

              <div className="grid grid-cols-6 gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                {Array.from({ length: 30 }, (_, index) => {
                  const row = Math.floor(index / 6) + 1;
                  const letter = String.fromCharCode(65 + (index % 6));
                  const seatId = `${row}${letter}`;
                  const isOccupied = occupiedSeats.has(seatId);
                  const isSystemBlocked = systemBlockedSeats.has(seatId);
                  const isSelected = selectedSeats.includes(seatId);
                  const isSpecial = specialSeats.has(seatId);

                  let className = "bg-green-500 text-white hover:bg-green-600";
                  if (isOccupied) className = "cursor-not-allowed bg-slate-400 text-white";
                  else if (isSystemBlocked) className = "cursor-not-allowed bg-red-500 text-white";
                  else if (isSelected) className = "bg-blue-600 text-white";
                  else if (isSpecial) className = "bg-amber-500 text-white hover:bg-amber-600";

                  return (
                    <button
                      key={seatId}
                      disabled={isOccupied || isSystemBlocked}
                      onClick={() => toggleSeat(seatId)}
                      className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${className}`}
                    >
                      {seatId}
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Selected Seat Info</h2>
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
              <button
                onClick={continueToPassenger}
                disabled={!selectedSeats.length}
                className="mt-4 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
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
