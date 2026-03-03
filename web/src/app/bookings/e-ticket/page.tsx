"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Download, QrCode, Ticket, UserRound } from "lucide-react";
import MainNav from "@/components/MainNav";

type BookingStatus = "Pending" | "Paid" | "Issued" | "Cancelled";

const getNextStatus = (status: BookingStatus): BookingStatus => {
  if (status === "Pending") return "Paid";
  if (status === "Paid") return "Issued";
  return status;
};

const getStatusClass = (status: BookingStatus) => {
  if (status === "Issued") return "bg-emerald-100 text-emerald-700";
  if (status === "Paid") return "bg-blue-100 text-blue-700";
  if (status === "Cancelled") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};

export default function ETicketPage() {
  const searchParams = useSearchParams();

  const passenger = searchParams.get("passenger") ?? "Abimanyu Pratama";
  const flightNumber = searchParams.get("flightNumber") ?? "GA-123";
  const seat = searchParams.get("seat") ?? "12A";
  const route = searchParams.get("route") ?? "CGK → DPS";
  const date = searchParams.get("date") ?? "15 Mar 2026";
  const initialStatus = (searchParams.get("status") as BookingStatus | null) ?? "Pending";
  const pdfUrl = searchParams.get("pdfUrl") ?? "https://minio.skyintern.local/e-ticket/BK-SAMPLE.pdf";
  const [status, setStatus] = useState<BookingStatus>(initialStatus);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (status === "Issued" || status === "Cancelled") return;

    const timer = window.setInterval(() => {
      setStatus((prev) => getNextStatus(prev));
    }, 4500);

    return () => window.clearInterval(timer);
  }, [status]);

  const qrData = useMemo(
    () =>
      Array.from({ length: 121 }, (_, i) => {
        const seed = (i * 17 + 31) % 9;
        return seed === 0 || seed === 3 || seed === 5;
      }),
    [],
  );

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
              <p className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700"><QrCode className="h-4 w-4" /> QR Code</p>
              <div className="mx-auto w-fit rounded-xl bg-white p-2">
                <div className="grid grid-cols-11 gap-0.5">
                  {qrData.map((filled, index) => (
                    <div key={index} className={`h-2.5 w-2.5 ${filled ? "bg-slate-900" : "bg-white"}`} />
                  ))}
                </div>
              </div>
            </div>

            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
            >
              <Download className="h-4 w-4" /> Download PDF
            </a>

            <p className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-xs text-slate-600">
              Note: tombol Download PDF membuka file boarding pass dari penyimpanan Minio (simulasi), dan status akan berubah otomatis sampai Issued.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
