"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Download, Ticket, UserRound } from "lucide-react";
import MainNav from "@/components/MainNav";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => ({ default: m.QRCodeSVG })),
  {
    ssr: false,
    loading: () => <div className="skeleton h-40 w-40 rounded-xl" />,
  },
);

type BookingStatus = "Pending" | "Processing" | "Paid" | "Cancelled";

const getStatusClass = (status: BookingStatus) => {
  if (status === "Paid") return "bg-emerald-100 text-emerald-700";
  if (status === "Processing") return "bg-blue-100 text-blue-700";
  if (status === "Cancelled") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};

function ETicketPageContent() {
  const searchParams = useSearchParams();

  const passenger = searchParams.get("passenger") ?? "";
  const flightNumber = searchParams.get("flightNumber") ?? "";
  const seat = searchParams.get("seat") ?? "-";
  const route = searchParams.get("route") ?? "";
  const date = searchParams.get("date") ?? "";
  const pdfUrl = searchParams.get("pdfUrl") ?? "";
  const status = (searchParams.get("status") as BookingStatus | null) ?? "Paid";
  const bookingCode = searchParams.get("bookingCode") ?? flightNumber;

  const [qrValue, setQrValue] = useState("");
  useEffect(() => {
    setQrValue(`${window.location.origin}/bookings/verify?code=${encodeURIComponent(bookingCode)}`);
  }, [bookingCode]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-md px-6 py-10">
        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl">
          <div className="bg-blue-600 p-6 text-center text-white">
            <h1 className="inline-flex items-center gap-2 text-2xl font-black">
              <Ticket className="h-6 w-6" /> Digital Boarding Pass
            </h1>
          </div>

          <div className="space-y-5 p-6">
            <div className="flex items-center justify-center">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Status: {status}
              </span>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center">
              <p className="text-sm text-slate-600">Flight Number</p>
              <p className="text-3xl font-black text-blue-700">{flightNumber}</p>
              <p className="mt-1 text-sm text-slate-600">{route} • {date}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-blue-100 bg-white p-3">
                <p className="text-slate-500">Passenger Name</p>
                <p className="mt-1 inline-flex items-center gap-1 font-semibold text-slate-900"><UserRound className="h-4 w-4 text-blue-700" /> {passenger}</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-white p-3 text-right">
                <p className="text-slate-500">Seat Number</p>
                <p className="mt-1 text-2xl font-black text-blue-700">{seat}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center">
              <p className="mb-3 text-sm font-semibold text-blue-700">QR Code Booking</p>
              <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-sm">
                {qrValue ? (
                  <QRCodeSVG
                    value={qrValue}
                    size={160}
                    level="M"
                    includeMargin={false}
                  />
                ) : (
                  <div className="skeleton h-40 w-40 rounded-xl" />
                )}
              </div>
              <p className="mt-3 text-xl font-black tracking-widest text-slate-900">{bookingCode}</p>
              <p className="mt-1 text-xs text-slate-500">Scan QR code ini untuk verifikasi booking.</p>
            </div>

            {pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
              >
                <Download className="h-4 w-4" /> Download PDF
              </a>
            ) : (
              <div className="rounded-2xl border border-blue-100 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
                PDF tiket belum tersedia.
              </div>
            )}

            <p className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-xs text-slate-600">
              E-Ticket digital ini dapat digunakan sebagai bukti pemesanan. Tunjukkan QR code ini kepada petugas bandara.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function ETicketPage() {
  return (
    <Suspense>
      <ETicketPageContent />
    </Suspense>
  );
}
