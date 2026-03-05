"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, CalendarDays, ChevronLeft, ChevronRight, Plane, PlaneLanding, PlaneTakeoff, Search, Users } from "lucide-react";
import MainNav from "@/components/MainNav";
import { getAirportOptionsFromApi } from "@/lib/airport-api";


const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const holidayMap: Record<string, string> = {
  "2026-01-01": "Tahun Baru",
  "2026-02-17": "Isra Miraj",
  "2026-03-19": "Nyepi",
  "2026-03-20": "Idul Fitri",
  "2026-03-21": "Idul Fitri",
  "2026-04-03": "Wafat Isa Almasih",
  "2026-05-01": "Hari Buruh",
  "2026-05-14": "Kenaikan Isa Almasih",
  "2026-05-28": "Waisak",
  "2026-06-01": "Hari Lahir Pancasila",
  "2026-07-17": "Tahun Baru Islam",
  "2026-08-17": "Kemerdekaan RI",
  "2026-09-24": "Maulid Nabi",
  "2026-12-25": "Natal",
};

type ActivePanel = "none" | "airport" | "date" | "guests";
type AirportMode = "origin" | "destination";
type RecentSearchItem = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adult: number;
  child: number;
  timestamp: number;
};

const RECENT_SEARCHES_KEY = "skyintern_recent_searches";

type AirportOption = {
  code: string;
  city: string;
  country: string;
  airportName: string;
  label: string;
  compactLabel: string;
  secondaryLabel: string;
  searchText: string;
};

const defaultOriginLabel = "Jakarta, Indonesia (CGK)";
const defaultDestinationLabel = "Denpasar, Indonesia (DPS)";

const loadRecentSearches = (): RecentSearchItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!rawValue) return [];
    const parsedValue = JSON.parse(rawValue) as RecentSearchItem[];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

const parseDate = (dateValue: string) => new Date(`${dateValue}T00:00:00`);

const toIsoDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatShortDate = (dateValue: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parseDate(dateValue));

const formatLongDate = (dateValue: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parseDate(dateValue));

const createMonthCells = (monthDate: Date, startDate: Date, endDate: Date) => {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const firstDayOffset = (monthStart.getDay() + 6) % 7;
  const cells: Array<{
    key: string;
    day: number | null;
    isoDate: string | null;
    inCurrentMonth: boolean;
    isSelected: boolean;
    isInRange: boolean;
    isWeekend: boolean;
    holidayName: string | null;
  }> = [];

  for (let i = 0; i < firstDayOffset; i += 1) {
    cells.push({
      key: `blank-start-${monthDate.getMonth()}-${i}`,
      day: null,
      isoDate: null,
      inCurrentMonth: false,
      isSelected: false,
      isInRange: false,
      isWeekend: false,
      holidayName: null,
    });
  }

  for (let day = 1; day <= monthEnd.getDate(); day += 1) {
    const currentDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
    const isoDate = toIsoDate(currentDate);
    const dayOfWeek = (currentDate.getDay() + 6) % 7;
    const isSelected =
      currentDate.getTime() === startDate.getTime() || currentDate.getTime() === endDate.getTime();

    cells.push({
      key: `day-${monthDate.getMonth()}-${day}`,
      day,
      isoDate,
      inCurrentMonth: true,
      isSelected,
      isInRange: currentDate >= startDate && currentDate <= endDate,
      isWeekend: dayOfWeek >= 5,
      holidayName: holidayMap[isoDate] ?? null,
    });
  }

  while (cells.length < 42) {
    cells.push({
      key: `blank-end-${monthDate.getMonth()}-${cells.length}`,
      day: null,
      isoDate: null,
      inCurrentMonth: false,
      isSelected: false,
      isInRange: false,
      isWeekend: false,
      holidayName: null,
    });
  }

  return cells;
};

export default function SearchPage() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const [origin, setOrigin] = useState(defaultOriginLabel);
  const [destination, setDestination] = useState(defaultDestinationLabel);
  const [departureDate, setDepartureDate] = useState("2026-03-04");
  const [returnDate, setReturnDate] = useState("2026-03-05");
  const [adult, setAdult] = useState(2);
  const [child, setChild] = useState(0);
  const [activePanel, setActivePanel] = useState<ActivePanel>("none");
  const [closingPanel, setClosingPanel] = useState<ActivePanel>("none");
  const [isSelectingReturn, setIsSelectingReturn] = useState(false);
  const [airportMode, setAirportMode] = useState<AirportMode>("origin");
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [airportKeyword, setAirportKeyword] = useState("");
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(loadRecentSearches);
  const [airportMaster, setAirportMaster] = useState<AirportOption[]>([]);
  const [airportLoading, setAirportLoading] = useState(false);
  const [airportLoadError, setAirportLoadError] = useState<string | null>(null);

  const { leftMonth, rightMonth, leftMonthCells, rightMonthCells } = useMemo(() => {
    const checkInDate = parseDate(departureDate);
    const checkOutDate = parseDate(returnDate);
    const rangeEndDate = checkOutDate < checkInDate ? checkInDate : checkOutDate;
    const nextLeftMonth = new Date(checkInDate.getFullYear(), checkInDate.getMonth() + calendarOffset, 1);
    const nextRightMonth = new Date(nextLeftMonth.getFullYear(), nextLeftMonth.getMonth() + 1, 1);

    return {
      leftMonth: nextLeftMonth,
      rightMonth: nextRightMonth,
      leftMonthCells: createMonthCells(nextLeftMonth, checkInDate, rangeEndDate),
      rightMonthCells: createMonthCells(nextRightMonth, checkInDate, rangeEndDate),
    };
  }, [calendarOffset, departureDate, returnDate]);

  const airportByLabel = useMemo(
    () => new Map(airportMaster.map((item) => [item.label, item])),
    [airportMaster],
  );

  const popularAirportOptions = useMemo(() => {
    const uniqueByCode = new Map<string, AirportOption>();
    airportMaster.forEach((item) => {
      if (!uniqueByCode.has(item.code)) {
        uniqueByCode.set(item.code, item);
      }
    });

    return Array.from(uniqueByCode.values()).slice(0, 12);
  }, [airportMaster]);

  const airportOptions = useMemo(() => {
    const keyword = airportKeyword.trim().toLowerCase();
    if (!keyword) return popularAirportOptions;

    return airportMaster
      .filter((item) => item.searchText.includes(keyword))
      .slice(0, 150);
  }, [airportKeyword, airportMaster, popularAirportOptions]);

  const recentAirportOptions = useMemo(() => {
    const options = recentSearches
      .map((item) => (airportMode === "origin" ? item.origin : item.destination))
      .map((label) => airportByLabel.get(label))
      .filter((item): item is AirportOption => Boolean(item));
    const uniqueOptions = Array.from(new Set(options));
    const keyword = airportKeyword.trim().toLowerCase();
    if (!keyword) return uniqueOptions;
    return uniqueOptions.filter((item) => item.searchText.includes(keyword));
  }, [airportByLabel, airportKeyword, airportMode, recentSearches]);

  const originView = airportByLabel.get(origin);
  const destinationView = airportByLabel.get(destination);

  useEffect(() => {
    let isMounted = true;

    const loadAirportOptions = async () => {
      try {
        setAirportLoading(true);
        setAirportLoadError(null);
        const airports = await getAirportOptionsFromApi();
        if (!isMounted) return;

        const mapped = airports
          .map((item) => {
            const code = (item.code ?? "").trim().toUpperCase();
            const city = (item.city ?? "").trim();
            const country = (item.country ?? "").trim();
            const airportName = (item.airportName ?? "").trim();
            const label = (item.label ?? `${city}, ${country} (${code})`).trim();

            if (!code || !city || !country || !airportName || !label) {
              return null;
            }

            return {
              code,
              city,
              country,
              airportName,
              label,
              compactLabel: `${city} (${code})`,
              secondaryLabel: `${airportName} • ${city}, ${country}`,
              searchText: `${city} ${country} ${airportName} ${code}`.toLowerCase(),
            };
          })
          .filter((item): item is AirportOption => Boolean(item))
          .sort((first, second) => first.city.localeCompare(second.city));

        if (mapped.length === 0) {
          setAirportMaster([]);
          setAirportLoadError("Data bandara dari API kosong atau tidak valid.");
          return;
        }

        // Deduplikasi berdasarkan label agar key di React map selalu unik.
        // API kadang mengembalikan beberapa record dengan kota/kode yang sama.
        const seenLabels = new Map<string, AirportOption>();
        for (const airport of mapped) {
          if (!seenLabels.has(airport.label)) {
            seenLabels.set(airport.label, airport);
          }
        }
        const dedupedMapped = Array.from(seenLabels.values());

        setAirportMaster(dedupedMapped);

        const nextOrigin = dedupedMapped[0]?.label;
        const nextDestination = mapped.find((item) => item.label !== nextOrigin)?.label ?? mapped[0]?.label;

        if (nextOrigin) setOrigin(nextOrigin);
        if (nextDestination) setDestination(nextDestination);
      } catch {
        if (!isMounted) return;
        setAirportMaster([]);
        setAirportLoadError("Gagal mengambil data bandara dari API. Pastikan backend berjalan di port 3000.");
      } finally {
        if (isMounted) {
          setAirportLoading(false);
        }
      }
    };

    void loadAirportOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveRecentSearches = (items: RecentSearchItem[]) => {
    setRecentSearches(items);
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items));
  };

  const addRecentSearch = (item: RecentSearchItem) => {
    const deduped = recentSearches.filter(
      (entry) =>
        !(
          entry.origin === item.origin &&
          entry.destination === item.destination &&
          entry.departureDate === item.departureDate &&
          entry.returnDate === item.returnDate
        ),
    );
    saveRecentSearches([item, ...deduped].slice(0, 8));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    window.localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const applyRecentSearch = (item: RecentSearchItem) => {
    setOrigin(item.origin);
    setDestination(item.destination);
    setDepartureDate(item.departureDate);
    setReturnDate(item.returnDate);
    setAdult(item.adult);
    setChild(item.child);
    setActivePanel("none");
  };

  const handleSearch = () => {
    addRecentSearch({
      origin,
      destination,
      departureDate,
      returnDate,
      adult,
      child,
      timestamp: Date.now(),
    });

    const query = new URLSearchParams({
      origin,
      destination,
      departureDate,
      returnDate,
      adult: String(adult),
      child: String(child),
    });
    router.push(`/search/results?${query.toString()}`);
  };

  const handleDaySelect = (isoDate: string) => {
    if (!isSelectingReturn || isoDate <= departureDate) {
      setDepartureDate(isoDate);
      if (isoDate > returnDate) {
        setReturnDate(isoDate);
      }
      setIsSelectingReturn(true);
      return;
    }

    setReturnDate(isoDate);
    setIsSelectingReturn(false);
    setActivePanel("none");
  };

  const openAirportPanel = (mode: AirportMode) => {
    setAirportMode(mode);
    setAirportKeyword("");
    setClosingPanel("none");
    setActivePanel("airport");
  };

  const chooseAirport = (value: string) => {
    if (airportMode === "origin") {
      setOrigin(value);
    } else {
      setDestination(value);
    }
    triggerClosePanel();
  };

  const swapAirports = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const triggerClosePanel = useCallback(() => {
    if (activePanel === "none") return;

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }

    setClosingPanel(activePanel);
    closeTimerRef.current = window.setTimeout(() => {
      setActivePanel("none");
      setClosingPanel("none");
      closeTimerRef.current = null;
    }, 170);
  }, [activePanel]);

  const openPanel = (panel: ActivePanel) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setClosingPanel("none");
    setActivePanel(panel);
  };

  const slideToPreviousMonth = useCallback(() => {
    setCalendarOffset((prev) => prev - 1);
  }, []);

  const slideToNextMonth = useCallback(() => {
    setCalendarOffset((prev) => prev + 1);
  }, []);

  const handleCalendarTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    touchStartXRef.current = firstTouch.clientX;
    touchStartYRef.current = firstTouch.clientY;
  };

  const handleCalendarTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const firstTouch = event.changedTouches[0];
    if (!firstTouch || touchStartXRef.current === null || touchStartYRef.current === null) return;

    const deltaX = firstTouch.clientX - touchStartXRef.current;
    const deltaY = firstTouch.clientY - touchStartYRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    if (deltaX < 0) {
      slideToNextMonth();
      return;
    }

    slideToPreviousMonth();
  };

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        triggerClosePanel();
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, [triggerClosePanel]);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "linear-gradient(160deg, rgba(6,24,44,0.58) 0%, rgba(12,45,84,0.42) 45%, rgba(8,20,36,0.62) 100%), url('/bg.jpg'), url('/home-hero.svg')",
      }}
    >
      <MainNav />
      <main className="mx-auto w-full max-w-7xl overflow-x-clip px-4 pb-10 pt-6 md:px-6 md:pt-8">
        <section
          className="relative overflow-visible rounded-[28px] bg-[linear-gradient(160deg,rgba(14,53,106,0.78)_0%,rgba(26,81,143,0.52)_45%,rgba(16,43,87,0.8)_100%)] px-4 py-8 text-white shadow-xl md:px-8 md:py-10"
        >
          <div className="pointer-events-none absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_10%,white,transparent_35%),radial-gradient(circle_at_80%_20%,white,transparent_30%)]" />

          <div ref={wrapperRef} className="relative mx-auto max-w-6xl">
            <div className="grid gap-2 text-sm font-bold text-blue-100 md:grid-cols-[1.1fr_1.1fr_1fr_auto]">
              <p className="pl-1">Keberangkatan & Tujuan</p>
              <p className="pl-1">Check-in & Check-out Dates</p>
              <p className="pl-1">Guests</p>
              <p className="hidden md:block" />
            </div>

            <div className="mt-2 overflow-hidden rounded-3xl border border-white/25 bg-white shadow-lg">
              <div className="grid md:grid-cols-[1.1fr_1.1fr_1fr_auto]">
                <div className="relative border-b border-slate-200 px-3 py-2 md:border-b-0 md:border-r">
                  <div className="grid grid-cols-2 overflow-hidden rounded-full border border-slate-300 bg-white">
                    <button
                      onClick={() => openAirportPanel("origin")}
                      className="inline-flex min-h-14 items-center gap-2 border-r border-slate-200 px-4 text-left text-slate-900 transition hover:bg-blue-50"
                    >
                      <PlaneTakeoff className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-semibold sm:text-base lg:text-lg">{originView ? `${originView.city}, ${originView.country} (${originView.code})` : origin}</span>
                    </button>
                    <button
                      onClick={() => openAirportPanel("destination")}
                      className="inline-flex min-h-14 items-center gap-2 px-6 text-left text-slate-900 transition hover:bg-blue-50"
                    >
                      <PlaneLanding className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-semibold sm:text-base lg:text-lg">{destinationView ? `${destinationView.city}, ${destinationView.country} (${destinationView.code})` : destination}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={swapAirports}
                    className="absolute left-1/2 top-1/2 inline-flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white text-blue-600 shadow-sm transition hover:bg-blue-50"
                  >
                    <ArrowUpDown className="h-5 w-5" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsSelectingReturn(false);
                    openPanel("date");
                    setCalendarOffset(0);
                  }}
                  className="inline-flex w-full items-center gap-2 border-b border-slate-200 px-4 py-3 text-left text-slate-900 transition hover:bg-blue-50 md:border-b-0 md:border-r"
                >
                  <CalendarDays className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-semibold sm:text-base lg:text-lg">
                    {formatShortDate(departureDate)} - {formatShortDate(returnDate)}
                  </span>
                </button>

                <button
                  onClick={() => openPanel("guests")}
                  className="inline-flex w-full items-center gap-2 border-b border-slate-200 px-4 py-3 text-left text-slate-900 transition hover:bg-blue-50 md:border-b-0 md:border-r"
                >
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-semibold sm:text-base lg:text-lg">
                    {adult} Adult(s), {child} Child
                  </span>
                </button>

                <button
                  onClick={handleSearch}
                  className="inline-flex items-center justify-center bg-orange-500 px-5 py-4 text-xl font-bold text-white transition hover:bg-orange-600"
                >
                  <Search className="h-6 w-6" />
                </button>
              </div>
            </div>

            {activePanel === "airport" && (
              <section className={`${closingPanel === "airport" ? "popup-panel-close-animate" : "popup-panel-animate"} mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-2xl sm:p-4`}>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setAirportMode("origin");
                      setAirportKeyword(origin);
                    }}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                      airportMode === "origin"
                        ? "bg-blue-600 text-white"
                        : "border border-blue-200 bg-white text-blue-700"
                    }`}
                  >
                    Keberangkatan
                  </button>
                  <button
                    onClick={() => {
                      setAirportMode("destination");
                      setAirportKeyword(destination);
                    }}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                      airportMode === "destination"
                        ? "bg-blue-600 text-white"
                        : "border border-blue-200 bg-white text-blue-700"
                    }`}
                  >
                    Tujuan
                  </button>
                </div>

                <div className="mt-3 rounded-xl border border-blue-100 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-500">Cari bandara / kota</p>
                  <input
                    value={airportKeyword}
                    onChange={(event) => setAirportKeyword(event.target.value)}
                    placeholder="Contoh: CGK, Jakarta, Bali"
                    className="mt-1 w-full text-sm font-semibold outline-none"
                  />
                </div>

                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {airportLoadError && (
                    <div className="border-b border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                      {airportLoadError}
                    </div>
                  )}
                  <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                    <p className="text-sm font-bold text-slate-600">
                      {airportKeyword.trim() ? "Autocomplete Suggestion Panel" : "Popular Cities or Airports (API)"}
                    </p>
                    <div className="flex items-center gap-3">
                      {airportLoading && <span className="text-xs font-semibold text-blue-700">Memuat dari API...</span>}
                      {recentSearches.length > 0 && (
                        <button onClick={clearRecentSearches} className="text-xs font-semibold text-red-500 hover:text-red-600">
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto">
                    {recentAirportOptions.length > 0 && (
                      <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold text-blue-700">
                        Recent Searches
                      </div>
                    )}
                    {recentAirportOptions.map((item) => (
                      <button
                        key={`recent-${airportMode}-${item.label}`}
                        onClick={() => chooseAirport(item.label)}
                        className="grid w-full grid-cols-[20px_1fr_auto] items-center gap-2 border-b border-slate-100 px-3 py-3 text-left hover:bg-blue-50 sm:grid-cols-[24px_1fr_auto] sm:gap-3"
                      >
                        <Plane className="h-5 w-5 text-slate-700" />
                        <span>
                          <span className="block text-base font-bold text-slate-900">{item.airportName}</span>
                          <span className="block text-sm text-slate-600">{item.city}, {item.country}</span>
                        </span>
                        <span className="text-lg font-bold text-slate-500 sm:text-2xl">{item.code}</span>
                      </button>
                    ))}

                    {airportLoading && airportOptions.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-slate-500">Sedang mengambil data bandara dari API...</p>
                    ) : airportOptions.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-slate-500">Bandara tidak ditemukan.</p>
                    ) : (
                      airportOptions.map((item) => (
                        <button
                          key={`${airportMode}-${item.label}`}
                          onClick={() => chooseAirport(item.label)}
                          className="grid w-full grid-cols-[20px_1fr_auto] items-center gap-2 border-b border-slate-100 px-3 py-3 text-left hover:bg-blue-50 last:border-b-0 sm:grid-cols-[24px_1fr_auto] sm:gap-3"
                        >
                          <Plane className="h-5 w-5 text-slate-700" />
                          <span>
                            <span className="block text-base font-bold text-slate-900">{item.airportName}</span>
                            <span className="block text-sm text-slate-600">{item.city}, {item.country}</span>
                          </span>
                          <span className="text-lg font-bold text-slate-500 sm:text-2xl">{item.code}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {recentSearches.length > 0 && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                      <p className="text-xs font-semibold text-slate-600">Search History Dropdown</p>
                    </div>
                    <div className="max-h-28 overflow-y-auto">
                      {recentSearches.map((item) => (
                        <button
                          key={`${item.timestamp}-${item.origin}-${item.destination}`}
                          onClick={() => applyRecentSearch(item)}
                          className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left text-xs hover:bg-blue-50 last:border-b-0"
                        >
                          <span className="font-semibold">{item.origin} → {item.destination}</span>
                          <span className="text-slate-500">{formatShortDate(item.departureDate)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {activePanel === "guests" && (
              <section className={`${closingPanel === "guests" ? "popup-panel-close-animate" : "popup-panel-animate"} mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl`}>
                <h2 className="text-lg font-black">Guests</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-slate-700">
                    Adult
                    <input
                      type="number"
                      min={1}
                      value={adult}
                      onChange={(event) => setAdult(Math.max(1, Number(event.target.value) || 1))}
                      className="mt-1 w-full rounded-lg border border-blue-100 bg-white px-2 py-1"
                    />
                  </label>
                  <label className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-slate-700">
                    Child
                    <input
                      type="number"
                      min={0}
                      value={child}
                      onChange={(event) => setChild(Math.max(0, Number(event.target.value) || 0))}
                      className="mt-1 w-full rounded-lg border border-blue-100 bg-white px-2 py-1"
                    />
                  </label>
                </div>
                <button
                  onClick={triggerClosePanel}
                  className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Gunakan Pilihan Ini
                </button>
              </section>
            )}

            {activePanel === "date" && (
              <section className={`${closingPanel === "date" ? "popup-panel-close-animate" : "popup-panel-animate"} mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-2xl sm:p-4`}>
                <h2 className="text-2xl font-black">Stay Date</h2>

                <div className="mt-3 grid gap-4 border-b border-slate-200 pb-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-500">Check-In</p>
                    <p className="text-xl font-black">{formatLongDate(departureDate)}</p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-sm text-slate-500">Check-Out</p>
                    <p className="text-xl font-black">{formatLongDate(returnDate)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                    <span className="h-2 w-2 rounded-full bg-blue-600" /> Range terpilih
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-red-600">
                    <span className="h-2 w-2 rounded-full bg-red-500" /> Hari libur / weekend
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Hari kerja
                  </span>
                </div>

                <>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-500 sm:text-sm">Geser kiri/kanan untuk pindah bulan</p>
                      <div className="flex items-center gap-2">
                      <button
                        onClick={slideToPreviousMonth}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-100"
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={slideToNextMonth}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-100"
                        aria-label="Next month"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      </div>
                    </div>

                    <div
                      onTouchStart={handleCalendarTouchStart}
                      onTouchEnd={handleCalendarTouchEnd}
                      className="mt-3 grid select-none gap-4 touch-pan-y xl:grid-cols-2"
                    >
                    {[
                      { month: leftMonth, cells: leftMonthCells },
                      { month: rightMonth, cells: rightMonthCells },
                    ].map((calendar) => (
                      <div key={`${calendar.month.getFullYear()}-${calendar.month.getMonth()}`} className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-2xl font-black">
                          {new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(calendar.month)}
                        </p>

                        <div className="mt-3 grid grid-cols-7 gap-1">
                          {weekDays.map((label) => (
                            <p key={label} className={`text-center text-sm ${label === "Sun" ? "text-red-500" : "text-slate-500"}`}>
                              {label}
                            </p>
                          ))}

                          {calendar.cells.map((cell) => {
                            if (!cell.inCurrentMonth || !cell.isoDate) {
                              return <div key={cell.key} className="h-14" />;
                            }

                            const isHoliday = Boolean(cell.holidayName) || cell.isWeekend;

                            return (
                              <button
                                key={cell.key}
                                onClick={() => handleDaySelect(cell.isoDate!)}
                                title={cell.holidayName ?? (isHoliday ? "Weekend" : "Hari kerja")}
                                className={`relative flex h-14 flex-col items-center justify-start rounded-lg border px-1 pt-1 text-sm font-semibold transition ${
                                  cell.isSelected
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : cell.isInRange
                                      ? "border-blue-100 bg-blue-100 text-blue-700"
                                      : "border-transparent hover:bg-slate-100"
                                }`}
                              >
                                <span>{cell.day}</span>
                                <span
                                  className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                                    isHoliday ? "bg-red-500" : "bg-emerald-500"
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    </div>
                </>

                <button
                  onClick={triggerClosePanel}
                  className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Selesai Pilih Tanggal
                </button>

                {/* NOTE: Legend membantu user membaca warna kalender seperti pada referensi UI. */}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Holiday / Weekend</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Weekday</span>
                </div>
              </section>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
