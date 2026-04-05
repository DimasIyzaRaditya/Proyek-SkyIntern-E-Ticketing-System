"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CameraOff, Search, QrCode, AlertCircle } from "lucide-react";
import AdminShell from "@/components/AdminShell";

type ScanState = "idle" | "starting" | "running" | "error";

type ScannerInstance = {
  stop: () => Promise<void>;
  clear: () => Promise<void> | void;
};

const extractBookingCode = (rawText: string): string | null => {
  const value = rawText.trim();
  if (!value) return null;

  // 1) Direct booking code, e.g. "ABC123"
  if (/^[A-Z0-9]{6,16}$/i.test(value)) {
    return value.toUpperCase();
  }

  // 2) Full/partial URL containing ?code=
  try {
    const asUrl = new URL(value);
    const code = asUrl.searchParams.get("code");
    if (code) return code.toUpperCase();
  } catch {
    // Not a valid URL, continue to regex fallback
  }

  // 3) Fallback parse for string fragments that contain code=...
  const match = value.match(/[?&]code=([A-Za-z0-9_-]+)/);
  if (match?.[1]) {
    return match[1].toUpperCase();
  }

  return null;
};

export default function AdminScanPage() {
  const router = useRouter();
  const scannerRegionId = useMemo(() => "admin-qr-scanner-region", []);
  const scannerRef = useRef<ScannerInstance | null>(null);
  const startedRef = useRef(false);
  const navigatingRef = useRef(false);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [errorText, setErrorText] = useState("");
  const [lastRawResult, setLastRawResult] = useState("");
  const [manualCode, setManualCode] = useState("");

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current && startedRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch {
      // ignore cleanup errors
    } finally {
      startedRef.current = false;
    }
  }, []);

  const goToVerify = useCallback(async (rawValue: string) => {
    const bookingCode = extractBookingCode(rawValue);
    setLastRawResult(rawValue);

    if (!bookingCode) {
      setErrorText("QR terdeteksi, tapi kode booking tidak ditemukan.");
      return;
    }

    if (navigatingRef.current) return;
    navigatingRef.current = true;

    await stopScanner();
    router.push(`/bookings/verify?code=${encodeURIComponent(bookingCode)}`);
  }, [router, stopScanner]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setScanState("starting");
      setErrorText("");

      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!isMounted) return;

        const scanner = new Html5Qrcode(scannerRegionId, { verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText: string) => {
            void goToVerify(decodedText);
          },
          () => {
            // ignore frame-level decode failures
          },
        );

        if (!isMounted) {
          await stopScanner();
          return;
        }

        startedRef.current = true;
        setScanState("running");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Tidak bisa mengakses kamera. Izinkan akses kamera lalu coba lagi.";

        setScanState("error");
        setErrorText(message);
      }
    };

    void init();

    return () => {
      isMounted = false;
      void stopScanner();
    };
  }, [goToVerify, scannerRegionId, stopScanner]);

  const submitManualCode = () => {
    const code = manualCode.trim();
    if (!code) {
      setErrorText("Masukkan kode booking terlebih dahulu.");
      return;
    }

    void goToVerify(code);
  };

  return (
    <AdminShell
      title="Scan QR E-Ticket"
      description="Arahkan kamera ke QR e-ticket. Setelah kode terbaca, halaman verifikasi booking akan terbuka otomatis."
    >
      <section className="page-enter rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-800">
          <QrCode className="h-4 w-4" />
          Scanner Kamera Admin
        </div>

        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-slate-50">
          <div id={scannerRegionId} className="min-h-80 w-full" />
        </div>

        <div className="mt-4 space-y-3">
          {scanState === "starting" && (
            <p className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              <Camera className="h-4 w-4" />
              Menyalakan kamera...
            </p>
          )}

          {scanState === "running" && (
            <p className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <Camera className="h-4 w-4" />
              Kamera aktif. Arahkan ke QR code e-ticket.
            </p>
          )}

          {scanState === "error" && (
            <p className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <CameraOff className="h-4 w-4" />
              Kamera gagal aktif.
            </p>
          )}

          {errorText && (
            <p className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertCircle className="h-4 w-4" />
              {errorText}
            </p>
          )}

          {lastRawResult && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Hasil scan terakhir</p>
              <p className="mt-1 break-all text-xs text-slate-700">{lastRawResult}</p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-sm font-bold text-slate-900">Input Manual Kode Booking</h2>
        <p className="mt-1 text-xs text-slate-600">
          Jika kamera tidak tersedia, masukkan kode booking atau URL QR secara manual.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Contoh: ABC123 atau URL verify"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
          />
          <button
            type="button"
            onClick={submitManualCode}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Search className="h-4 w-4" />
            Verifikasi
          </button>
        </div>
      </section>
    </AdminShell>
  );
}
