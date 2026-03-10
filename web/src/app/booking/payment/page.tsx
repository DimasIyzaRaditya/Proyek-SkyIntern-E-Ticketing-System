"use client";

import Script from "next/script";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import MainNav from "@/components/MainNav";
import { formatRupiah } from "@/lib/currency";
import { isAuthenticated } from "@/lib/auth";
import { getFlightDetailFromApi, type FlightCardItem } from "@/lib/flight-api";
import { createBookingFromApi, createPaymentFromApi, cancelBookingFromApi } from "@/lib/booking-api";

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

const COUNTDOWN_DURATION = 15 * 60;

function PaymentSummaryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [paid, setPaid] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [pendingSnapToken, setPendingSnapToken] = useState<string | null>(null);
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string | null>(null);
  const [snapClosed, setSnapClosed] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [bookingIdForPayment, setBookingIdForPayment] = useState<number | null>(null);
  const [changingMethod, setChangingMethod] = useState(false);
  const [flight, setFlight] = useState<FlightCardItem | null>(null);
  const [isLoadingFlight, setIsLoadingFlight] = useState(true);
  const [flightError, setFlightError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(true);

  const flightId = searchParams.get("flightId") ?? "";
  const existingBookingId = searchParams.get("existingBookingId") ?? "";
  const adult = Number(searchParams.get("adult") ?? "1");
  const child = Number(searchParams.get("child") ?? "0");
  const extraPrice = Number(searchParams.get("extraPrice") ?? "0");

  const fallbackFlight = useMemo<FlightCardItem>(() => ({
    id: flightId || "-",
    flightNumber: (searchParams.get("flightNumber") ?? flightId) || "-",
    airline: searchParams.get("airlineName") ?? "Airline",
    logo: "✈️",
    aircraft: "Aircraft",
    origin: searchParams.get("origin") ?? "Origin",
    destination: searchParams.get("destination") ?? "Destination",
    departureTime: "-",
    arrivalTime: "-",
    duration: "-",
    price: Number(searchParams.get("price") ?? "0"),
    basePrice: Number(searchParams.get("price") ?? "0"),
    tax: 0,
    adminFee: 0,
    facilities: ["Cabin Bag 7kg"],
  }), [flightId, searchParams]);

  useEffect(() => {
    let isMounted = true;

    const loadFlight = async () => {
      if (!flightId) {
        setFlight(fallbackFlight);
        setIsLoadingFlight(false);
        return;
      }

      try {
        setIsLoadingFlight(true);
        setFlightError(null);
        const data = await getFlightDetailFromApi(flightId);
        if (!isMounted) return;
        setFlight(data);
      } catch (error) {
        if (!isMounted) return;
        setFlight(fallbackFlight);
        setFlightError(error instanceof Error ? error.message : "Gagal memuat data flight dari backend.");
      } finally {
        if (isMounted) {
          setIsLoadingFlight(false);
        }
      }
    };

    loadFlight();

    return () => {
      isMounted = false;
    };
  }, [fallbackFlight, flightId]);

  const activeFlight = flight ?? fallbackFlight;

  const ticketPrice = activeFlight.basePrice * adult + Math.round(activeFlight.basePrice * 0.75 * child);
  const tax = activeFlight.tax;
  const adminFee = activeFlight.adminFee;
  const totalPrice = ticketPrice + tax + adminFee + extraPrice;

  // Fix hydration: read auth state only on client
  useEffect(() => {
    const auth = isAuthenticated();
    setAuthenticated(auth);
    if (!auth) {
      const redirect = encodeURIComponent(`/booking/payment?${searchParams.toString()}`);
      router.replace(`/auth/login?redirect=${redirect}`);
    }
  }, [router, searchParams]);

  // Persist countdown across refreshes using localStorage
  // Key is tied to existingBookingId if editing, otherwise flightId
  const countdownKey = `payment_start_${existingBookingId || flightId || "unknown"}`;
  useEffect(() => {
    const stored = localStorage.getItem(countdownKey);
    if (stored) {
      const elapsed = Math.floor((Date.now() - Number(stored)) / 1000);
      const remaining = Math.max(0, COUNTDOWN_DURATION - elapsed);
      setCountdown(remaining);
    } else {
      localStorage.setItem(countdownKey, String(Date.now()));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdownKey]);

  // Auto-cancel booking when countdown expires
  useEffect(() => {
    if (countdown !== 0 || paid || paymentPending) return;
    const idToCancel = bookingIdForPayment ?? (existingBookingId ? Number(existingBookingId) : null);
    if (!idToCancel) return;
    cancelBookingFromApi(idToCancel).catch(() => { /* silent – backend also auto-expires */ });
    localStorage.removeItem(countdownKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  useEffect(() => {
    if (paid) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.removeItem(countdownKey);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid]);

  const countdownText = `${Math.floor(countdown / 60)
    .toString()
    .padStart(2, "0")}:${(countdown % 60).toString().padStart(2, "0")}`;

  const openSnap = (token: string, fallbackUrl: string | null) => {
    if (typeof window !== "undefined" && window.snap) {
      window.snap.pay(token, {
        onSuccess: () => {
          // Actual payment confirmed
          setPaid(true);
          setPaymentPending(false);
          setPendingSnapToken(null);
          localStorage.removeItem(countdownKey);
          setTimeout(() => router.push("/bookings?status=success"), 800);
        },
        onPending: () => {
          // Async payment initiated (GoPay QR shown, VA number shown, etc.)
          // Token is now consumed — do NOT reopen popup, just show waiting state
          setPaymentPending(true);
          setPendingSnapToken(null);
          setPendingRedirectUrl(null);
          setSnapClosed(false);
          localStorage.removeItem(countdownKey);
        },
        onError: () => {
          // Token consumed — clear so user can start fresh
          setPendingSnapToken(null);
          setPendingRedirectUrl(null);
          setSnapClosed(false);
          setPaymentPending(false);
          setBookingError("Pembayaran gagal. Silakan coba lagi.");
        },
        onClose: () => {
          // Popup closed before choosing / before paying — token still valid, allow resume
          setSnapClosed(true);
        },
      });
    } else if (fallbackUrl) {
      window.location.href = fallbackUrl;
    } else {
      setBookingError("Gagal memuat gateway pembayaran. Coba refresh halaman.");
    }
  };

  const handleChangePaymentMethod = async () => {
    if (!bookingIdForPayment) return;
    setChangingMethod(true);
    setBookingError(null);
    try {
      const paymentResult = await createPaymentFromApi(bookingIdForPayment);
      const snapToken = paymentResult.payment?.snapToken;
      const redirectUrl = paymentResult.payment?.redirectUrl ?? null;
      setPaymentPending(false);
      if (snapToken) {
        setPendingSnapToken(snapToken);
        setPendingRedirectUrl(redirectUrl);
        openSnap(snapToken, redirectUrl);
      } else if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        setBookingError("Gagal memuat gateway pembayaran.");
      }
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Gagal memuat ulang pembayaran.");
    } finally {
      setChangingMethod(false);
    }
  };

  const handlePayNow = async () => {
    setBookingError(null);
    setSnapClosed(false);

    // Resume existing pending payment without creating a new booking
    if (pendingSnapToken) {
      openSnap(pendingSnapToken, pendingRedirectUrl);
      return;
    }

    setBookingLoading(true);

    try {
      let bookingId: number;

      if (existingBookingId) {
        // Editing flow: reuse the existing booking, skip createBooking
        bookingId = Number(existingBookingId);
        setBookingIdForPayment(bookingId);
      } else {
        // New booking flow
        const adultCount = adult;
        const childCount = child;
        const totalPassengers = Math.max(1, adultCount + childCount);

        const buildPassengers = () => {
          const passengers = [];
          const firstName = searchParams.get("pFirstName") ?? "Passenger";
          const lastName = searchParams.get("pLastName") ?? "";
          const title = searchParams.get("pTitle") ?? "Mr";
          const documentType = searchParams.get("pIdType") || "KTP";
          const documentNumber = searchParams.get("pIdNumber") || "0000000000000000";
          const nationality = searchParams.get("pNationality") ?? "Indonesian";
          const dob = searchParams.get("pDob") ?? undefined;

          for (let i = 0; i < adultCount; i++) {
            passengers.push({
              type: "ADULT" as const,
              title,
              firstName: i === 0 ? firstName : `${firstName}${i + 1}`,
              lastName,
              documentType,
              documentNumber: i === 0 ? documentNumber : `${documentNumber}${i}`,
              nationality,
              dateOfBirth: dob,
            });
          }
          for (let i = 0; i < childCount; i++) {
            passengers.push({
              type: "CHILD" as const,
              title: "Ms",
              firstName: `Child${i + 1}`,
              lastName,
              documentType,
              documentNumber: `${documentNumber}C${i}`,
              nationality,
            });
          }
          return passengers.slice(0, Math.max(1, totalPassengers));
        };

        // Ambil FlightSeat IDs dari URL (dikirim oleh halaman seat selection)
        const seatFlightIdsParam = searchParams.get("seatFlightIds") ?? "";
        const seatIds = seatFlightIdsParam
          ? seatFlightIdsParam.split(",").map(Number).filter((n) => !isNaN(n) && n > 0)
          : [];

        const bookingResult = await createBookingFromApi({
          flightId: Number(flightId),
          passengers: buildPassengers(),
          seatIds: seatIds.length > 0 ? seatIds : undefined,
        });
        bookingId = bookingResult.booking.id;
        setBookingIdForPayment(bookingId);
      }

      // Create Midtrans payment and get Snap token
      const paymentResult = await createPaymentFromApi(bookingId);
      const snapToken = paymentResult.payment?.snapToken;
      const redirectUrl = paymentResult.payment?.redirectUrl ?? null;

      if (snapToken) {
        setPendingSnapToken(snapToken);
        setPendingRedirectUrl(redirectUrl);
      }

      setBookingLoading(false);

      if (snapToken && typeof window !== "undefined" && window.snap) {
        openSnap(snapToken, redirectUrl);
      } else if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        setBookingError("Gagal memuat gateway pembayaran. Coba refresh halaman.");
      }
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Gagal membuat booking. Silakan coba lagi.");
      setBookingLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
        <MainNav />
      </div>
    );
  }

  if (isLoadingFlight) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
        <MainNav />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <section className="rounded-3xl border border-blue-100 bg-white p-8 text-sm text-slate-600 shadow-lg">
            Memuat ringkasan penerbangan dari backend...
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <Script
        src={
          process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
            ? "https://app.midtrans.com/snap/snap.js"
            : "https://app.sandbox.midtrans.com/snap/snap.js"
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />
      <MainNav />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <section className="rounded-3xl border border-blue-100 bg-white p-8 shadow-lg">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-black text-slate-900">Ringkasan Pembayaran</h1>
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-mono text-xl font-bold text-red-600">{countdownText}</div>
          </div>

          <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            {flightError && <p className="text-xs text-amber-700">{flightError}</p>}
            <div className="flex justify-between text-sm"><span>Ticket Price</span><span>{formatRupiah(ticketPrice)}</span></div>
            <div className="flex justify-between text-sm"><span>Tax</span><span>{formatRupiah(tax)}</span></div>
            <div className="flex justify-between text-sm"><span>Admin Fee</span><span>{formatRupiah(adminFee)}</span></div>
            <div className="flex justify-between text-sm"><span>Seat Extra</span><span>{formatRupiah(extraPrice)}</span></div>
            <div className="flex justify-between border-t border-blue-200 pt-3 text-lg font-bold text-blue-700"><span>Total Price</span><span>{formatRupiah(totalPrice)}</span></div>
          </div>



          {bookingError && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {bookingError}
            </div>
          )}

          {snapClosed && pendingSnapToken && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Popup ditutup sebelum pembayaran selesai. Klik tombol di bawah untuk kembali memilih metode pembayaran.
            </div>
          )}

          {paymentPending && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-sm font-semibold text-blue-800">Menunggu konfirmasi pembayaran</p>
              <p className="mt-1 text-xs text-blue-700">
                Instruksi pembayaran sudah dikirim (mis. QR GoPay atau nomor Virtual Account). Selesaikan pembayaran di aplikasi Anda, lalu cek status di halaman Booking saya.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {bookingIdForPayment && (
                  <button
                    onClick={() => void handleChangePaymentMethod()}
                    disabled={changingMethod}
                    className="rounded-xl border border-blue-400 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                  >
                    {changingMethod ? "Memuat..." : "Ganti Metode Pembayaran"}
                  </button>
                )}
                <button
                  onClick={() => router.push("/bookings")}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Lihat Booking Saya
                </button>
              </div>
            </div>
          )}

          {!paymentPending && (
            <button
              onClick={() => void handlePayNow()}
              disabled={countdown === 0 || bookingLoading}
              className="mt-4 w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {bookingLoading
                ? "Memproses Booking..."
                : snapClosed && pendingSnapToken
                ? "Kembali Pilih Metode Pembayaran"
                : "Pay Now"}
            </button>
          )}

          {paid && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Pembayaran berhasil dikonfirmasi.
            </div>
          )}
          {countdown === 0 && !paid && !paymentPending && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Waktu pembayaran habis. Silakan ulangi proses booking.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function PaymentSummaryPage() {
  return (
    <Suspense>
      <PaymentSummaryPageContent />
    </Suspense>
  );
}
