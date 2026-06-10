"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CompactPagination from "@/components/CompactPagination";
import MainNav from "@/components/MainNav";
import { formatRupiah } from "@/lib/currency";
import { type FlightCardItem, searchFlightsFromApi } from "@/lib/flight-api";

type FlightInfoTab = "details" | "promos";
type SortOption = "price-low" | "price-high" | "duration" | "departure";
const PROMOS_PER_PAGE = 3;

const flightTabs: Array<{ key: FlightInfoTab; label: string }> = [
  { key: "details", label: "Flight Details    " },
  { key: "promos", label: "Promos" },
];

const extractAirportCode = (value: string) => {
  const match = value.match(/\(([A-Z]{3})\)$/);
  if (match) return match[1];
  return value.split(" - ")[0].trim();
};

const parseSortOption = (value: string | null): SortOption => {
  if (value === "price-high" || value === "duration" || value === "departure") {
    return value;
  }
  return "price-low";
};

const parsePageNumber = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
};

const parseItemsPerPage = (value: string | null) => {
  const parsed = Number(value);
  if (parsed === 5 || parsed === 10 || parsed === 20 || parsed === 50) return parsed;
  return 5;
};

function SearchResultsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<SortOption>(() => parseSortOption(searchParams.get("sort")));
  const [activeTabs, setActiveTabs] = useState<Record<string, FlightInfoTab>>({});
  const [selectedPromoByFlight, setSelectedPromoByFlight] = useState<Record<string, number | null>>({});
  const [promoPageByFlight, setPromoPageByFlight] = useState<Record<string, number>>({});
  const [sortedFlights, setSortedFlights] = useState<FlightCardItem[]>([]);
  const [totalFlights, setTotalFlights] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingFlights, setIsLoadingFlights] = useState(true);
  const [flightError, setFlightError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(() => parsePageNumber(searchParams.get("page"), 1));
  const [itemsPerPage, setItemsPerPage] = useState(() => parseItemsPerPage(searchParams.get("limit")));

  const origin = searchParams.get("origin") ?? "CGK - Jakarta";
  const destination = searchParams.get("destination") ?? "DPS - Denpasar";
  const departureDate = searchParams.get("departureDate") ?? "2026-03-15";
  const returnDate = searchParams.get("returnDate") ?? "";
  const adult = searchParams.get("adult") ?? "1";
  const child = searchParams.get("child") ?? "0";
  const infant = searchParams.get("infant") ?? "0";

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
          page: currentPage,
          limit: itemsPerPage,
        });
        if (!isMounted) return;
        setSortedFlights(data.flights);
        setTotalFlights(data.pagination.totalItems);
        setTotalPages(data.pagination.totalPages);
        if (data.pagination.page !== currentPage) {
          setCurrentPage(data.pagination.page);
        }
      } catch (error) {
        if (!isMounted) return;
        setSortedFlights([]);
        setTotalFlights(0);
        setTotalPages(1);
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
  }, [adult, child, departureDate, destination, origin, sortBy, currentPage, itemsPerPage]);

  useEffect(() => {
    setSelectedPromoByFlight((prev) => {
      const next = { ...prev };
      for (const flight of sortedFlights) {
        if (!flight.promos?.length) {
          delete next[flight.id];
          continue;
        }

        const current = next[flight.id];
        if (current == null) {
          continue;
        }

        if (flight.promos.some((promo) => promo.id === current)) {
          continue;
        }

        next[flight.id] = null;
      }
      return next;
    });

    setPromoPageByFlight((prev) => {
      const next = { ...prev };
      for (const flight of sortedFlights) {
        const promoCount = flight.promos?.length ?? 0;
        if (promoCount === 0) {
          delete next[flight.id];
          continue;
        }
        const totalPages = Math.max(1, Math.ceil(promoCount / PROMOS_PER_PAGE));
        const currentPage = next[flight.id] ?? 1;
        next[flight.id] = Math.min(Math.max(1, currentPage), totalPages);
      }
      return next;
    });
  }, [sortedFlights]);

  useEffect(() => {
    const querySort = parseSortOption(searchParams.get("sort"));
    const queryPage = parsePageNumber(searchParams.get("page"), 1);
    const queryLimit = parseItemsPerPage(searchParams.get("limit"));

    setSortBy((prev) => (prev === querySort ? prev : querySort));
    setItemsPerPage((prev) => (prev === queryLimit ? prev : queryLimit));
    setCurrentPage((prev) => (prev === queryPage ? prev : queryPage));
  }, [searchParams]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("sort", sortBy);
    nextParams.set("page", String(currentPage));
    nextParams.set("limit", String(itemsPerPage));

    const nextQuery = nextParams.toString();
    if (nextQuery === searchParams.toString()) return;
    router.replace(`${pathname}?${nextQuery}`, { scroll: false });
  }, [currentPage, itemsPerPage, pathname, router, searchParams, sortBy]);

  const paginationItems = useMemo(() => {
    const items: Array<number | "ellipsis"> = [];

    if (totalPages <= 8) {
      for (let page = 1; page <= totalPages; page += 1) items.push(page);
      return items;
    }

    items.push(1);

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) items.push("ellipsis");
    for (let page = start; page <= end; page += 1) items.push(page);
    if (end < totalPages - 1) items.push("ellipsis");

    items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);

  const handleSortChange = (nextSort: SortOption) => {
    setSortBy(nextSort);
    setCurrentPage(1);
  };

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

    const promoCount = flight.promos?.length ?? 0;
    if (promoCount === 0) {
      return <p className="text-sm text-slate-600">Saat ini belum ada promo aktif untuk flight ini.</p>;
    }

    const sortedPromos = [...flight.promos].sort((a, b) => b.discount - a.discount);
    const totalPromoPages = Math.max(1, Math.ceil(sortedPromos.length / PROMOS_PER_PAGE));
    const currentPromoPage = Math.min(Math.max(1, promoPageByFlight[flight.id] ?? 1), totalPromoPages);
    const pageStart = (currentPromoPage - 1) * PROMOS_PER_PAGE;
    const visiblePromos = sortedPromos.slice(pageStart, pageStart + PROMOS_PER_PAGE);
    const showPromoPagination = sortedPromos.length > PROMOS_PER_PAGE;

    return (
      <div className="space-y-2">
        <div className="rounded-xl border border-emerald-200 bg-linear-to-b from-emerald-50 to-white p-2.5">
          <p className="text-xs font-semibold tracking-wide text-emerald-800">PILIH 1 PROMO UNTUK CHECKOUT</p>
          <div className="mt-2 space-y-2">
            <label
              className={`group block cursor-pointer rounded-lg border px-3 py-2 text-sm transition ${
                selectedPromoByFlight[flight.id] == null
                  ? "border-emerald-400 bg-emerald-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 text-slate-700">
                  <input
                    type="radio"
                    name={`selected-promo-${flight.id}`}
                    checked={selectedPromoByFlight[flight.id] == null}
                    onChange={() => setSelectedPromoByFlight((prev) => ({ ...prev, [flight.id]: null }))}
                    className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-medium">Tanpa Promo (Harga Normal)</span>
                </span>
              </div>
              {selectedPromoByFlight[flight.id] == null && (
                <p className="mt-1 pl-6.5 text-xs font-semibold text-emerald-700">Promo tidak digunakan</p>
              )}
            </label>

            {visiblePromos.map((promo) => (
                <label
                  key={promo.id}
                  className={`group block cursor-pointer rounded-lg border px-3 py-2 text-sm transition ${
                    selectedPromoByFlight[flight.id] === promo.id
                      ? "border-emerald-400 bg-emerald-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5 text-slate-700">
                    <input
                      type="radio"
                      name={`selected-promo-${flight.id}`}
                      checked={selectedPromoByFlight[flight.id] === promo.id}
                      onChange={() => setSelectedPromoByFlight((prev) => ({ ...prev, [flight.id]: promo.id }))}
                      className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium">{promo.title}</span>
                  </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      {promo.discount}%
                    </span>
                  </div>
                  {promo.description && (
                    <p className="mt-1 pl-6.5 text-xs text-slate-500">{promo.description}</p>
                  )}
                  {selectedPromoByFlight[flight.id] === promo.id && (
                    <p className="mt-1 pl-6.5 text-xs font-semibold text-emerald-700">Promo terpilih</p>
                  )}
                </label>
              ))}

            {showPromoPagination && (
              <CompactPagination
                currentPage={currentPromoPage}
                totalPages={totalPromoPages}
                onPageChange={(page) => setPromoPageByFlight((prev) => ({ ...prev, [flight.id]: page }))}
                tone="emerald"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-7xl px-3 py-8 page-enter sm:px-6 sm:py-10">
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Hasil Pencarian Penerbangan</h1>
        <p className="mt-1 text-xs text-slate-600 sm:text-sm">
          {origin} → {destination} • {departureDate}
          {returnDate ? ` - ${returnDate}` : " (Sekali jalan)"} • {adult} Adult / {child} Child / {infant} Infant
        </p>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="h-fit self-start rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:rounded-[30px] sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Filter Section</h2>
            <div className="mt-5 space-y-2.5 text-sm">
              <button onClick={() => handleSortChange("price-low")} className={`w-full rounded-xl border px-4 py-2.5 text-left font-semibold transition ${sortBy === "price-low" ? "border-blue-600 bg-blue-600 text-white" : "border-blue-100 bg-slate-200 text-slate-700 hover:bg-slate-300"}`}>Price Low to High</button>
              <button onClick={() => handleSortChange("price-high")} className={`w-full rounded-xl border px-4 py-2.5 text-left font-semibold transition ${sortBy === "price-high" ? "border-blue-600 bg-blue-600 text-white" : "border-blue-100 bg-slate-200 text-slate-700 hover:bg-slate-300"}`}>Price High to Low</button>
              <button onClick={() => handleSortChange("duration")} className={`w-full rounded-xl border px-4 py-2.5 text-left font-semibold transition ${sortBy === "duration" ? "border-blue-600 bg-blue-600 text-white" : "border-blue-100 bg-slate-200 text-slate-700 hover:bg-slate-300"}`}>Duration</button>
              <button onClick={() => handleSortChange("departure")} className={`w-full rounded-xl border px-4 py-2.5 text-left font-semibold transition ${sortBy === "departure" ? "border-blue-600 bg-blue-600 text-white" : "border-blue-100 bg-slate-200 text-slate-700 hover:bg-slate-300"}`}>Departure Time</button>
            </div>
          </aside>

          <section className="space-y-4">
            {!isLoadingFlights && !flightError && totalFlights > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 sm:px-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                    >
                      &lt; Back
                    </button>

                    {paginationItems.map((item, index) => {
                      if (item === "ellipsis") {
                        return (
                          <span key={`ellipsis-${index}`} className="inline-flex h-8 items-center px-1.5 text-sm text-slate-500">
                            ...
                          </span>
                        );
                      }

                      return (
                        <button
                          key={item}
                          onClick={() => setCurrentPage(item)}
                          className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm font-medium transition ${
                            currentPage === item
                                ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                    >
                      Next &gt;
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 sm:text-sm">
                    {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalFlights)} of {totalFlights.toLocaleString("en-US")}
                  </p>

                  <div className="flex w-full items-center gap-2 text-xs text-slate-700 sm:ml-auto sm:w-auto sm:text-sm">
                    <label htmlFor="items-per-page" className="font-medium">Result per page</label>
                    <select
                      id="items-per-page"
                      value={itemsPerPage}
                      onChange={(event) => {
                        setItemsPerPage(Number(event.target.value));
                        setCurrentPage(1);
                      }}
                      className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-sm outline-none transition focus:border-slate-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {isLoadingFlights && (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        {/* Airline name + time grid */}
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="skeleton h-6 w-36 rounded-lg" />
                          <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 text-center sm:min-w-60 sm:gap-4">
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
              const queryData: Record<string, string> = { origin, destination, departureDate, adult, child, infant };
              if (returnDate) {
                queryData.returnDate = returnDate;
              }
              const selectedPromoId = selectedPromoByFlight[flight.id];
              const selectedPromo = flight.promos.find((promo) => promo.id === selectedPromoId) ?? null;
              if (selectedPromoId != null) {
                queryData.promoId = String(selectedPromoId);
              }
              const query = new URLSearchParams(queryData);

              return (
                <article
                  key={`${sortBy}-${flight.id}`}
                  className="card-enter rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 sm:p-4"
                  style={{ animationDelay: `${Math.min(idx, 5) * 55}ms` }}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="inline-flex items-center gap-2">
                          {flight.logo.startsWith("http") ? (
                            <Image
                              src={flight.logo}
                              alt={flight.airline}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full object-contain border border-slate-100 bg-white p-0.5 shadow-sm"
                              unoptimized
                            />
                          ) : (
                            <span className="text-2xl">{flight.logo}</span>
                          )}
                          <p className="text-xl font-bold text-slate-900">{flight.airline}</p>
                        </div>

                        <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 text-center text-slate-900 sm:min-w-60 sm:gap-4">
                          <div>
                            <p className="text-2xl font-black sm:text-3xl">{flight.departureTime}</p>
                            <p className="text-xs text-slate-600 sm:text-sm">{extractAirportCode(flight.origin)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 sm:text-sm">{flight.duration}</p>
                            <div className="mx-auto mt-1 h-0.5 w-16 bg-slate-300" />
                          </div>
                          <div>
                            <p className="text-2xl font-black sm:text-3xl">{flight.arrivalTime}</p>
                            <p className="text-xs text-slate-600 sm:text-sm">{extractAirportCode(flight.destination)}</p>
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
                      {flight.promos.length > 0 && selectedPromo && (
                        <div className="mb-2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          Promo dipilih {selectedPromo.discount}%
                        </div>
                      )}
                      {flight.promos.length > 0 && !selectedPromo && (
                        <div className="mb-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          Tanpa promo
                        </div>
                      )}
                      <p className="text-2xl font-black text-orange-600 sm:text-3xl">{formatRupiah(flight.price)}<span className="text-sm font-semibold text-slate-500">/pax</span></p>

                      <Link
                        href={`/search/detail/${flight.id}?${query.toString()}`}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 lg:w-auto"
                      >
                        Choose
                      </Link>
                    </div>
                  </div>
                </article>
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
