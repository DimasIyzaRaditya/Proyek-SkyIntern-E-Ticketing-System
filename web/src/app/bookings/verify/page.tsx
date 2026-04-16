"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Plane } from "lucide-react";
import MainNav from "@/components/MainNav";
import { verifyBookingFromApi, type VerifyBookingResult } from "@/lib/booking-api";

const QRCode = dynamic(
  () => import("qrcode.react").then((m) => ({ default: m.QRCodeSVG })),
  { ssr: false, loading: () => <div className="h-24 w-24 rounded bg-gray-100 animate-pulse" /> },
);

const STATUS_CONFIG = {
  PAID:      { label: "Confirmed",                 bg: "bg-emerald-500", text: "text-white", Icon: CheckCircle2 },
  ISSUED:    { label: "Ticket Issued",             bg: "bg-blue-600",   text: "text-white", Icon: CheckCircle2 },
  PENDING:   { label: "Awaiting Payment",          bg: "bg-amber-400",  text: "text-white", Icon: Clock        },
  CANCELLED: { label: "Cancelled",                 bg: "bg-rose-500",   text: "text-white", Icon: XCircle      },
  EXPIRED:   { label: "Expired",                   bg: "bg-slate-400",  text: "text-white", Icon: XCircle      },
  PAST_FLIGHT: { label: "Expired (Past Departure)", bg: "bg-slate-500", text: "text-white", Icon: XCircle      },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

function fmtDateTime(iso: string) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function fmtTime(iso: string) {
  if (!iso) return "--:--";
  try {
    return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
  } catch { return "--:--"; }
}

function fmtDateEn(iso: string) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
  } catch { return iso; }
}

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const shouldOpenApp = searchParams.get("openApp") === "1";

  const [result, setResult]   = useState<VerifyBookingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [showOpenAppHint, setShowOpenAppHint] = useState(false);
  const qrValue =
    typeof window !== "undefined"
      ? `${window.location.origin}/bookings/verify?code=${encodeURIComponent(code)}`
      : `/bookings/verify?code=${encodeURIComponent(code)}`;
  const appLink = `skyintern://bookings/e-ticket?code=${encodeURIComponent(code)}`;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNowMs(Date.now());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!code) {
      return;
    }

    const startTimer = setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);

    verifyBookingFromApi(code)
      .then((data) => setResult(data))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Booking tidak ditemukan.";
        setError(message);
      })
      .finally(() => setLoading(false));

    return () => clearTimeout(startTimer);
  }, [code]);

  useEffect(() => {
    if (!code || !shouldOpenApp || typeof window === "undefined") return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|iphone|ipad|ipod/.test(ua);
    if (!isMobileDevice) return;

    const openTimer = window.setTimeout(() => {
      window.location.href = appLink;
    }, 250);

    const hintTimer = window.setTimeout(() => {
      setShowOpenAppHint(true);
    }, 1500);

    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(hintTimer);
    };
  }, [code, shouldOpenApp, appLink]);

  const booking      = result?.booking;
  const displayedError = error ?? (!code ? "Kode booking tidak ditemukan dalam QR code." : null);
  const isPastDeparture = booking?.flight?.departureTime && nowMs !== null
    ? new Date(booking.flight.departureTime).getTime() < nowMs
    : false;
  const shouldShowPastFlight = Boolean(
    booking
      && isPastDeparture
      && booking.status !== "CANCELLED"
      && booking.status !== "EXPIRED"
  );
  const statusKey    = (shouldShowPastFlight ? "PAST_FLIGHT" : (booking?.status ?? "")) as StatusKey;
  const statusConfig = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.PENDING;
  const { Icon: StatusIcon } = statusConfig;

  return (
    <>
      <style>{`
        .brand-wave {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #60a5fa 100%);
          clip-path: ellipse(85% 100% at 100% 0%);
        }
      `}</style>

      <MainNav />

      <main className="min-h-screen bg-gray-100 px-4 py-8">

        {/* ── Loading ── */}
        {loading && (
          <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <p className="text-sm text-slate-500">
                Memverifikasi kode <span className="font-bold text-slate-900">{code}</span>…
              </p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {displayedError && !loading && (
          <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
            <div className="relative flex items-start justify-between overflow-hidden px-8 pt-7 pb-5">
              <div>
                <p className="text-2xl font-bold leading-tight text-gray-900">E-Ticket</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  Verifikasi Gagal / <span className="italic">Verification Failed</span>
                </p>
              </div>
              <div className="brand-wave absolute right-0 top-0 flex h-24 w-52 items-start justify-end">
                <div className="mt-4 mr-5 flex items-center gap-1.5 text-white">
                  <Plane className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap text-base font-bold tracking-wide">SkyIntern</span>
                </div>
              </div>
            </div>
            <div className="mx-8 border-t border-gray-200" />
            <div className="flex flex-col items-center gap-3 px-8 py-12 text-center">
              <XCircle className="h-14 w-14 text-rose-400" />
              <p className="text-lg font-bold text-rose-600">Booking Tidak Ditemukan</p>
              <p className="max-w-xs text-sm text-slate-500">{displayedError}</p>
              {code && (
                <p className="mt-1 text-xs text-slate-400">
                  Kode: <span className="font-mono font-bold">{code}</span>
                </p>
              )}
            </div>
            <div className="border-t border-gray-100 bg-gray-50 px-8 py-3 text-center">
              <p className="text-[11px] italic text-gray-400">
                Electronic Ticket (E-Ticket) Penerbangan · SkyIntern E-Ticketing System
              </p>
            </div>
          </div>
        )}

        {/* ── Ticket ── */}
        {booking && !loading && (
          <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
            {shouldShowPastFlight && (
              <div className="border-b border-slate-200 bg-slate-50 px-8 py-2 text-xs font-medium text-slate-700">
                This ticket has passed its departure schedule at {fmtDateTime(booking.flight.departureTime)}.
              </div>
            )}

            {/* ── Section 1: Header ── */}
            <div className="relative flex items-start justify-between overflow-hidden px-8 pt-7 pb-5">
              <div>
                <p className="text-2xl font-bold leading-tight text-gray-900">E-Ticket</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  Penerbangan Pergi / <span className="italic">Departure Flight</span>
                </p>
                <span
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusConfig.label}
                </span>
              </div>
              <div className="brand-wave absolute right-0 top-0 flex h-24 w-52 items-start justify-end">
                <div className="mt-4 mr-5 flex items-center gap-1.5 text-white">
                  <Plane className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap text-base font-bold tracking-wide">SkyIntern</span>
                </div>
              </div>
            </div>

            <div className="mx-8 border-t border-gray-200" />

            {/* ── Section 2: Flight Info ── */}
            <div className="grid grid-cols-1 gap-0 px-8 py-5 sm:grid-cols-[auto_1fr_auto] sm:gap-8">

              {/* Airline */}
              <div className="mb-4 flex flex-row items-center gap-3 sm:mb-0 sm:w-32 sm:flex-col sm:items-start sm:justify-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-lg font-black text-blue-700">
                  {booking.flight.airline.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{booking.flight.airline.name}</p>
                  <p className="text-xs text-gray-500">{booking.flight.flightNumber}</p>
                  <p className="text-xs text-gray-500">Economy</p>
                </div>
              </div>

              {/* Route timeline */}
              <div className="flex-1">
                <p className="mb-3 text-sm font-semibold text-gray-700">
                  {fmtDateEn(booking.flight.departureTime)}
                </p>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-1.5">
                    <div className="h-3 w-3 rounded-full border-2 border-blue-600 bg-blue-600" />
                    <div className="my-1 w-px flex-1 bg-blue-200" style={{ minHeight: "2.5rem" }} />
                    <div className="h-3 w-3 rounded-full border-2 border-blue-500 bg-white" />
                  </div>
                  <div className="flex flex-1 flex-col gap-6">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black tabular-nums text-gray-900">
                          {fmtTime(booking.flight.departureTime)}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {booking.flight.origin.city}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{booking.flight.origin.country}</p>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black tabular-nums text-gray-900">
                          {fmtTime(booking.flight.arrivalTime)}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {booking.flight.destination.city}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{booking.flight.destination.country}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking ID */}
              <div className="mt-4 border-t border-gray-100 pt-4 sm:mt-0 sm:min-w-32 sm:border-t-0 sm:pt-0 sm:text-right">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Booking ID</p>
                <p className="mt-0.5 text-base font-black tracking-wider text-gray-900">{booking.bookingCode}</p>
              </div>
            </div>

            <div className="mx-8 border-t border-gray-200" />

            {showOpenAppHint && (
              <div className="mx-8 mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-blue-800">
                  Jika aplikasi belum terbuka otomatis, tekan tombol di bawah untuk membuka E-Ticket di aplikasi.
                </p>
                <a
                  href={appLink}
                  className="mt-2 inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Buka di Aplikasi
                </a>
              </div>
            )}

            {/* ── Section 3: Tips ── */}
            <div className="grid grid-cols-1 gap-4 px-8 py-5 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-base text-gray-500">
                  📋
                </div>
                <p className="pt-0.5 text-xs leading-relaxed text-gray-600">
                  Tunjukkan e-tiket dan identitas yang valid saat check-in
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-base text-gray-500">
                  ⏱
                </div>
                <p className="pt-0.5 text-xs leading-relaxed text-gray-600">
                  Check-in <strong>minimal 90 menit</strong> sebelum keberangkatan
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-base text-gray-500">
                  🕐
                </div>
                <p className="pt-0.5 text-xs leading-relaxed text-gray-600">
                  Semua waktu tertera adalah waktu bandara setempat
                </p>
              </div>
            </div>

            <div className="mx-8 border-t border-gray-200" />

            {/* ── Section 4: Passenger Table ── */}
            <div className="px-8 py-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="w-8 pb-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">No.</th>
                    <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Penumpang</th>
                    <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Kursi</th>
                    <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Kelas</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.passengers.map((p, i) => (
                    <tr key={i}>
                      <td className="pt-3 align-top text-gray-500">{i + 1}</td>
                      <td className="pt-3 align-top font-semibold text-gray-900">
                        {p.firstName} {p.lastName}
                      </td>
                      <td className="pt-3 align-top font-semibold text-gray-900">
                        {booking.selectedSeats ?? "—"}
                      </td>
                      <td className="pt-3 align-top text-gray-700">Economy</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mx-8 border-t border-gray-200" />

            {/* ── Section 5: QR Code ── */}
            <div className="flex flex-col items-center gap-5 px-8 py-6 sm:flex-row sm:items-center">
              <div className="shrink-0 border border-gray-200 bg-white p-2">
                {qrValue ? (
                  <QRCode value={qrValue} size={96} level="M" includeMargin={false} />
                ) : (
                  <div className="h-24 w-24 animate-pulse rounded bg-gray-100" />
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Kode Booking</p>
                <p className="mt-1 text-2xl font-black tracking-[0.2em] text-gray-900">{booking.bookingCode}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Pindai QR di mesin self check-in atau{" "}
                  <span className="text-blue-600">tunjukkan ke petugas bandara.</span>
                </p>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="border-t border-gray-100 bg-gray-50 px-8 py-3 text-center">
              <p className="text-[11px] italic text-gray-400">
                Electronic Ticket (E-Ticket) Penerbangan · SkyIntern E-Ticketing System
              </p>
            </div>

          </div>
        )}
      </main>
    </>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyPageContent />
    </Suspense>
  );
}
