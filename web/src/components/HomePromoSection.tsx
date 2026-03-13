"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Tag, Plane, Globe } from "lucide-react";
import { getActivePromos, type Promo } from "@/lib/admin-api";
import { API_BASE_URL } from "@/lib/api-client";

type DealFlight = {
  id: number;
  flightNumber: string;
  origin: string;
  originCity: string;
  originCountry: string;
  destination: string;
  destCity: string;
  destCountry: string;
  destCityImageUrl: string | null;
  airline: string;
  logo: string | null;
  departureTime: string;
  duration: number;
  price: number;
  departureDate: string;
  flightPromos: { id: number; title: string; discount: number }[];  // promos specific to this flight
};

type FlightFromApi = {
  id: number;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  basePrice: number;
  tax: number;
  adminFee: number;
  airline: { name: string; logo?: string | null };
  origin: { city: string; country: string; cityImageUrl?: string | null };
  destination: { city: string; country: string; cityImageUrl?: string | null };
  promos: { id: number; title: string; discount: number; description?: string | null }[];
};

// ── Apply the best active promo discount to a raw price ───────────────────
function applyBestPromo(
  price: number,
  promos: Promo[],
): { discounted: number; discount: number; promoTitle: string } | null {
  if (!promos.length) return null;
  const best = promos.reduce((a, b) => (a.discount > b.discount ? a : b));
  if (!best.discount) return null;
  return {
    discounted: Math.round(price * (1 - best.discount / 100)),
    discount: best.discount,
    promoTitle: best.title,
  };
}

const fmtRupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const fmtDateMed = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

const fmtPromoDate = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

// ── Canonical city mapping (DB city → display tab name) ────────────────────
// Covers airport cities that are better known by a region/island name
const CANONICAL: Record<string, string> = {
  Denpasar:          "Bali",
  "Ngurah Rai":      "Bali",
  "Bandar Lampung":  "Lampung",
  "Sultan Hasanuddin": "Makassar",
  "Adisutjipto":     "Yogyakarta",
  "Adi Sucipto":     "Yogyakarta",
  "Hang Nadim":      "Batam",
  "Halim":           "Jakarta",
  "Soekarno-Hatta":  "Jakarta",
};

// Display label shown in card route text (Denpasar → "Bali / Denpasar")
const DISPLAY_CITY: Record<string, string> = {
  Denpasar: "Bali / Denpasar",
  "Bandar Lampung": "Lampung",
};

function canonicalName(city: string): string {
  return CANONICAL[city] ?? city;
}
function displayName(city: string): string {
  return DISPLAY_CITY[city] ?? city;
}

// ── International country → tab label mapping ──────────────────────────────
const INTL_COUNTRY_TAB: Record<string, string> = {
  Singapore:         "Singapore",
  Malaysia:          "Malaysia",
  Thailand:          "Thailand",
  Japan:             "Japan",
  "South Korea":     "South Korea",
  "Hong Kong":       "Hong Kong",
  China:             "China",
  Australia:         "Australia",
  "Saudi Arabia":    "Saudi Arabia",
  "United Arab Emirates": "Middle East",
  Qatar:             "Middle East",
  Bahrain:           "Middle East",
  Kuwait:            "Middle East",
  India:             "India",
  Vietnam:           "Vietnam",
  Philippines:       "Philippines",
  Taiwan:            "Taiwan",
  "United Kingdom":  "Europe",
  France:            "Europe",
  Germany:           "Europe",
  Netherlands:       "Europe",
  Spain:             "Europe",
  Italy:             "Europe",
  Turkey:            "Europe",
  Switzerland:       "Europe",
};

// ── Indonesian city images (Unsplash CDN) ───────────────────────────────────
const CITY_IMAGES: Record<string, string> = {
  Bali:           "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=480&h=280&q=80",
  Denpasar:       "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=480&h=280&q=80",
  Jakarta:        "https://images.unsplash.com/photo-1555899434-cf4cb3a1b78f?auto=format&fit=crop&w=480&h=280&q=80",
  Surabaya:       "https://images.unsplash.com/photo-1580871750461-22ec85fb71a4?auto=format&fit=crop&w=480&h=280&q=80",
  Yogyakarta:     "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=480&h=280&q=80",
  Medan:          "https://images.unsplash.com/photo-1623605931891-d5b95ee98459?auto=format&fit=crop&w=480&h=280&q=80",
  Makassar:       "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=480&h=280&q=80",
  Palembang:      "https://images.unsplash.com/photo-1547560766-1d97b29c6eb6?auto=format&fit=crop&w=480&h=280&q=80",
  Lombok:         "https://images.unsplash.com/photo-1562602833-0f4ab2fc46e5?auto=format&fit=crop&w=480&h=280&q=80",
  Balikpapan:     "https://images.unsplash.com/photo-1601981282253-9765f1d8ece9?auto=format&fit=crop&w=480&h=280&q=80",
  Lampung:        "https://images.unsplash.com/photo-1569700815664-4d94ac9e4ead?auto=format&fit=crop&w=480&h=280&q=80",
  "Bandar Lampung": "https://images.unsplash.com/photo-1569700815664-4d94ac9e4ead?auto=format&fit=crop&w=480&h=280&q=80",
  Semarang:       "https://images.unsplash.com/photo-1592461543660-d6b2ac46543f?auto=format&fit=crop&w=480&h=280&q=80",
  Manado:         "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=480&h=280&q=80",
  Pontianak:      "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=480&h=280&q=80",
  Pekanbaru:      "https://images.unsplash.com/photo-1560179406-1c6c60e0dc76?auto=format&fit=crop&w=480&h=280&q=80",
  Batam:          "https://images.unsplash.com/photo-1565530879038-24e9e85fc2d8?auto=format&fit=crop&w=480&h=280&q=80",
  Solo:           "https://images.unsplash.com/photo-1583492399893-4a1a4e00c6cb?auto=format&fit=crop&w=480&h=280&q=80",
  Banjarmasin:    "https://images.unsplash.com/photo-1601981282253-9765f1d8ece9?auto=format&fit=crop&w=480&h=280&q=80",
  Samarinda:      "https://images.unsplash.com/photo-1601981282253-9765f1d8ece9?auto=format&fit=crop&w=480&h=280&q=80",
  Jayapura:       "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=480&h=280&q=80",
  Ambon:          "https://images.unsplash.com/photo-1562602833-0f4ab2fc46e5?auto=format&fit=crop&w=480&h=280&q=80",
  Kupang:         "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=480&h=280&q=80",
  Padang:         "https://images.unsplash.com/photo-1547560766-1d97b29c6eb6?auto=format&fit=crop&w=480&h=280&q=80",
  Jambi:          "https://images.unsplash.com/photo-1547560766-1d97b29c6eb6?auto=format&fit=crop&w=480&h=280&q=80",
  "Banda Aceh":   "https://images.unsplash.com/photo-1623605931891-d5b95ee98459?auto=format&fit=crop&w=480&h=280&q=80",
  Palangkaraya:   "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=480&h=280&q=80",
  // ── International cities ────────────────────────────────────────────────────
  Singapore:        "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=480&h=280&q=80",
  "Kuala Lumpur":   "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=480&h=280&q=80",
  Bangkok:          "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=480&h=280&q=80",
  Tokyo:            "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=480&h=280&q=80",
  Seoul:            "https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=480&h=280&q=80",
  "Hong Kong":      "https://images.unsplash.com/photo-1506970845246-18f21d533b20?auto=format&fit=crop&w=480&h=280&q=80",
  Dubai:            "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=480&h=280&q=80",
  Sydney:           "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=480&h=280&q=80",
  Melbourne:        "https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=480&h=280&q=80",
  London:           "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=480&h=280&q=80",
  Paris:            "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=480&h=280&q=80",
  Amsterdam:        "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=480&h=280&q=80",
  Frankfurt:        "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=480&h=280&q=80",
  "New Delhi":      "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=480&h=280&q=80",
  Mumbai:           "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=480&h=280&q=80",
  "Ho Chi Minh City": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=480&h=280&q=80",
  Hanoi:            "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=480&h=280&q=80",
  Manila:           "https://images.unsplash.com/photo-1555899434-cf4cb3a1b78f?auto=format&fit=crop&w=480&h=280&q=80",
  Taipei:           "https://images.unsplash.com/photo-1470004914212-05527e49370b?auto=format&fit=crop&w=480&h=280&q=80",
  Osaka:            "https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=480&h=280&q=80",
  Beijing:          "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=480&h=280&q=80",
  Shanghai:         "https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?auto=format&fit=crop&w=480&h=280&q=80",
  Doha:             "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=480&h=280&q=80",
  Phuket:           "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=480&h=280&q=80",
  "Chiang Mai":     "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=480&h=280&q=80",
};
const DEFAULT_CITY_IMAGE =
  "https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=480&h=280&q=80";

async function fetchDeals(): Promise<DealFlight[]> {
  // Make two parallel calls: one for domestic, one sorted by departure time
  // (which surfaces more diverse/international routes), then merge + deduplicate
  // by origin→destination so every unique route appears exactly once.
  const base = `${API_BASE_URL}/api/flights/search?passengerCount=1&limit=5000`;
  const urls = [
    `${base}&sortBy=price-asc`,
    `${base}&sortBy=departure-asc`,
  ];

  try {
    const responses = await Promise.all(urls.map((u) => fetch(u, { cache: "no-store" })));
    const allFlights: FlightFromApi[] = [];
    for (const res of responses) {
      if (!res.ok) continue;
      const data = (await res.json()) as { flights?: FlightFromApi[] };
      allFlights.push(...(data.flights ?? []));
    }

    // Deduplicate: keep cheapest per unique origin→destination pair
    const seen = new Map<string, { flight: FlightFromApi; price: number }>();
    for (const f of allFlights) {
      const key = `${f.origin.city}|${f.destination.city}`;
      const price = f.basePrice + (f.tax ?? 0) + (f.adminFee ?? 0);
      const existing = seen.get(key);
      if (!existing || price < existing.price) {
        seen.set(key, { flight: f, price });
      }
    }

    return Array.from(seen.values()).map(({ flight: f, price }) => ({
      id: f.id,
      flightNumber: f.flightNumber,
      origin: f.origin.city,
      originCity: f.origin.city,
      originCountry: f.origin.country,
      destination: f.destination.city,
      destCity: f.destination.city,
      destCountry: f.destination.country,
      destCityImageUrl: f.destination.cityImageUrl ?? null,
      airline: f.airline.name,
      logo: f.airline.logo ?? null,
      departureTime: f.departureTime,
      duration: f.duration,
      price,
      flightPromos: f.promos ?? [],
      departureDate: f.departureTime.slice(0, 10),
    }));
  } catch {
    return [];
  }
}

// ── Domestic image-card ──────────────────────────────────────────────────────
function DomesticFlightCard({ flight, promos, index = 0 }: { flight: DealFlight; promos: Promo[]; index?: number }) {
  const combinedPromos = [
    ...promos,
    ...flight.flightPromos.map((p) => ({ ...p, description: null, flightId: flight.id, isActive: true, startDate: "", endDate: "", createdAt: "", updatedAt: "" } as Promo)),
  ];
  const promoResult = applyBestPromo(flight.price, combinedPromos);
  const displayPrice = promoResult ? promoResult.discounted : flight.price;
  const params = new URLSearchParams({
    flightId: String(flight.id),
    origin: flight.originCity,
    destination: flight.destCity,
    departureDate: flight.departureDate,
    adult: "1",
    child: "0",
    price: String(displayPrice),
    airlineName: flight.airline,
    flightNumber: flight.flightNumber,
  });

  const imgSrc =
    flight.destCityImageUrl ??
    CITY_IMAGES[flight.destCity] ??
    CITY_IMAGES[canonicalName(flight.destCity)] ??
    CITY_IMAGES[flight.destCity.split("/")[0].trim()] ??
    DEFAULT_CITY_IMAGE;

  return (
    <Link
      href={`/booking/seat?${params.toString()}`}
      className="group card-enter w-[78vw] max-w-74 shrink-0 rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl sm:w-60 md:w-64 lg:w-72"
      style={{ scrollSnapAlign: "start", animationDelay: `${index * 55}ms` }}
    >
      {/* ── Image ── */}
      <div className="relative h-40 sm:h-44 md:h-48 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={flight.destCity}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_CITY_IMAGE; }}
        />
        {/* ONE-WAY badge */}
        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white text-[9px] font-black tracking-[0.18em] uppercase px-2.5 py-1 rounded-full">
          One-Way
        </div>
        {/* Discount badge */}
        {promoResult && (
          <div className="absolute top-3 right-3 bg-rose-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-md">
            Hemat {promoResult.discount}%
          </div>
        )}
      </div>

      {/* ── Airline row ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
        <div className="h-6 w-6 shrink-0 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
          {flight.logo && flight.logo.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={flight.logo}
              alt={flight.airline}
              className="h-full w-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Plane className="h-3.5 w-3.5 text-blue-500" />
          )}
        </div>
        <span className="text-[11px] text-slate-500 font-medium truncate">{flight.airline}</span>
      </div>

      {/* ── Info ── */}
      <div className="px-4 pt-3 pb-4">
        <p className="text-[14px] sm:text-[15px] font-bold text-slate-900 leading-snug truncate">
          {flight.originCity} – {displayName(flight.destCity)}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">{fmtDateMed(flight.departureTime)}</p>
        <div className="mt-3">
          {promoResult && (
            <p className="text-[11px] text-slate-400 line-through">{fmtRupiah(flight.price)}</p>
          )}
          <p className="text-[15px] font-black text-orange-500 group-hover:text-orange-600 transition-colors">
            {fmtRupiah(promoResult ? promoResult.discounted : flight.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ── International image-card ─────────────────────────────────────────────────
function IntlFlightCard({ flight, promos, index = 0 }: { flight: DealFlight; promos: Promo[]; index?: number }) {
  const combinedPromos = [
    ...promos,
    ...flight.flightPromos.map((p) => ({ ...p, description: null, flightId: flight.id, isActive: true, startDate: "", endDate: "", createdAt: "", updatedAt: "" } as Promo)),
  ];
  const promoResult = applyBestPromo(flight.price, combinedPromos);
  const displayPrice = promoResult ? promoResult.discounted : flight.price;
  const params = new URLSearchParams({
    flightId: String(flight.id),
    origin: flight.originCity,
    destination: flight.destCity,
    departureDate: flight.departureDate,
    adult: "1",
    child: "0",
    price: String(displayPrice),
    airlineName: flight.airline,
    flightNumber: flight.flightNumber,
  });

  const imgSrc =
    flight.destCityImageUrl ??
    CITY_IMAGES[flight.destCity] ??
    CITY_IMAGES[canonicalName(flight.destCity)] ??
    DEFAULT_CITY_IMAGE;

  return (
    <Link
      href={`/booking/seat?${params.toString()}`}
      className="group card-enter w-[78vw] max-w-74 shrink-0 rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl sm:w-60 md:w-64 lg:w-72"
      style={{ scrollSnapAlign: "start", animationDelay: `${index * 55}ms` }}
    >
      {/* ── Image ── */}
      <div className="relative h-40 sm:h-44 md:h-48 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={flight.destCity}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_CITY_IMAGE; }}
        />
        {/* INTL badge */}
        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white text-[9px] font-black tracking-[0.18em] uppercase px-2.5 py-1 rounded-full">
          Intl
        </div>
        {/* Discount badge */}
        {promoResult && (
          <div className="absolute top-3 right-3 bg-rose-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-md">
            Hemat {promoResult.discount}%
          </div>
        )}
      </div>

      {/* ── Airline row ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
        <div className="h-6 w-6 shrink-0 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
          {flight.logo && flight.logo.startsWith("http") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={flight.logo}
              alt={flight.airline}
              className="h-full w-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Globe className="h-3.5 w-3.5 text-blue-500" />
          )}
        </div>
        <span className="text-[11px] text-slate-500 font-medium truncate">{flight.airline}</span>
      </div>

      {/* ── Info ── */}
      <div className="px-4 pt-3 pb-4">
        <p className="text-[14px] sm:text-[15px] font-bold text-slate-900 leading-snug truncate">
          {flight.originCity} – {flight.destCity}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">{fmtDateMed(flight.departureTime)}</p>
        <div className="mt-3">
          {promoResult && (
            <p className="text-[11px] text-slate-400 line-through">{fmtRupiah(flight.price)}</p>
          )}
          <p className="text-[15px] font-black text-orange-500 group-hover:text-orange-600 transition-colors">
            {fmtRupiah(promoResult ? promoResult.discounted : flight.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ── PromoCard ────────────────────────────────────────────────────────────────
function PromoCard({ promo }: { promo: Promo }) {
  const colors = [
    "from-blue-600 to-indigo-600",
    "from-orange-500 to-amber-500",
    "from-emerald-500 to-teal-600",
    "from-purple-600 to-violet-600",
    "from-rose-500 to-pink-600",
  ];
  const colorClass = colors[promo.id % colors.length];

  return (
    <div className={`relative w-[78vw] max-w-85 sm:min-w-64 md:min-w-72 lg:min-w-80 overflow-hidden rounded-2xl bg-linear-to-br ${colorClass} p-4 sm:p-5 text-white shadow-md`}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/10" />
      <div className="relative">
        <div className="mb-1 flex items-center gap-1.5">
          <Tag className="h-4 w-4 shrink-0" />
          {promo.discount > 0 && (
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-black">
              Diskon {promo.discount}%
            </span>
          )}
        </div>
        <p className="mt-2 text-base sm:text-lg font-black leading-snug">{promo.title}</p>
        {promo.description && (
          <p className="mt-1 text-xs sm:text-sm text-white/80 line-clamp-2">{promo.description}</p>
        )}
        <p className="mt-3 text-xs text-white/70">
          {fmtPromoDate(promo.startDate)} – {fmtPromoDate(promo.endDate)}
        </p>
      </div>
    </div>
  );
}

// ── HorizontalScroll wrapper ─────────────────────────────────────────────────
function HorizontalScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button
        onClick={() => scroll("left")}
        className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-2 shadow-md transition hover:bg-gray-50 sm:flex"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4 text-gray-600" />
      </button>
      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto pb-2 sm:gap-4 scrollbar-hide"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {children}
      </div>
      <button
        onClick={() => scroll("right")}
        className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-2 shadow-md transition hover:bg-gray-50 sm:flex"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  );
}

// ── Tab scroll wrapper ────────────────────────────────────────────────────────
function TabScroller({ children, label }: { children: React.ReactNode; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollTab = (dir: "left" | "right") => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };
  return (
    <div className="mb-5">
      {/* Scroll buttons – only on desktop */}
      <div className="hidden sm:flex justify-end gap-1 mb-1">
        {label && <span className="mr-auto text-xs text-slate-400 self-center">{label}</span>}
        <button
          onClick={() => scrollTab("left")}
          className="flex items-center justify-center h-6 w-6 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="h-3 w-3 text-slate-500" />
        </button>
        <button
          onClick={() => scrollTab("right")}
          className="flex items-center justify-center h-6 w-6 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="h-3 w-3 text-slate-500" />
        </button>
      </div>
      <div
        ref={ref}
        className="flex gap-0 overflow-x-auto border-b border-slate-200"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

// ── Skeleton loaders ─────────────────────────────────────────────────────────
function DomesticSkeletons() {
  return (
    <div className="flex gap-3 sm:gap-4 overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-[72vw] max-w-70 sm:w-52 md:w-60 lg:w-72 shrink-0 rounded-2xl overflow-hidden bg-slate-200 animate-pulse">
          <div className="h-32 sm:h-36 md:h-40 bg-slate-300" />
          <div className="p-3.5 space-y-2">
            <div className="h-3.5 w-36 bg-slate-300 rounded" />
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-4 w-28 bg-slate-300 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function HomePromoSection() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [deals, setDeals] = useState<DealFlight[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(true);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedIntlCountry, setSelectedIntlCountry] = useState<string>("");

  useEffect(() => {
    getActivePromos()
      .then(setPromos)
      .catch(() => setPromos([]))
      .finally(() => setLoadingPromos(false));

    fetchDeals()
      .then((data) => {
        setDeals(data);
        // Auto-select first canonical destination city found in domestic data
        const domestic = data.filter(
          (d) => d.originCountry?.toLowerCase() === "indonesia" && d.destCountry?.toLowerCase() === "indonesia",
        );
        const base = domestic.length > 0 ? domestic : data;
        const uniqueCanon = [...new Set(base.map((d) => canonicalName(d.destCity)))];
        if (uniqueCanon[0]) setSelectedCity(uniqueCanon[0]);

        // Auto-select first available international country tab
        const intl = data.filter(
          (d) => d.originCountry?.toLowerCase() !== "indonesia" || d.destCountry?.toLowerCase() !== "indonesia",
        );
        const firstIntlTab = intl
          .map((d) => INTL_COUNTRY_TAB[d.destCountry] ?? d.destCountry)
          .find(Boolean);
        if (firstIntlTab) setSelectedIntlCountry(firstIntlTab);
      })
      .catch(() => setDeals([]))
      .finally(() => setLoadingDeals(false));
  }, []);

  // Use country to split domestic vs international; fall back to all flights if none detected
  const domesticDeals = deals.filter(
    (d) => d.originCountry?.toLowerCase() === "indonesia" && d.destCountry?.toLowerCase() === "indonesia",
  );
  const internationalDeals = deals.filter(
    (d) => d.destCountry?.toLowerCase() !== "indonesia",
  );
  // Fallback: if country data not available in DB, show everything as domestic
  const baseDeals = domesticDeals.length > 0 ? domesticDeals : deals;

  // Dynamic tabs from actual destination cities (canonical names, all destinations)
  const availableTabs = [...new Set(baseDeals.map((d) => canonicalName(d.destCity)))];

  // Flights for the selected tab – match by canonical name
  const cityFilteredDeals = baseDeals.filter(
    (d) => canonicalName(d.destCity).toLowerCase() === selectedCity.toLowerCase(),
  );
  const displayDomestic = cityFilteredDeals.length > 0 ? cityFilteredDeals : baseDeals;

  // International country tabs
  const intlCountryTabs = [...new Set(
    internationalDeals.map((d) => INTL_COUNTRY_TAB[d.destCountry] ?? d.destCountry)
  )];

  // Flights shown under the selected international country tab
  const intlFiltered = selectedIntlCountry
    ? internationalDeals.filter(
        (d) => (INTL_COUNTRY_TAB[d.destCountry] ?? d.destCountry) === selectedIntlCountry
      )
    : internationalDeals;
  const displayInternational = intlFiltered.length > 0 ? intlFiltered : internationalDeals;

  const hasPromos = !loadingPromos && promos.length > 0;
  const hasDomestic = !loadingDeals && baseDeals.length > 0;
  const hasInternational = !loadingDeals && internationalDeals.length > 0;

  if (!hasPromos && !hasDomestic && !hasInternational && !loadingPromos && !loadingDeals) return null;

  return (
    <div className="w-full bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-14 space-y-10 sm:space-y-12">

        {/* ══ Promo Spesial ══════════════════════════════════════════════════ */}
        {(loadingPromos || hasPromos) && (
          <section>
            <h2 className="mb-3 sm:mb-4 text-lg font-black text-slate-900 sm:text-xl md:text-2xl">
              🎉 Promo Spesial
            </h2>
            {loadingPromos ? (
              <div className="flex gap-3 sm:gap-4 overflow-hidden">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-[76vw] max-w-[320px] sm:min-w-64 md:min-w-72 lg:min-w-80 h-28 sm:h-32 md:h-36 animate-pulse rounded-2xl bg-slate-200" />
                ))}
              </div>
            ) : (
              <HorizontalScroll>
                {promos.map((promo) => (
                  <div key={promo.id} style={{ scrollSnapAlign: "start" }}>
                    <PromoCard promo={promo} />
                  </div>
                ))}
              </HorizontalScroll>
            )}
          </section>
        )}

        {/* ══ Domestic Flight Best Deals ════════════════════════════════════ */}
        {(loadingDeals || hasDomestic) && (
          <section>
            {/* Header */}
            <div className="mb-4 sm:mb-5">
              <h2 className="text-lg font-black text-slate-900 sm:text-xl md:text-2xl">
                Domestic Flight Best Deals for You ✈️
              </h2>
            </div>

            {/* City tabs */}
            {!loadingDeals && availableTabs.length > 0 && (
              <TabScroller>
                {availableTabs.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                      selectedCity === city
                        ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                        : "text-slate-400 hover:text-slate-700 border-b-2 border-transparent -mb-px"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </TabScroller>
            )}

            {/* Cards */}
            {loadingDeals ? (
              <DomesticSkeletons />
            ) : (
              <HorizontalScroll>
                {displayDomestic.map((flight, i) => (
                  <DomesticFlightCard key={flight.id} flight={flight} promos={promos} index={i} />
                ))}
              </HorizontalScroll>
            )}
          </section>
        )}

        {/* ══ International Best Deals ══════════════════════════════════════ */}
        {(loadingDeals || hasInternational) && (
          <section>
            <div className="mb-4 sm:mb-5">
              <h2 className="text-lg font-black text-slate-900 sm:text-xl md:text-2xl">
                🌏 Penerbangan Internasional Terbaik
              </h2>
            </div>
            {/* Country tabs */}
            {!loadingDeals && intlCountryTabs.length > 0 && (
              <TabScroller>
                {intlCountryTabs.map((country) => (
                  <button
                    key={country}
                    onClick={() => setSelectedIntlCountry(country)}
                    className={`shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                      selectedIntlCountry === country
                        ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                        : "text-slate-400 hover:text-slate-700 border-b-2 border-transparent -mb-px"
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </TabScroller>
            )}

            {loadingDeals ? (
              <div className="flex gap-3 sm:gap-4 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-[72vw] max-w-70 sm:w-52 md:w-60 lg:w-72 shrink-0 h-36 sm:h-40 md:h-44 animate-pulse rounded-2xl bg-slate-200" />
                ))}
              </div>
            ) : (
              <HorizontalScroll>
                {displayInternational.map((flight, i) => (
                  <IntlFlightCard key={flight.id} flight={flight} promos={promos} index={i} />
                ))}
              </HorizontalScroll>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
