"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Plane } from "lucide-react";
import MainNav from "@/components/MainNav";

const QRCode = dynamic(
  () => import("qrcode.react").then((m) => ({ default: m.QRCodeSVG })),
  { ssr: false, loading: () => <div className="h-24 w-24 rounded bg-gray-100 animate-pulse" /> },
);

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

function formatRupiah(v: string) {
  const n = Number(v);
  if (!n) return "";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

type ETicketData = {
  passenger: string;
  flightNumber: string;
  seat: string;
  route: string;
  date: string;
  status: string;
  pdfUrl: string;
  bookingCode: string;
  airline: string;
  departureIso: string;
  arrivalIso: string;
  originAirportName: string;
  destAirportName: string;
  originCity: string;
  destCity: string;
  pTitle: string;
  pDocType: string;
  pDocNumber: string;
  totalPrice: string;
};

function ETicketContent() {
  const params = useParams();
  const bookingCode = typeof params.bookingCode === "string" ? params.bookingCode : "";

  const [data, setData] = useState<ETicketData | null>(null);
  const [qrValue, setQrValue] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem(`eticket_${bookingCode}`);
    if (raw) {
      try {
        setData(JSON.parse(raw) as ETicketData);
      } catch {
        // ignore parse errors
      }
    }
    setQrValue(`${window.location.origin}/bookings/verify?code=${encodeURIComponent(bookingCode)}`);
  }, [bookingCode]);

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100">
        <MainNav />
        <p className="text-slate-500 text-sm">Data tiket tidak ditemukan.</p>
        <Link href="/bookings" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Kembali ke Pesanan
        </Link>
      </div>
    );
  }

  const {
    passenger, flightNumber, seat, date, airline,
    departureIso, arrivalIso, originAirportName, destAirportName,
    originCity, destCity, pDocType, pDocNumber, totalPrice,
  } = data;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .ticket-wrap { padding: 0 !important; background: white !important; min-height: 0 !important; }
          .ticket-doc { box-shadow: none !important; border: none !important; max-width: 100% !important; margin: 0 auto !important; zoom: 0.82; break-inside: avoid; page-break-inside: avoid; }
          .brand-wave { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @page { margin: 5mm 10mm; size: A4; }
        .brand-wave {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #60a5fa 100%);
          clip-path: ellipse(85% 100% at 100% 0%);
        }
      `}</style>

      <div className="no-print">
        <MainNav />
      </div>

      <main className="ticket-wrap min-h-screen bg-gray-100 px-4 py-8 print:bg-white print:p-0">
        {/* Top nav bar */}
        <div className="no-print mx-auto mb-5 flex max-w-2xl items-center justify-between">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <Download className="h-3.5 w-3.5" /> Unduh PDF
          </button>
        </div>

        {/* ── Ticket Document ── */}
        <div className="ticket-doc mx-auto max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">

          {/* ── Section 1: Header ── */}
          <div className="relative flex items-start justify-between px-8 pt-7 pb-5 overflow-hidden">
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-tight">E-ticket</p>
              <p className="text-sm text-gray-500 mt-0.5">Penerbangan Pergi / <span className="italic">Departure Flight</span></p>
            </div>
            <div className="brand-wave absolute top-0 right-0 h-24 w-52 flex items-start justify-end">
              <div className="flex items-center gap-1.5 text-white mt-4 mr-5">
                <Plane className="h-4 w-4 shrink-0" />
                <span className="text-base font-bold tracking-wide whitespace-nowrap">SkyIntern</span>
              </div>
            </div>
          </div>

          <div className="mx-8 border-t border-gray-200" />

          {/* ── Section 2: Flight Info ── */}
          <div className="grid grid-cols-1 gap-0 px-8 py-5 sm:grid-cols-[auto_1fr_auto] sm:gap-8">

            {/* Airline */}
            <div className="mb-4 flex flex-row items-center gap-3 sm:mb-0 sm:flex-col sm:items-start sm:justify-start sm:w-32">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-black text-blue-700 border border-blue-100">
                {airline ? airline.charAt(0).toUpperCase() : <Plane className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{airline || "Airline"}</p>
                <p className="text-xs text-gray-500">{flightNumber}</p>
                <p className="text-xs text-gray-500">Economy</p>
              </div>
            </div>

            {/* Route timeline */}
            <div className="flex-1">
              <p className="mb-3 text-sm font-semibold text-gray-700">
                {departureIso ? fmtDateEn(departureIso) : date}
              </p>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-1.5">
                  <div className="h-3 w-3 rounded-full bg-blue-600 border-2 border-blue-600" />
                  <div className="w-px flex-1 bg-blue-200 my-1" style={{ minHeight: "2.5rem" }} />
                  <div className="h-3 w-3 rounded-full border-2 border-blue-500 bg-white" />
                </div>
                <div className="flex flex-col gap-6 flex-1">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black tabular-nums text-gray-900">
                        {departureIso ? fmtTime(departureIso) : "--:--"}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{originCity}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{originAirportName}</p>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black tabular-nums text-gray-900">
                        {arrivalIso ? fmtTime(arrivalIso) : "--:--"}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{destCity}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{destAirportName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking ID + Price */}
            <div className="mt-4 sm:mt-0 sm:min-w-35 sm:text-right border-t border-gray-100 pt-4 sm:border-t-0 sm:pt-0">
              <div className="mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Booking ID</p>
                <p className="mt-0.5 text-base font-black tracking-wider text-gray-900">{bookingCode || "—"}</p>
              </div>
              {pDocType && pDocNumber && (
                <div className="mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{pDocType}</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-700">{pDocNumber}</p>
                </div>
              )}
              {totalPrice && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Total</p>
                  <p className="mt-0.5 text-sm font-bold text-blue-700">{formatRupiah(totalPrice)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mx-8 border-t border-gray-200" />

          {/* ── Section 3: Tips ── */}
          <div className="grid grid-cols-1 gap-4 px-8 py-5 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 text-base">
                📋
              </div>
              <p className="text-xs text-gray-600 leading-relaxed pt-0.5">
                Tunjukkan e-tiket dan identitas yang valid saat check-in
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 text-base">
                ⏱
              </div>
              <p className="text-xs text-gray-600 leading-relaxed pt-0.5">
                Check-in <strong>minimal 90 menit</strong> sebelum keberangkatan
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 text-base">
                🕐
              </div>
              <p className="text-xs text-gray-600 leading-relaxed pt-0.5">
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
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400 w-8">No.</th>
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Penumpang</th>
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Kursi</th>
                  <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Kelas</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="pt-3 text-gray-500 align-top">1</td>
                  <td className="pt-3 font-semibold text-gray-900 align-top">{passenger || "—"}</td>
                  <td className="pt-3 font-semibold text-gray-900 align-top">{seat}</td>
                  <td className="pt-3 text-gray-700 align-top">Economy</td>
                </tr>
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
              <p className="mt-1 text-2xl font-black tracking-[0.2em] text-gray-900">{bookingCode}</p>
              <p className="mt-1 text-xs text-gray-500">Pindai QR di mesin self check-in atau tunjukkan ke petugas bandara.</p>
            </div>
          </div>

          {/* ── Footer note ── */}
          <div className="no-print border-t border-gray-100 bg-gray-50 px-8 py-3 text-center">
            <p className="text-[11px] italic text-gray-400">
              Electronic Ticket (E-Ticket) Penerbangan · SkyIntern E-Ticketing System
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default function ETicketPage() {
  return (
    <Suspense>
      <ETicketContent />
    </Suspense>
  );
}
