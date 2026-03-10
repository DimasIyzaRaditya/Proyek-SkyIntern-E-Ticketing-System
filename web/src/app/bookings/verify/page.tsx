"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Clock, Plane, UserRound, CalendarDays, Ticket } from "lucide-react";
import MainNav from "@/components/MainNav";
import { verifyBookingFromApi, type VerifyBookingResult } from "@/lib/booking-api";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  PAID: { label: "Terkonfirmasi", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  PENDING: { label: "Menunggu Pembayaran", className: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  CANCELLED: { label: "Dibatalkan", className: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle },
  EXPIRED: { label: "Kedaluwarsa", className: "bg-slate-100 text-slate-600 border-slate-200", icon: XCircle },
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";

  const [result, setResult] = useState<VerifyBookingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError("Kode booking tidak ditemukan dalam QR code.");
      return;
    }

    setLoading(true);
    setError(null);

    verifyBookingFromApi(code)
      .then((data) => setResult(data))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Booking tidak ditemukan.";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [code]);

  const booking = result?.booking;
  const statusConfig = booking ? (STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING) : null;
  const StatusIcon = statusConfig?.icon ?? CheckCircle2;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-md px-6 py-10">
        <div className="mb-6 text-center">
          <h1 className="inline-flex items-center gap-2 text-2xl font-black text-slate-900">
            <Ticket className="h-6 w-6 text-blue-700" /> Verifikasi Booking
          </h1>
          <p className="mt-1 text-sm text-slate-500">Hasil pemindaian QR code</p>
        </div>

        {loading && (
          <div className="rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-lg">
            <p className="text-sm text-slate-500">Memverifikasi kode <span className="font-bold text-slate-900">{code}</span>...</p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-lg">
            <div className="flex flex-col items-center gap-3 text-center">
              <XCircle className="h-12 w-12 text-rose-500" />
              <p className="text-lg font-bold text-rose-700">Verifikasi Gagal</p>
              <p className="text-sm text-slate-600">{error}</p>
              {code && (
                <p className="text-xs text-slate-400">Kode: <span className="font-mono font-bold">{code}</span></p>
              )}
            </div>
          </div>
        )}

        {booking && statusConfig && !loading && (
          <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl">
            <div className={`border-b p-5 text-center ${statusConfig.className}`}>
              <span className="inline-flex items-center gap-2 text-lg font-black">
                <StatusIcon className="h-5 w-5" /> {statusConfig.label}
              </span>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center">
                <p className="text-xs text-slate-500">Kode Booking</p>
                <p className="mt-1 text-3xl font-black tracking-widest text-blue-700">{booking.bookingCode}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Plane className="h-4 w-4 text-blue-600" />
                  {booking.flight.airline.name} • {booking.flight.flightNumber}
                </div>
                <div className="mt-3 flex items-center justify-between text-center">
                  <div>
                    <p className="text-2xl font-black text-slate-900">
                      {booking.flight.origin.city}
                    </p>
                    <p className="text-xs text-slate-500">{booking.flight.origin.country}</p>
                  </div>
                  <div className="flex-1 px-4">
                    <div className="h-0.5 w-full bg-slate-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">
                      {booking.flight.destination.city}
                    </p>
                    <p className="text-xs text-slate-500">{booking.flight.destination.country}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDateTime(booking.flight.departureTime)}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold text-slate-500">Penumpang</p>
                <ul className="space-y-1.5">
                  {booking.passengers.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <UserRound className="h-3.5 w-3.5 text-blue-600" />
                      <span className="font-semibold">{p.title} {p.firstName} {p.lastName}</span>
                      {p.type && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
                          {p.type === "ADULT" ? "Dewasa" : "Anak"}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {booking.selectedSeats && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                  <span className="text-slate-500">Kursi</span>
                  <span className="font-bold text-slate-900">{booking.selectedSeats}</span>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyPageContent />
    </Suspense>
  );
}
