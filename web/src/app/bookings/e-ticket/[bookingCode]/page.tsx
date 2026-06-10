"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Plane } from "lucide-react";
import MainNav from "@/components/MainNav";
import { verifyBookingFromApi } from "@/lib/booking-api";

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

type ETicketData = {
  passenger: string;
  flightNumber: string;
  seat: string;
  route: string;
  date: string;
  status: string;
  bookingCode: string;
  airline: string;
  airlineLogo?: string;
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
  const searchParams = useSearchParams();
  const bookingCode = typeof params.bookingCode === "string" ? params.bookingCode : "";
  const shouldAutoDownload = searchParams.get("download") === "1";
  const hasTriggeredPrintRef = useRef(false);
  const ticketRef = useRef<HTMLDivElement | null>(null);

  const [data, setData] = useState<ETicketData | null>(null);
  const [qrValue, setQrValue] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isAirlineLogoBroken, setIsAirlineLogoBroken] = useState(false);

  const handleDownloadPdf = useCallback(async (useSaveAs: boolean = true) => {
    if (!ticketRef.current || !bookingCode || isGeneratingPdf) return;

    try {
      setIsGeneratingPdf(true);

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf")
      ]);

      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      const renderWidth = canvas.width * ratio;
      const renderHeight = canvas.height * ratio;
      const offsetX = (pageWidth - renderWidth) / 2;
      const offsetY = (pageHeight - renderHeight) / 2;

      pdf.addImage(canvas.toDataURL("image/png"), "PNG", offsetX, offsetY, renderWidth, renderHeight, undefined, "FAST");
      const defaultFileName = `SkyIntern E-Ticketing-${bookingCode}.pdf`;
      const pdfBlob = pdf.output("blob");

      type WindowWithSavePicker = Window & {
        showSaveFilePicker?: (options: {
          suggestedName?: string;
          types?: Array<{ description: string; accept: Record<string, string[]> }>;
        }) => Promise<{
          createWritable: () => Promise<{
            write: (data: Blob) => Promise<void>;
            close: () => Promise<void>;
          }>;
        }>;
      };

      const pickerWindow = window as WindowWithSavePicker;
      if (useSaveAs && pickerWindow.showSaveFilePicker) {
        try {
          const fileHandle = await pickerWindow.showSaveFilePicker({
            suggestedName: defaultFileName,
            types: [
              {
                description: "PDF Document",
                accept: { "application/pdf": [".pdf"] }
              }
            ]
          });

          const writable = await fileHandle.createWritable();
          await writable.write(pdfBlob);
          await writable.close();
        } catch (error) {
          // User canceled Save As dialog: treat as normal cancel, no fallback download.
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          // If picker is blocked/not allowed, fallback to regular download.
          pdf.save(defaultFileName);
        }
      } else {
        // Fallback for browsers that don't support Save As picker
        pdf.save(defaultFileName);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [bookingCode, isGeneratingPdf]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const raw = sessionStorage.getItem(`eticket_${bookingCode}`);
      let parsedFromSession: ETicketData | null = null;
      if (raw) {
        try {
          parsedFromSession = JSON.parse(raw) as ETicketData;
          if (isMounted) {
            setData(parsedFromSession);
          }
        } catch {
          // ignore parse errors
        }
      }

      if (bookingCode && (!raw || !parsedFromSession?.airlineLogo)) {
        try {
          const response = await verifyBookingFromApi(bookingCode);
          const booking = response.booking;
          const passenger = booking.passengers?.[0]
            ? `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}`.trim()
            : "Passenger";

          const fallbackData: ETicketData = {
            passenger,
            flightNumber: booking.flight.flightNumber,
            seat: booking.selectedSeats ?? "-",
            route: `${booking.flight.origin.city} → ${booking.flight.destination.city}`,
            date: fmtDateEn(booking.flight.departureTime),
            status: booking.status,
            bookingCode: booking.bookingCode,
            airline: booking.flight.airline.name,
            airlineLogo: booking.flight.airline.logo ?? "",
            departureIso: booking.flight.departureTime,
            arrivalIso: booking.flight.arrivalTime,
            originAirportName: booking.flight.origin.city,
            destAirportName: booking.flight.destination.city,
            originCity: booking.flight.origin.city,
            destCity: booking.flight.destination.city,
            pTitle: booking.passengers?.[0]?.title ?? "Mr",
            pDocType: "",
            pDocNumber: "",
            totalPrice: "",
          };

          if (isMounted) {
            setData((prev) => ({ ...(prev ?? fallbackData), ...fallbackData }));
            sessionStorage.setItem(`eticket_${bookingCode}`, JSON.stringify({ ...(parsedFromSession ?? {}), ...fallbackData }));
          }
        } catch {
          // keep null data to show fallback message
        }
      }

      if (isMounted) {
        setQrValue(`${window.location.origin}/bookings/verify?code=${encodeURIComponent(bookingCode)}`);
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [bookingCode]);

  useEffect(() => {
    setIsAirlineLogoBroken(false);
  }, [data?.airlineLogo]);

  useEffect(() => {
    if (!shouldAutoDownload || !data || hasTriggeredPrintRef.current) return;

    hasTriggeredPrintRef.current = true;
    const timer = setTimeout(() => {
      // Auto download from email should skip Save As picker (no user gesture context).
      void handleDownloadPdf(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [shouldAutoDownload, data, handleDownloadPdf]);

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
    airlineLogo,
    departureIso, arrivalIso, originAirportName, destAirportName,
    originCity, destCity, pDocType, pDocNumber, totalPrice,
  } = data;
  const isExpiredTicket = departureIso ? new Date(departureIso).getTime() < Date.now() : false;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: hidden !important;
          }
          body * {
            visibility: hidden !important;
          }
          .ticket-doc,
          .ticket-doc * {
            visibility: visible !important;
          }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .ticket-wrap {
            display: flex !important;
            align-items: flex-start !important;
            justify-content: center !important;
            padding: 0 !important;
            background: white !important;
            min-height: 0 !important;
          }
          .ticket-doc {
            position: absolute !important;
            top: 0 !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            box-shadow: none !important;
            border: none !important;
            width: 270mm !important;
            max-width: 270mm !important;
            margin: 0 auto !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .brand-wave { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .ticket-watermark {
            display: flex !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .ticket-watermark span {
            color: rgba(0,0,0,0.09) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        @page { margin: 8mm; size: A4 landscape; }
        .brand-wave {
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #60a5fa 100%);
          clip-path: ellipse(85% 100% at 100% 0%);
        }
        .ticket-watermark {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          user-select: none;
          overflow: hidden;
          z-index: 0;
        }
        .ticket-watermark span {
          transform: rotate(-35deg);
          font-size: 5rem;
          font-weight: 900;
          letter-spacing: 0.18em;
          color: rgba(0,0,0,0.055);
          white-space: nowrap;
          line-height: 1;
        }
      `}</style>

      <div className="no-print">
        <MainNav />
      </div>

      <main className="ticket-wrap min-h-screen bg-gray-100 px-4 py-8 print:bg-white print:p-0">
        {/* Top nav bar */}
        <div className="no-print mx-auto mb-3 flex max-w-245 items-center justify-between">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kembali
          </Link>
          <button
            onClick={() => void handleDownloadPdf()}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <Download className="h-3.5 w-3.5" /> {isGeneratingPdf ? "Membuat PDF..." : "Unduh PDF"}
          </button>
        </div>

        <div
          className={`no-print mx-auto mb-4 max-w-245 rounded-lg px-4 py-2 text-xs ${
            isExpiredTicket
              ? "border border-slate-200 bg-slate-50 text-slate-700"
              : "border border-blue-100 bg-blue-50 text-blue-800"
          }`}
        >
          {isExpiredTicket
            ? `Status tiket: Expired. Jadwal keberangkatan telah lewat pada ${fmtDateTime(departureIso)}.`
            : "Jangan lupa untuk membawa E-Ticket ini dan identitas yang valid saat check-in di bandara. Selamat menikmati penerbangan Anda!"}
        </div>

        {/* ── Ticket Document ── */}
        <div ref={ticketRef} className="ticket-doc relative mx-auto max-w-245 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">

          {/* Diagonal watermark – visible on screen & PDF */}
          <div className="ticket-watermark" aria-hidden="true">
            <span>{airline || "SkyIntern"}</span>
          </div>

          {/* ── Section 1: Header ── */}
          <div className="relative flex items-start justify-between overflow-hidden px-7 pb-4 pt-5">
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-tight">E-Ticket</p>
              <p className="text-sm text-gray-500 mt-0.5">Penerbangan Pergi / <span className="italic">Departure Flight</span></p>
              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  isExpiredTicket
                    ? "bg-slate-200 text-slate-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isExpiredTicket ? "Expired" : "Active"}
              </span>
            </div>
            <div className="brand-wave absolute right-0 top-0 flex h-20 w-56 items-start justify-end">
              <div className="flex items-center gap-1.5 text-white mt-4 mr-5">
                <Plane className="h-4 w-4 shrink-0" />
                <span className="text-base font-bold tracking-wide whitespace-nowrap">SkyIntern</span>
              </div>
            </div>
          </div>

          <div className="mx-8 border-t border-gray-200" />

          {/* ── Section 2: Flight Info ── */}
          <div className="grid grid-cols-1 gap-0 px-7 py-4 sm:grid-cols-[auto_1fr_auto] sm:gap-8">

            {/* Airline */}
            <div className="mb-4 flex flex-row items-center gap-3 sm:mb-0 sm:flex-col sm:items-start sm:justify-start sm:w-32">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-black text-blue-700 border border-blue-100">
                {airlineLogo && !isAirlineLogoBroken ? (
                  <Image
                    src={airlineLogo}
                    alt={airline || "Airline"}
                    width={80}
                    height={80}
                    className="h-full w-full rounded-full object-cover"
                    crossOrigin="anonymous"
                    unoptimized
                    onError={() => setIsAirlineLogoBroken(true)}
                  />
                ) : airline ? (
                  airline.charAt(0).toUpperCase()
                ) : (
                  <Plane className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{airline || "Airline"}</p>
                <p className="text-xs text-gray-500">{flightNumber}</p>
              </div>
            </div>

            {/* Route timeline */}
            <div className="flex-1">
              <p className="mb-2 text-sm font-semibold text-gray-700">
                {departureIso ? fmtDateEn(departureIso) : date}
              </p>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-1.5">
                  <div className="h-3 w-3 rounded-full bg-blue-600 border-2 border-blue-600" />
                  <div className="my-1 w-px flex-1 bg-blue-200" style={{ minHeight: "2.1rem" }} />
                  <div className="h-3 w-3 rounded-full border-2 border-blue-500 bg-white" />
                </div>
                <div className="flex flex-1 flex-col gap-4">
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
          <div className="grid grid-cols-1 gap-3 px-7 py-4 sm:grid-cols-3">
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
          <div className="px-7 py-4">
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
          <div className="flex flex-col items-center gap-4 px-7 py-4 sm:flex-row sm:items-center">
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
