"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import MainNav from "@/components/MainNav";
import LazySection from "@/components/LazySection";
import { formatRupiah } from "@/lib/currency";
import { type FlightCardItem, searchFlightsFromApi } from "@/lib/flight-api";

type FlightInfoTab = "details" | "fare" | "refund" | "reschedule" | "promos";

const flightTabs: Array<{ key: FlightInfoTab; label: string }> = [
  { key: "details", label: "Flight Details" },
  { key: "fare", label: "Fare & Benefits" },
  { key: "refund", label: "Refund" },
  { key: "reschedule", label: "Reschedule" },
  { key: "promos", label: "Promos 🎟️" },
];

const extractAirportCode = (value: string) => {
  const match = value.match(/\(([A-Z]{3})\)$/);
  if (match) return match[1];
  return value.split(" - ")[0].trim();
};

function SearchResultsPageContent() {
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "duration" | "departure">("price-low");
  const [activeTabs, setActiveTabs] = useState<Record<string, FlightInfoTab>>({});
  const [sortedFlights, setSortedFlights] = useState<FlightCardItem[]>([]);
  const [isLoadingFlights, setIsLoadingFlights] = useState(true);
  const [flightError, setFlightError] = useState<string | null>(null);

  const origin = searchParams.get("origin") ?? "CGK - Jakarta";
  const destination = searchParams.get("destination") ?? "DPS - Denpasar";
  const departureDate = searchParams.get("departureDate") ?? "2026-03-15";
  const returnDate = searchParams.get("returnDate") ?? departureDate;
  const adult = searchParams.get("adult") ?? "1";
  const child = searchParams.get("child") ?? "0";

  useEffect(() => {
    let isMounted = true;

    const loadFlights = async () => {
      try {
        setIsLoadingFlights(true);
        setFlightError(null);
        const data = await searchFlightsFromApi({
          origin,
          destination,
          departureDate,
          adult,
          child,
          sortBy,
        });
        if (!isMounted) return;
        setSortedFlights(data);
      } catch (error) {
        if (!isMounted) return;
        setSortedFlights([]);
        setFlightError(error instanceof Error ? error.message : "Terjadi kesalahan saat mengambil flight.");
      } finally {
        if (isMounted) {
          setIsLoadingFlights(false);
        }
      }
    };

    loadFlights();

    return () => {
      isMounted = false;
    };
  }, [adult, child, departureDate, destination, origin, sortBy]);

  const getActiveTab = (flightId: string): FlightInfoTab => activeTabs[flightId] ?? "details";

  const renderTabContent = (flightId: string) => {
    const flight = sortedFlights.find((item) => item.id === flightId);
    if (!flight) return null;

    const activeTab = getActiveTab(flightId);

    if (activeTab === "details") {
      return (
        <p className="text-sm text-slate-600">
          {flight.aircraft} • {extractAirportCode(flight.origin)} → {extractAirportCode(flight.destination)} • {flight.departureTime} - {flight.arrivalTime} ({flight.duration})
        </p>
      );
    }

    if (activeTab === "fare") {
      return (
        <p className="text-sm text-slate-600">
          Termasuk: {flight.facilities.join(", ")} • Cabin baggage 7kg • Free seat selection pada periode promo.
        </p>
      );
    }

    if (activeTab === "refund") {
      return <p className="text-sm text-slate-600">Refund tersedia sesuai ketentuan maskapai, estimasi proses 3-14 hari kerja.</p>;
    }

    if (activeTab === "reschedule") {
      return <p className="text-sm text-slate-600">Jadwal dapat diubah sebelum keberangkatan dengan potensi selisih tarif dan biaya layanan.</p>;
    }

    return <p className="text-sm text-slate-600">Promo aktif: potongan bundling pulang-pergi, bonus poin member, dan voucher check-in prioritas.</p>;
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-7xl px-6 py-10 page-enter">
        <h1 className="text-3xl font-black text-slate-900">Hasil Pencarian Penerbangan</h1>
        <p className="mt-1 text-sm text-slate-600">
          {origin} → {destination} • {departureDate} - {returnDate} • {adult} Adult / {child} Child
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Filter Section</h2>
            <div className="mt-4 space-y-2 text-sm">
              <button onClick={() => setSortBy("price-low")} className={`w-full rounded-xl border px-3 py-2 text-left font-medium transition ${sortBy === "price-low" ? "border-blue-600 bg-blue-600 text-white" : "border-blue-100 bg-blue-50 text-slate-700 hover:bg-blue-100"}`}>Price Low to High</button>
              <button onClick={() => setSortBy("price-high")} className={`w-full rounded-xl border px-3 py-2 text-left font-medium transition ${sortBy === "price-high" ? "border-blue-600 bg-blue-600 text-white" : "border-blue-100 bg-blue-50 text-slate-700 hover:bg-blue-100"}`}>Price High to Low</button>
              <button onClick={() => setSortBy("duration")} className={`w-full rounded-xl border px-3 py-2 text-left font-medium transition ${sortBy === "duration" ? "border-blue-600 bg-blue-600 text-white" : "border-blue-100 bg-blue-50 text-slate-700 hover:bg-blue-100"}`}>Duration</button>
              <button onClick={() => setSortBy("departure")} className={`w-full rounded-xl border px-3 py-2 text-left font-medium transition ${sortBy === "departure" ? "border-blue-600 bg-blue-600 text-white" : "border-blue-100 bg-blue-50 text-slate-700 hover:bg-blue-100"}`}>Departure Time</button>
            </div>
          </aside>

          <section className="space-y-4">
            {isLoadingFlights && (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        {/* Airline name + time grid */}
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="skeleton h-6 w-36 rounded-lg" />
                          <div className="grid min-w-60 grid-cols-[auto_1fr_auto] items-center gap-4 text-center">
                            <div className="space-y-1">
                              <div className="skeleton h-9 w-16 rounded" />
                              <div className="skeleton mx-auto h-3.5 w-10 rounded" />
                            </div>
                            <div className="space-y-2">
                              <div className="skeleton mx-auto h-3.5 w-14 rounded" />
                              <div className="skeleton mx-auto h-0.5 w-14 rounded-full" />
                            </div>
                            <div className="space-y-1">
                              <div className="skeleton h-9 w-16 rounded" />
                              <div className="skeleton mx-auto h-3.5 w-10 rounded" />
                            </div>
                          </div>
                        </div>
                        {/* Tabs */}
                        <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-slate-200 pt-4">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <div key={j} className="skeleton h-4 w-14 rounded" />
                          ))}
                        </div>
                        {/* Tab content */}
                        <div className="skeleton mt-3 h-14 w-full rounded-xl" />
                      </div>
                      {/* Price + button */}
                      <div className="w-full lg:w-auto lg:min-w-42.5 lg:text-right">
                        <div className="skeleton h-9 w-32 rounded-lg" />
                        <div className="skeleton mt-4 h-10 w-full rounded-xl lg:w-36" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {flightError && !isLoadingFlights && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{flightError}</div>
            )}

            {!isLoadingFlights && !flightError && sortedFlights.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                Tidak ada flight yang cocok untuk rute dan tanggal yang dipilih.
              </div>
            )}

            {sortedFlights.map((flight, idx) => {
              const query = new URLSearchParams({ origin, destination, departureDate, returnDate, adult, child });

              return (
                <LazySection key={flight.id} delay={Math.min(5, (idx % 5) + 1) as 1 | 2 | 3 | 4 | 5}>
                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="inline-flex items-center gap-2">
                          {flight.logo.startsWith("http") ? (
                            <img src={flight.logo} alt={flight.airline} className="h-8 w-8 rounded-full object-contain border border-slate-100 bg-white p-0.5 shadow-sm" />
                          ) : (
                            <span className="text-2xl">{flight.logo}</span>
                          )}
                          <p className="text-xl font-bold text-slate-900">{flight.airline}</p>
                        </div>

                        <div className="grid min-w-60 grid-cols-[auto_1fr_auto] items-center gap-4 text-center text-slate-900">
                          <div>
                            <p className="text-3xl font-black">{flight.departureTime}</p>
                            <p className="text-sm text-slate-600">{extractAirportCode(flight.origin)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">{flight.duration}</p>
                            <div className="mx-auto mt-1 h-0.5 w-16 bg-slate-300" />
                          </div>
                          <div>
                            <p className="text-3xl font-black">{flight.arrivalTime}</p>
                            <p className="text-sm text-slate-600">{extractAirportCode(flight.destination)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-slate-200 pt-4 text-sm font-semibold text-slate-600">
                        {flightTabs.map((tab) => (
                          <button
                            key={`${flight.id}-${tab.key}`}
                            onClick={() => setActiveTabs((prev) => ({ ...prev, [flight.id]: tab.key }))}
                            className={`relative rounded-md px-1 py-0.5 transition ${getActiveTab(flight.id) === tab.key ? "text-blue-700 after:scale-x-100" : "hover:text-blue-700 after:scale-x-0 hover:after:scale-x-100"} after:absolute after:-bottom-0.75 after:left-0 after:h-0.5 after:w-full after:origin-left after:rounded-full after:bg-blue-600 after:transition-transform after:duration-200`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        {renderTabContent(flight.id)}
                      </div>
                    </div>

                    <div className="w-full lg:w-auto lg:min-w-42.5 lg:text-right">
                      <p className="text-3xl font-black text-orange-600">{formatRupiah(flight.price)}<span className="text-sm font-semibold text-slate-500">/pax</span></p>

                      <Link
                        href={`/search/detail/${flight.id}?${query.toString()}`}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-600 lg:w-auto"
                      >
                        Choose
                      </Link>
                    </div>
                  </div>
                </article>
                </LazySection>
              );
            })}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense>
      <SearchResultsPageContent />
    </Suspense>
  );
}
