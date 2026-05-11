"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Search,
  Users,
} from "lucide-react";
import MainNav from "@/components/MainNav";
import LazySection from "@/components/LazySection";
import HomePromoSection from "@/components/HomePromoSection";
import ChatBot from "@/components/ChatBot";
import { getAirportOptionsFromApi } from "@/lib/airport-api";
import { getFlightPriceByDateFromApi } from "@/lib/flight-api";

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
  returnDate?: string;
  isRoundTrip?: boolean;
  adult: number;
  child: number;
  infant?: number;
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

const getTomorrowIsoDate = (baseIsoDate: string) => {
  const baseDate = parseDate(baseIsoDate);
  baseDate.setDate(baseDate.getDate() + 1);
  return toIsoDate(baseDate);
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

const formatCompactTicketPrice = (value: number) => {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const display =
      millions >= 10
        ? `${Math.round(millions)}`
        : millions.toFixed(1).replace(".", ",");
    return `${display}jt`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}rb`;
  }

  return `${value}`;
};

const createMonthCells = (monthDate: Date, startDate: Date, endDate: Date) => {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
  );
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
    const currentDate = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      day,
    );
    const isoDate = toIsoDate(currentDate);
    const dayOfWeek = (currentDate.getDay() + 6) % 7;
    const isSelected =
      currentDate.getTime() === startDate.getTime() ||
      currentDate.getTime() === endDate.getTime();

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
  const [departureDate, setDepartureDate] = useState(() =>
    toIsoDate(new Date()),
  );
  const [returnDate, setReturnDate] = useState(() =>
    getTomorrowIsoDate(toIsoDate(new Date())),
  );
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [adult, setAdult] = useState(2);
  const [child, setChild] = useState(0);
  const [infant, setInfant] = useState(0);
  const [activePanel, setActivePanel] = useState<ActivePanel>("none");
  const [closingPanel, setClosingPanel] = useState<ActivePanel>("none");
  const [isSelectingReturn, setIsSelectingReturn] = useState(false);
  const [airportMode, setAirportMode] = useState<AirportMode>("origin");
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [airportKeyword, setAirportKeyword] = useState("");
  const [recentSearches, setRecentSearches] =
    useState<RecentSearchItem[]>(loadRecentSearches);
  const [airportMaster, setAirportMaster] = useState<AirportOption[]>([]);
  const [airportLoading, setAirportLoading] = useState(false);
  const [airportLoadError, setAirportLoadError] = useState<string | null>(null);
  const [calendarPriceByDate, setCalendarPriceByDate] = useState<
    Record<string, number>
  >({});
  const [calendarPriceLoading, setCalendarPriceLoading] = useState(false);
  const trimmedAirportKeyword = airportKeyword.trim();
  const isAirportSearchInvalid =
    trimmedAirportKeyword.length > 0 && trimmedAirportKeyword.length < 3;

  const { leftMonth, rightMonth, leftMonthCells, rightMonthCells } =
    useMemo(() => {
      const checkInDate = parseDate(departureDate);
      const checkOutDate = isRoundTrip
        ? parseDate(returnDate)
        : parseDate(departureDate);
      const rangeEndDate =
        checkOutDate < checkInDate ? checkInDate : checkOutDate;
      const nextLeftMonth = new Date(
        checkInDate.getFullYear(),
        checkInDate.getMonth() + calendarOffset,
        1,
      );
      const nextRightMonth = new Date(
        nextLeftMonth.getFullYear(),
        nextLeftMonth.getMonth() + 1,
        1,
      );

      return {
        leftMonth: nextLeftMonth,
        rightMonth: nextRightMonth,
        leftMonthCells: createMonthCells(
          nextLeftMonth,
          checkInDate,
          rangeEndDate,
        ),
        rightMonthCells: createMonthCells(
          nextRightMonth,
          checkInDate,
          rangeEndDate,
        ),
      };
    }, [calendarOffset, departureDate, returnDate, isRoundTrip]);

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
    const keyword = trimmedAirportKeyword.toLowerCase();
    if (!keyword) return popularAirportOptions;
    if (isAirportSearchInvalid) return [];

    return airportMaster
      .filter((item) => item.searchText.includes(keyword))
      .slice(0, 150);
  }, [airportMaster, isAirportSearchInvalid, popularAirportOptions, trimmedAirportKeyword]);

  const recentAirportOptions = useMemo(() => {
    const options = recentSearches
      .map((item) =>
        airportMode === "origin" ? item.origin : item.destination,
      )
      .map((label) => airportByLabel.get(label))
      .filter((item): item is AirportOption => Boolean(item));
    const uniqueOptions = Array.from(new Set(options));
    const keyword = trimmedAirportKeyword.toLowerCase();
    if (!keyword) return uniqueOptions;
    if (isAirportSearchInvalid) return [];
    return uniqueOptions.filter((item) => item.searchText.includes(keyword));
  }, [airportByLabel, airportMode, isAirportSearchInvalid, recentSearches, trimmedAirportKeyword]);

  const originView = airportByLabel.get(origin);
  const destinationView = airportByLabel.get(destination);

  const calendarPriceRange = useMemo(() => {
    const rangeStart = toIsoDate(
      new Date(leftMonth.getFullYear(), leftMonth.getMonth(), 1),
    );
    const rangeEnd = toIsoDate(
      new Date(rightMonth.getFullYear(), rightMonth.getMonth() + 1, 0),
    );
    return { rangeStart, rangeEnd };
  }, [leftMonth, rightMonth]);

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
            const label = (
              item.label ?? `${city}, ${country} (${code})`
            ).trim();

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
              searchText:
                `${city} ${country} ${airportName} ${code}`.toLowerCase(),
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
        const nextDestination =
          mapped.find((item) => item.label !== nextOrigin)?.label ??
          mapped[0]?.label;

        if (nextOrigin) setOrigin(nextOrigin);
        if (nextDestination) setDestination(nextDestination);
      } catch {
        if (!isMounted) return;
        setAirportMaster([]);
        setAirportLoadError(
          "Gagal mengambil data bandara dari API. Pastikan backend berjalan di port 3000.",
        );
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
          (entry.returnDate ?? "") === (item.returnDate ?? "") &&
          Boolean(entry.isRoundTrip) === Boolean(item.isRoundTrip)
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
    const shouldUseRoundTrip =
      item.isRoundTrip ?? Boolean(item.returnDate && item.returnDate.trim());
    setIsRoundTrip(shouldUseRoundTrip);
    setReturnDate(
      item.returnDate && item.returnDate.trim()
        ? item.returnDate
        : getTomorrowIsoDate(item.departureDate),
    );
    setAdult(item.adult);
    setChild(item.child);
    setInfant(Math.max(0, Math.min(item.adult, item.infant ?? 0)));
    setActivePanel("none");
  };

  const handleSearch = () => {
    addRecentSearch({
      origin,
      destination,
      departureDate,
      returnDate: isRoundTrip ? returnDate : "",
      isRoundTrip,
      adult,
      child,
      infant,
      timestamp: Date.now(),
    });

    const query = new URLSearchParams({
      origin,
      destination,
      departureDate,
      adult: String(adult),
      child: String(child),
      infant: String(infant),
    });
    if (isRoundTrip) {
      query.set("returnDate", returnDate);
    }
    router.push(`/search/results?${query.toString()}`);
  };

  const seatPassengerCount = adult + child;
  const hasInfantRuleViolation = infant > adult;

  const increaseAdult = () => {
    setAdult((prev) => prev + 1);
  };

  const decreaseAdult = () => {
    setAdult((prev) => {
      const nextAdult = Math.max(1, prev - 1);
      setInfant((currentInfant) => Math.min(currentInfant, nextAdult));
      return nextAdult;
    });
  };

  const increaseChild = () => {
    setChild((prev) => Math.max(0, prev + 1));
  };

  const decreaseChild = () => {
    setChild((prev) => Math.max(0, prev - 1));
  };

  const increaseInfant = () => {
    setInfant((prev) => Math.min(adult, prev + 1));
  };

  const decreaseInfant = () => {
    setInfant((prev) => Math.max(0, prev - 1));
  };

  const handleDaySelect = (isoDate: string) => {
    if (!isRoundTrip) {
      setDepartureDate(isoDate);
      setReturnDate(getTomorrowIsoDate(isoDate));
      setActivePanel("none");
      return;
    }

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

  const toggleRoundTrip = () => {
    setIsRoundTrip((previous) => {
      const next = !previous;
      if (!next) {
        setIsSelectingReturn(false);
      } else if (returnDate <= departureDate) {
        setReturnDate(getTomorrowIsoDate(departureDate));
      }
      return next;
    });
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

  const handleCalendarTouchStart = (
    event: React.TouchEvent<HTMLDivElement>,
  ) => {
    const firstTouch = event.touches[0];
    if (!firstTouch) return;
    touchStartXRef.current = firstTouch.clientX;
    touchStartYRef.current = firstTouch.clientY;
  };

  const handleCalendarTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const firstTouch = event.changedTouches[0];
    if (
      !firstTouch ||
      touchStartXRef.current === null ||
      touchStartYRef.current === null
    )
      return;

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

  useEffect(() => {
    if (activePanel !== "date") return;

    let isMounted = true;

    const loadCalendarPrices = async () => {
      try {
        setCalendarPriceLoading(true);
        const prices = await getFlightPriceByDateFromApi({
          origin,
          destination,
          adult: String(adult),
          child: String(child),
          startDate: calendarPriceRange.rangeStart,
          endDate: calendarPriceRange.rangeEnd,
        });

        if (!isMounted) return;
        setCalendarPriceByDate(prices);
      } catch {
        if (!isMounted) return;
        setCalendarPriceByDate({});
      } finally {
        if (isMounted) {
          setCalendarPriceLoading(false);
        }
      }
    };

    void loadCalendarPrices();

    return () => {
      isMounted = false;
    };
  }, [
    activePanel,
    origin,
    destination,
    adult,
    child,
    calendarPriceRange.rangeStart,
    calendarPriceRange.rangeEnd,
  ]);

  return (
    <>
      <div
        className="relative rounded-4xl text-white shadow-xl bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(160deg, rgba(6,24,44,0.58) 0%, rgba(12,45,84,0.42) 45%, rgba(8,20,36,0.62) 100%), url('/bg.jpg'), url('/home-hero.svg')",
        }}
      >
        <MainNav />
        <main className="mx-auto w-full max-w-screen-2xl overflow-x-clip px-4 pb-8 pt-4 md:px-6 md:pt-6 lg:px-8">
          <LazySection>
            <section className="relative overflow-visible rounded-4xl bg-[linear-gradient(160deg,rgba(14,53,106,0.78)_0%,rgba(26,81,143,0.52)_45%,rgba(16,43,87,0.8)_100%)] px-4 py-5 text-white shadow-xl md:px-8 md:py-7 lg:px-10 lg:py-8">
              <div />

              <div ref={wrapperRef} className="relative mx-auto max-w-7xl">
                {/* Hero headline */}
                <div className="mb-4 text-center page-enter md:mb-5">
                  <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">
                    Terbang ke mana hari ini?
                  </h1>
                  <p className="mt-1.5 text-xs text-blue-200 sm:text-sm md:text-base lg:text-xl">
                    Temukan tiket penerbangan terbaik dengan mudah &amp; cepat.
                  </p>
                </div>
                <div className="grid gap-2 text-sm font-bold text-blue-100 md:grid-cols-[1.1fr_1.1fr_1fr_auto] lg:text-base">
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
                          className="inline-flex min-h-14 min-w-0 items-center gap-2 border-r border-slate-200 px-3 sm:px-4 lg:min-h-16 lg:px-5 text-left text-slate-900 transition hover:bg-blue-50"
                        >
                          <PlaneTakeoff className="h-5 w-5 shrink-0 text-blue-500" />
                          <span className="truncate text-sm font-semibold sm:text-base lg:text-lg">
                            {originView
                              ? `${originView.city}, ${originView.country} (${originView.code})`
                              : origin}
                          </span>
                        </button>
                        <button
                          onClick={() => openAirportPanel("destination")}
                          className="inline-flex min-h-14 min-w-0 items-center gap-2 px-3 sm:px-4 lg:min-h-16 lg:px-5 text-left text-slate-900 transition hover:bg-blue-50"
                        >
                          <PlaneLanding className="h-5 w-5 shrink-0 text-blue-500" />
                          <span className="truncate text-sm font-semibold sm:text-base lg:text-lg">
                            {destinationView
                              ? `${destinationView.city}, ${destinationView.country} (${destinationView.code})`
                              : destination}
                          </span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={swapAirports}
                        className="absolute left-1/2 top-1/2 inline-flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white text-blue-600 shadow-sm transition hover:bg-blue-50 sm:h-12 sm:w-12"
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
                      className="inline-flex w-full items-center gap-2 border-b border-slate-200 px-4 py-3 text-left text-slate-900 transition hover:bg-blue-50 md:border-b-0 md:border-r lg:min-h-16"
                    >
                      <CalendarDays className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-semibold sm:text-base lg:text-lg">
                        {isRoundTrip
                          ? `${formatShortDate(departureDate)} - ${formatShortDate(returnDate)}`
                          : formatShortDate(departureDate)}
                      </span>
                    </button>

                    <button
                      onClick={() => openPanel("guests")}
                      className="inline-flex w-full items-center gap-2 border-b border-slate-200 px-4 py-3 text-left text-slate-900 transition hover:bg-blue-50 md:border-b-0 md:border-r lg:min-h-16"
                    >
                      <Users className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-semibold sm:text-base lg:text-lg">
                        {adult} Dewasa, {child} Anak, {infant} Bayi
                      </span>
                    </button>

                    <button
                      onClick={handleSearch}
                      className="btn-animate btn-sheen inline-flex w-full items-center justify-center gap-2 bg-orange-500 px-6 py-4 text-base font-bold text-white transition hover:bg-orange-600 md:w-auto md:text-xl lg:min-h-16 lg:px-7"
                    >
                      <Search className="h-6 w-6" />
                      <span className="md:hidden">Cari Tiket</span>
                    </button>
                  </div>
                </div>

                {activePanel === "airport" && (
                  <section
                    className={`${closingPanel === "airport" ? "popup-panel-close-animate" : "popup-panel-animate"} mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-2xl sm:p-4`}
                  >
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
                      <p className="text-xs font-semibold text-slate-500">
                        Cari bandara / kota
                      </p>
                      <input
                        value={airportKeyword}
                        onChange={(event) =>
                          setAirportKeyword(event.target.value)
                        }
                        placeholder="Contoh: CGK, Jakarta, Bali"
                        className="mt-1 w-full text-sm font-semibold outline-none"
                      />
                      {isAirportSearchInvalid && (
                        <p className="mt-1 text-xs text-slate-500">
                          Ketik minimal 3 karakter untuk mencari bandara.
                        </p>
                      )}
                    </div>

                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {airportLoadError && (
                        <div className="border-b border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                          {airportLoadError}
                        </div>
                      )}
                      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                        <p className="text-sm font-bold text-slate-600">
                          {airportKeyword.trim()
                            ? "Autocomplete Suggestion Panel"
                            : "Popular Cities or Airports (API)"}
                        </p>
                        <div className="flex items-center gap-3">
                          {airportLoading && (
                            <span className="text-xs font-semibold text-blue-700">
                              Memuat dari API...
                            </span>
                          )}
                          {recentSearches.length > 0 && (
                            <button
                              onClick={clearRecentSearches}
                              className="text-xs font-semibold text-red-500 hover:text-red-600"
                            >
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
                              <span className="block text-base font-bold text-slate-900">
                                {item.airportName}
                              </span>
                              <span className="block text-sm text-slate-600">
                                {item.city}, {item.country}
                              </span>
                            </span>
                            <span className="text-lg font-bold text-slate-500 sm:text-2xl">
                              {item.code}
                            </span>
                          </button>
                        ))}

                        {isAirportSearchInvalid ? (
                          <p className="px-3 py-3 text-sm text-slate-500">
                            Ketik minimal 3 karakter untuk mencari bandara.
                          </p>
                        ) : airportLoading && airportOptions.length === 0 ? (
                          <p className="px-3 py-3 text-sm text-slate-500">
                            Sedang mengambil data bandara dari API...
                          </p>
                        ) : airportOptions.length === 0 ? (
                          <p className="px-3 py-3 text-sm text-slate-500">
                            Bandara tidak ditemukan.
                          </p>
                        ) : (
                          airportOptions.map((item) => (
                            <button
                              key={`${airportMode}-${item.label}`}
                              onClick={() => chooseAirport(item.label)}
                              className="grid w-full grid-cols-[20px_1fr_auto] items-center gap-2 border-b border-slate-100 px-3 py-3 text-left hover:bg-blue-50 last:border-b-0 sm:grid-cols-[24px_1fr_auto] sm:gap-3"
                            >
                              <Plane className="h-5 w-5 text-slate-700" />
                              <span>
                                <span className="block text-base font-bold text-slate-900">
                                  {item.airportName}
                                </span>
                                <span className="block text-sm text-slate-600">
                                  {item.city}, {item.country}
                                </span>
                              </span>
                              <span className="text-lg font-bold text-slate-500 sm:text-2xl">
                                {item.code}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {recentSearches.length > 0 && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                          <p className="text-xs font-semibold text-slate-600">
                            Search History Dropdown
                          </p>
                        </div>
                        <div className="max-h-28 overflow-y-auto">
                          {recentSearches.map((item) => (
                            <button
                              key={`${item.timestamp}-${item.origin}-${item.destination}`}
                              onClick={() => applyRecentSearch(item)}
                              className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left text-xs hover:bg-blue-50 last:border-b-0"
                            >
                              <span className="font-semibold">
                                {item.origin} → {item.destination}
                              </span>
                              <span className="text-slate-500">
                                {formatShortDate(item.departureDate)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {activePanel === "guests" && (
                  <section
                    className={`${closingPanel === "guests" ? "popup-panel-close-animate" : "popup-panel-animate"} mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl`}
                  >
                    <h2 className="text-xl font-black">Jumlah Penumpang</h2>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-slate-800">
                              Dewasa
                            </p>
                            <p className="text-sm text-slate-500">
                              12 tahun atau lebih
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={decreaseAdult}
                              className="h-10 w-10 rounded-lg border border-slate-200 bg-white text-xl font-bold text-slate-600"
                            >
                              -
                            </button>
                            <span className="min-w-8 text-center text-3xl font-bold text-slate-900">
                              {adult}
                            </span>
                            <button
                              onClick={increaseAdult}
                              className="h-10 w-10 rounded-lg border border-slate-200 bg-white text-xl font-bold text-blue-600"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-slate-800">
                              Anak
                            </p>
                            <p className="text-sm text-slate-500">2 - 11 thn</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={decreaseChild}
                              className="h-10 w-10 rounded-lg border border-slate-200 bg-white text-xl font-bold text-slate-600"
                            >
                              -
                            </button>
                            <span className="min-w-8 text-center text-3xl font-bold text-slate-900">
                              {child}
                            </span>
                            <button
                              onClick={increaseChild}
                              className="h-10 w-10 rounded-lg border border-slate-200 bg-white text-xl font-bold text-blue-600"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-slate-800">
                              Bayi
                            </p>
                            <p className="text-sm text-slate-500">
                              Di bawah 2 tahun
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={decreaseInfant}
                              className="h-10 w-10 rounded-lg border border-slate-200 bg-white text-xl font-bold text-slate-600"
                            >
                              -
                            </button>
                            <span className="min-w-8 text-center text-3xl font-bold text-slate-900">
                              {infant}
                            </span>
                            <button
                              onClick={increaseInfant}
                              disabled={infant >= adult}
                              className="h-10 w-10 rounded-lg border border-slate-200 bg-white text-xl font-bold text-blue-600 disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-5 mt-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="mt-1 text-lg font-semibold text-blue-700">
                            Total kursi yang dipilih nanti: {seatPassengerCount}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                        <p className="text-base font-semibold text-slate-900">
                          Normalisasi Kursi
                        </p>
                        <p>Dewasa (≥12 tahun) → 1 orang = 1 kursi</p>
                        <p>Anak (2-11 tahun) → 1 orang = 1 kursi</p>
                        <p>Bayi (&lt;2 tahun) → tidak mendapat kursi sendiri</p>
                      </div>

                      <div
                        className={`rounded-xl border px-3 py-3 text-sm ${hasInfantRuleViolation ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}
                      >
                        <p className="text-base font-semibold">
                          Batasan Penting
                        </p>
                        <p>1 dewasa hanya boleh membawa 1 bayi.</p>
                        <p>Contoh valid: 2 dewasa → maksimal 2 bayi.</p>
                        <p>Contoh tidak valid: 1 dewasa + 2 bayi.</p>
                        {hasInfantRuleViolation && (
                          <p className="mt-1 font-semibold">
                            Komposisi saat ini tidak valid: jumlah bayi melebihi
                            jumlah dewasa.
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={triggerClosePanel}
                      disabled={hasInfantRuleViolation}
                      className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Gunakan Pilihan Ini
                    </button>
                  </section>
                )}

                {activePanel === "date" && (
                  <section
                    className={`${closingPanel === "date" ? "popup-panel-close-animate" : "popup-panel-animate"} mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-2xl sm:p-4`}
                  >
                    <h2 className="text-2xl font-black">Stay Date</h2>

                    <label className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={isRoundTrip}
                        onChange={toggleRoundTrip}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Tanggal pulang
                    </label>

                    <div className="mt-3 grid gap-4 border-b border-slate-200 pb-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-500">Check-In</p>
                        <p className="text-xl font-black">
                          {formatLongDate(departureDate)}
                        </p>
                      </div>
                      <div className="md:text-right">
                        <p className="text-sm text-slate-500">Check-Out</p>
                        <p className="text-xl font-black">
                          {isRoundTrip
                            ? formatLongDate(returnDate)
                            : "Opsional"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                        <span className="h-2 w-2 rounded-full bg-blue-600" />{" "}
                        Range terpilih
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />{" "}
                        Harga dari API
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-red-600">
                        <span className="h-2 w-2 rounded-full bg-red-500" />{" "}
                        Hari libur / weekend
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />{" "}
                        Hari kerja
                      </span>
                    </div>

                    {calendarPriceLoading && (
                      <p className="mt-3 text-xs font-semibold text-slate-500">
                        Memuat harga tiket dari API...
                      </p>
                    )}

                    <>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                          Geser kiri/kanan untuk pindah bulan
                        </p>
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
                          <div
                            key={`${calendar.month.getFullYear()}-${calendar.month.getMonth()}`}
                            className="rounded-2xl border border-slate-200 p-4"
                          >
                            <p className="text-2xl font-black">
                              {new Intl.DateTimeFormat("en-GB", {
                                month: "long",
                                year: "numeric",
                              }).format(calendar.month)}
                            </p>

                            <div className="mt-3 grid grid-cols-7 gap-1">
                              {weekDays.map((label) => (
                                <p
                                  key={label}
                                  className={`text-center text-sm ${label === "Sun" ? "text-red-500" : "text-slate-500"}`}
                                >
                                  {label}
                                </p>
                              ))}

                              {calendar.cells.map((cell) => {
                                if (!cell.inCurrentMonth || !cell.isoDate) {
                                  return (
                                    <div key={cell.key} className="h-14" />
                                  );
                                }

                                const isHoliday =
                                  Boolean(cell.holidayName) || cell.isWeekend;

                                return (
                                  <button
                                    key={cell.key}
                                    onClick={() =>
                                      handleDaySelect(cell.isoDate!)
                                    }
                                    title={
                                      cell.holidayName ??
                                      (isHoliday ? "Weekend" : "Hari kerja")
                                    }
                                    className={`relative flex h-16 flex-col items-center justify-start rounded-lg border px-1 pt-1 text-sm font-semibold transition ${
                                      cell.isSelected
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : cell.isInRange
                                          ? "border-blue-100 bg-blue-100 text-blue-700"
                                          : "border-transparent hover:bg-slate-100"
                                    }`}
                                  >
                                    <span>{cell.day}</span>
                                    {calendarPriceByDate[cell.isoDate] !==
                                    undefined ? (
                                      <span
                                        className={`absolute bottom-1 text-[10px] font-bold leading-none ${
                                          cell.isSelected
                                            ? "text-white/95"
                                            : cell.isInRange
                                              ? "text-blue-700"
                                              : "text-amber-600"
                                        }`}
                                      >
                                        {formatCompactTicketPrice(
                                          calendarPriceByDate[cell.isoDate],
                                        )}
                                      </span>
                                    ) : (
                                      <span
                                        className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                                          isHoliday
                                            ? "bg-red-500"
                                            : "bg-emerald-500"
                                        }`}
                                      />
                                    )}
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
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-red-500" />{" "}
                        Holiday / Weekend
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />{" "}
                        Weekday
                      </span>
                    </div>
                  </section>
                )}
              </div>
            </section>
          </LazySection>
        </main>
      </div>
      <HomePromoSection />
      <ChatBot />
    </>
  );
}
