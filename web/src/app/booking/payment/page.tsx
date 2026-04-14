"use client";

import Script from "next/script";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import MainNav from "@/components/MainNav";
import { formatRupiah } from "@/lib/currency";
import { getAuthToken, isAuthenticated } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api-client";
import { getFlightDetailFromApi, type FlightCardItem } from "@/lib/flight-api";
import { createBookingFromApi, createPaymentFromApi, cancelBookingFromApi, getBookingDetailFromApi, getMyBookingsFromApi, syncPaymentFromApi } from "@/lib/booking-api";

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
const PROMOS_PER_PAGE = 3;

const getRemainingSeconds = (expiresAt?: string | null) => {
  if (!expiresAt) return COUNTDOWN_DURATION;
  const expiresAtMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) return COUNTDOWN_DURATION;
  return Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
};

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
  const [persistedBookingTotalPrice, setPersistedBookingTotalPrice] = useState<number | null>(null);
  const [persistedBreakdown, setPersistedBreakdown] = useState<{
    ticketPrice: number;
    tax: number;
    adminFee: number;
    seatExtra: number;
    promoAmount: number;
  } | null>(null);
  const [persistedSeatDetails, setPersistedSeatDetails] = useState<Array<{ seatNumber: string; additionalPrice: number }>>([]);
  const [changingMethod, setChangingMethod] = useState(false);
  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null);
  const [isPromoSelectionInitialized, setIsPromoSelectionInitialized] = useState(false);
  const [currentPromoPage, setCurrentPromoPage] = useState(1);
  const [flight, setFlight] = useState<FlightCardItem | null>(null);
  const [isLoadingFlight, setIsLoadingFlight] = useState(true);
  const [flightError, setFlightError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(true);

  const flightId = searchParams.get("flightId") ?? "";
  const existingBookingId = searchParams.get("existingBookingId") ?? "";
  const adult = Number(searchParams.get("adult") ?? "1");
  const child = Number(searchParams.get("child") ?? "0");
  const infant = Number(searchParams.get("infant") ?? "0");
  const extraPrice = Number(searchParams.get("extraPrice") ?? "0");
  const promoIdFromQuery = Number(searchParams.get("promoId") ?? "");
  const initialPromoId = Number.isNaN(promoIdFromQuery) ? null : promoIdFromQuery;
  const draftCountdownKey = `payment_draft_start_${flightId || "unknown"}`;
  const selectedSeatNumbersFromQuery = useMemo(
    () => (searchParams.get("seats") ?? "")
      .split(",")
      .map((seat) => seat.trim())
      .filter(Boolean),
    [searchParams],
  );

  const buildPassengersFromQuery = useCallback(() => {
    const passengers = [];
    const adultCount = adult;
    const childCount = child;
    const infantCount = Math.max(0, Math.min(adultCount, infant));
    const totalPassengers = Math.max(1, adultCount + childCount + infantCount);

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
        documentNumber,
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
        documentNumber,
        nationality,
      });
    }

    for (let i = 0; i < infantCount; i++) {
      passengers.push({
        type: "INFANT" as const,
        title: "Inf",
        firstName: `Infant${i + 1}`,
        lastName,
        documentType,
        documentNumber,
        nationality,
        dateOfBirth: dob,
      });
    }

    return passengers.slice(0, Math.max(1, totalPassengers));
  }, [adult, child, infant, searchParams]);

  const getSeatIdsFromQuery = useCallback(() => {
    const seatFlightIdsParam = searchParams.get("seatFlightIds") ?? "";
    return seatFlightIdsParam
      ? seatFlightIdsParam.split(",").map(Number).filter((n) => !isNaN(n) && n > 0)
      : [];
  }, [searchParams]);

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
    promos: [],
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
  const availablePromos = [...(activeFlight.promos ?? [])].sort((a, b) => b.discount - a.discount);

  useEffect(() => {
    setIsPromoSelectionInitialized(false);
  }, [flightId, initialPromoId]);

  useEffect(() => {
    if (isPromoSelectionInitialized) return;
    if (isLoadingFlight) return;

    if (initialPromoId !== null && availablePromos.some((promo) => promo.id === initialPromoId)) {
      setSelectedPromoId(initialPromoId);
    } else {
      setSelectedPromoId(null);
    }

    setIsPromoSelectionInitialized(true);
  }, [availablePromos, initialPromoId, isLoadingFlight, isPromoSelectionInitialized]);

  useEffect(() => {
    if (selectedPromoId == null) return;
    if (!availablePromos.some((promo) => promo.id === selectedPromoId)) {
      setSelectedPromoId(null);
    }
  }, [availablePromos, selectedPromoId]);

  const ticketPrice = activeFlight.basePrice * adult + Math.round(activeFlight.basePrice * 0.75 * child);
  const tax = activeFlight.tax;
  const adminFee = activeFlight.adminFee;
  const subtotalBeforePromo = ticketPrice + tax + adminFee + extraPrice;
  const selectedPromo = selectedPromoId == null
    ? null
    : availablePromos.find((promo) => promo.id === selectedPromoId) ?? null;
  const promoDiscountPercent = selectedPromo?.discount ?? 0;
  const promoAmount = Math.round(subtotalBeforePromo * (promoDiscountPercent / 100));
  const totalPrice = Math.max(0, subtotalBeforePromo - promoAmount);
  const totalPromoPages = Math.max(1, Math.ceil(availablePromos.length / PROMOS_PER_PAGE));
  const promoPageStart = (currentPromoPage - 1) * PROMOS_PER_PAGE;
  const visiblePromos = availablePromos.slice(promoPageStart, promoPageStart + PROMOS_PER_PAGE);
  const hasPromoPagination = availablePromos.length > PROMOS_PER_PAGE;
  const pageNumbers = Array.from({ length: totalPromoPages }, (_, index) => index + 1);
  const hasPromoChanged = selectedPromoId !== initialPromoId;
  const canRecreateWithPromo = !existingBookingId || Boolean(searchParams.get("seatFlightIds"));
  const isPromoLockedBySeatData = Boolean(existingBookingId) && !canRecreateWithPromo;
  const isPromoLockedByPaymentFlow = bookingLoading || paymentPending || paid || Boolean(pendingSnapToken);
  const isPromoSelectionLocked = isPromoLockedBySeatData || isPromoLockedByPaymentFlow;
  const shouldPreviewNewPromo = Boolean(existingBookingId) && hasPromoChanged && canRecreateWithPromo;
  const usePersistedPrice = Boolean(existingBookingId) && persistedBookingTotalPrice != null && !shouldPreviewNewPromo;
  const displayedTotalPrice = usePersistedPrice ? persistedBookingTotalPrice : totalPrice;

  useEffect(() => {
    if (currentPromoPage > totalPromoPages) {
      setCurrentPromoPage(totalPromoPages);
    }
  }, [currentPromoPage, totalPromoPages]);

  // Fix hydration: read auth state only on client
  useEffect(() => {
    const auth = isAuthenticated();
    setAuthenticated(auth);
    if (!auth) {
      const redirect = encodeURIComponent(`/booking/payment?${searchParams.toString()}`);
      router.replace(`/auth/login?redirect=${redirect}`);
    }
  }, [router, searchParams]);

  useEffect(() => {
    let isMounted = true;

    const syncCountdownFromBooking = async (bookingId: number) => {
      const detail = await getBookingDetailFromApi(bookingId);
      if (!isMounted) return;
      setBookingIdForPayment(bookingId);
      setPersistedBookingTotalPrice(detail.booking.totalPrice);

      const status = detail.booking.status;
      if (status === "PAID") {
        setPaid(true);
        setPaymentPending(false);
        setBookingError(null);
        const params = new URLSearchParams({ status: "success", bookingId: String(bookingId) });
        setTimeout(() => {
          router.replace(`/bookings?${params.toString()}`);
        }, 300);
        return;
      }

      const passengerCount = Math.max(1, detail.booking.passengers?.length ?? 1);
      const flightBasePrice = detail.booking.flight.basePrice ?? 0;
      const ticketPriceSaved = flightBasePrice * passengerCount;
      const taxSaved = detail.booking.flight.tax ?? 0;
      const adminFeeSaved = detail.booking.flight.adminFee ?? 0;
      const seatExtraSaved = (detail.booking.flightSeats ?? []).reduce(
        (sum, seat) => sum + (seat.additionalPrice ?? 0),
        0,
      );
      const seatDetailsSaved = (detail.booking.flightSeats ?? [])
        .map((seat) => ({
          seatNumber: seat.seat?.seatNumber ?? "-",
          additionalPrice: seat.additionalPrice ?? 0,
        }))
        .sort((a, b) => a.seatNumber.localeCompare(b.seatNumber));
      const rawSaved = ticketPriceSaved + taxSaved + adminFeeSaved + seatExtraSaved;
      const promoSaved = Math.max(0, rawSaved - detail.booking.totalPrice);

      setPersistedBreakdown({
        ticketPrice: ticketPriceSaved,
        tax: taxSaved,
        adminFee: adminFeeSaved,
        seatExtra: seatExtraSaved,
        promoAmount: promoSaved,
      });
      setPersistedSeatDetails(seatDetailsSaved);

      if (status === "CANCELLED" || status === "EXPIRED") {
        setCountdown(0);
        return;
      }
      setCountdown(getRemainingSeconds(detail.booking.expiresAt ?? null));
    };

    const loadCountdown = async () => {
      if (!existingBookingId) {
        try {
          const bookings = await getMyBookingsFromApi();
          if (!isMounted) return;

          const pendingSameFlight = bookings
            .filter((item) => item.status === "PENDING" && String(item.flightId) === String(flightId))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

          if (pendingSameFlight) {
            await syncCountdownFromBooking(pendingSameFlight.id);
            const nextParams = new URLSearchParams(searchParams.toString());
            nextParams.set("existingBookingId", String(pendingSameFlight.id));
            router.replace(`/booking/payment?${nextParams.toString()}`);
            return;
          }

          // Belum ada booking pending untuk user+flight ini -> buat draft booking
          // agar langsung muncul di halaman My Bookings meskipun user belum klik bayar.
          if (flightId) {
            const seatIds = getSeatIdsFromQuery();
            const draft = await createBookingFromApi({
              flightId: Number(flightId),
              passengers: buildPassengersFromQuery(),
              seatIds: seatIds.length > 0 ? seatIds : undefined,
              promoId: selectedPromoId ?? undefined,
            });

            if (!isMounted) return;

            await syncCountdownFromBooking(draft.booking.id);
            localStorage.removeItem(draftCountdownKey);
            const nextParams = new URLSearchParams(searchParams.toString());
            nextParams.set("existingBookingId", String(draft.booking.id));
            router.replace(`/booking/payment?${nextParams.toString()}`);
            return;
          }
        } catch {
          // fallback to local draft timer below
        }

        const stored = localStorage.getItem(draftCountdownKey);
        if (stored) {
          const elapsed = Math.floor((Date.now() - Number(stored)) / 1000);
          const remaining = Math.max(0, COUNTDOWN_DURATION - elapsed);
          setCountdown(remaining);
        } else {
          localStorage.setItem(draftCountdownKey, String(Date.now()));
          setCountdown(COUNTDOWN_DURATION);
        }
        return;
      }

      try {
        const bookingId = Number(existingBookingId);
        if (Number.isNaN(bookingId)) return;
        await syncCountdownFromBooking(bookingId);
      } catch {
        if (!isMounted) return;
        // fallback: keep default countdown
      }
    };

    void loadCountdown();
    return () => {
      isMounted = false;
    };
  }, [buildPassengersFromQuery, draftCountdownKey, existingBookingId, flightId, getSeatIdsFromQuery, router, searchParams, selectedPromo?.id]);

  // Auto-cancel booking when countdown expires
  useEffect(() => {
    if (countdown !== 0 || paid || paymentPending) return;
    const idToCancel = bookingIdForPayment ?? (existingBookingId ? Number(existingBookingId) : null);
    if (!idToCancel) {
      localStorage.removeItem(draftCountdownKey);
      return;
    }
    cancelBookingFromApi(idToCancel).catch(() => { /* silent – backend also auto-expires */ });
  }, [bookingIdForPayment, countdown, draftCountdownKey, existingBookingId, paid, paymentPending]);

  useEffect(() => {
    if (paid) return;
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paid, countdown]);

  const countdownText = `${Math.floor(countdown / 60)
    .toString()
    .padStart(2, "0")}:${(countdown % 60).toString().padStart(2, "0")}`;

  const handlePaidConfirmed = useCallback((bookingId: number) => {
    setPaid(true);
    setPaymentPending(false);
    setPendingSnapToken(null);
    setPendingRedirectUrl(null);
    setBookingError(null);
    localStorage.removeItem(draftCountdownKey);
    const params = new URLSearchParams({ status: "success", bookingId: String(bookingId) });
    setTimeout(() => router.replace(`/bookings?${params.toString()}`), 500);
  }, [draftCountdownKey, router]);

  useEffect(() => {
    if (!authenticated || !bookingIdForPayment || paid || countdown === 0) return;

    const interval = setInterval(() => {
      void syncPaymentFromApi(bookingIdForPayment)
        .then((result) => {
          if (result.status === "PAID") {
            handlePaidConfirmed(bookingIdForPayment);
            return;
          }

          if (result.status === "CANCELLED") {
            setPaymentPending(false);
            setPendingSnapToken(null);
            setPendingRedirectUrl(null);
            setCountdown(0);
            setBookingError("Booking sudah dibatalkan atau kedaluwarsa.");
          }
        })
        .catch(() => {
          // Keep silent on periodic sync failures.
        });
    }, 15000);

    return () => clearInterval(interval);
  }, [authenticated, bookingIdForPayment, countdown, handlePaidConfirmed, paid]);

  useEffect(() => {
    if (!authenticated || !bookingIdForPayment) return;
    const token = getAuthToken();
    if (!token) return;

    let cleanup: (() => void) | undefined;

    const initSocket = async () => {
      const { io } = await import("socket.io-client");
      const socket = io(API_BASE_URL, {
        transports: ["websocket"],
        auth: { token },
      });

      socket.on("booking:updated", (payload: { bookingId?: number; status?: string }) => {
        if (!payload?.bookingId || payload.bookingId !== bookingIdForPayment) return;

        if (payload.status === "PAID") {
          handlePaidConfirmed(bookingIdForPayment);
          return;
        }

        if (payload.status === "CANCELLED") {
          setPaymentPending(false);
          setPendingSnapToken(null);
          setPendingRedirectUrl(null);
          setCountdown(0);
          setBookingError("Booking dibatalkan sebelum pembayaran selesai.");
        }
      });

      cleanup = () => socket.disconnect();
    };

    void initSocket();

    return () => {
      if (cleanup) cleanup();
    };
  }, [authenticated, bookingIdForPayment, handlePaidConfirmed]);

  const openSnap = (token: string, fallbackUrl: string | null) => {
    if (typeof window !== "undefined" && window.snap) {
      window.snap.pay(token, {
        onSuccess: () => {
          if (bookingIdForPayment) {
            handlePaidConfirmed(bookingIdForPayment);
          }
        },
        onPending: () => {
          // Async payment initiated (GoPay QR shown, VA number shown, etc.)
          // Token is now consumed — do NOT reopen popup, just show waiting state
          setPaymentPending(true);
          setPendingSnapToken(null);
          setPendingRedirectUrl(null);
          setSnapClosed(false);
          localStorage.removeItem(draftCountdownKey);
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

      const shouldRecreateBookingForPromo = Boolean(bookingIdForPayment) && hasPromoChanged && canRecreateWithPromo;

      if (shouldRecreateBookingForPromo && bookingIdForPayment) {
        await cancelBookingFromApi(bookingIdForPayment).catch(() => {
          // keep flow resilient if auto-cancel fails temporarily
        });

        const seatIds = getSeatIdsFromQuery();
        const recreated = await createBookingFromApi({
          flightId: Number(flightId),
          passengers: buildPassengersFromQuery(),
          seatIds: seatIds.length > 0 ? seatIds : undefined,
          promoId: selectedPromoId ?? undefined,
        });

        bookingId = recreated.booking.id;
        setBookingIdForPayment(bookingId);
        setPersistedBookingTotalPrice(null);
        setPersistedBreakdown(null);
        setPersistedSeatDetails([]);
        setCountdown(getRemainingSeconds(recreated.booking.expiresAt ?? null));

        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set("existingBookingId", String(bookingId));
        if (selectedPromoId != null) {
          nextParams.set("promoId", String(selectedPromoId));
        } else {
          nextParams.delete("promoId");
        }
        router.replace(`/booking/payment?${nextParams.toString()}`);
      } else

      if (bookingIdForPayment) {
        bookingId = bookingIdForPayment;
      } else if (existingBookingId) {
        // Editing flow: reuse the existing booking, skip createBooking
        bookingId = Number(existingBookingId);
        setBookingIdForPayment(bookingId);
      } else {
        // Fallback: jika draft booking belum sempat dibuat otomatis, buat di sini.
        const seatIds = getSeatIdsFromQuery();

        const bookingResult = await createBookingFromApi({
          flightId: Number(flightId),
          passengers: buildPassengersFromQuery(),
          seatIds: seatIds.length > 0 ? seatIds : undefined,
          promoId: selectedPromoId ?? undefined,
        });
        bookingId = bookingResult.booking.id;
        setBookingIdForPayment(bookingId);

        setCountdown(getRemainingSeconds(bookingResult.booking.expiresAt ?? null));
        localStorage.removeItem(draftCountdownKey);

        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set("existingBookingId", String(bookingId));
          if (selectedPromoId != null) {
            nextParams.set("promoId", String(selectedPromoId));
          }
        router.replace(`/booking/payment?${nextParams.toString()}`);
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
      const message = error instanceof Error ? error.message : "Gagal membuat booking. Silakan coba lagi.";
      if (message.toLowerCase().includes("bukan dalam status menunggu")) {
        if (bookingIdForPayment) {
          const params = new URLSearchParams({ status: "success", bookingId: String(bookingIdForPayment) });
          router.replace(`/bookings?${params.toString()}`);
          return;
        }
      }
      setBookingError(message);
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
            Memuat ringkasan penerbangan dari...
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
            <div className={`rounded-xl px-4 py-2 font-mono text-xl font-bold ${
              countdown === 0
                ? "border border-slate-300 bg-slate-100 text-slate-400 line-through"
                : "border border-red-200 bg-red-50 text-red-600"
            }`}>{countdownText}</div>
          </div>

          <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            {availablePromos.length > 0 && countdown > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-white p-3">
                <p className="text-xs font-semibold text-slate-600">Pilih Promo</p>
                <div className="mt-2 space-y-1.5">
                  <label className={`flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs ${isPromoSelectionLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-slate-50"}`}>
                    <span className="font-medium text-slate-700">Tanpa Promo (Harga Normal)</span>
                    <input
                      type="radio"
                      name="payment-promo"
                      checked={selectedPromoId == null}
                      onChange={() => setSelectedPromoId(null)}
                      disabled={isPromoSelectionLocked}
                      className="h-4 w-4"
                    />
                  </label>
                  {visiblePromos.map((promo) => (
                    <label key={promo.id} className={`flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs ${isPromoSelectionLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-slate-50"}`}>
                      <span className="font-medium text-slate-700">{promo.title} ({promo.discount}%)</span>
                      <input
                        type="radio"
                        name="payment-promo"
                        checked={selectedPromoId === promo.id}
                        onChange={() => setSelectedPromoId(promo.id)}
                        disabled={isPromoSelectionLocked}
                        className="h-4 w-4"
                      />
                    </label>
                  ))}
                  {hasPromoPagination && (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPromoPage((prev) => Math.max(1, prev - 1))}
                        disabled={isPromoSelectionLocked || currentPromoPage === 1}
                        className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <div className="flex items-center gap-1">
                        {pageNumbers.map((pageNumber) => (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={() => setCurrentPromoPage(pageNumber)}
                            disabled={isPromoSelectionLocked}
                            className={`h-7 min-w-7 rounded-md border px-2 text-[11px] font-semibold ${
                              currentPromoPage === pageNumber
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentPromoPage((prev) => Math.min(totalPromoPages, prev + 1))}
                        disabled={isPromoSelectionLocked || currentPromoPage === totalPromoPages}
                        className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
                {Boolean(existingBookingId) && hasPromoChanged && canRecreateWithPromo && (
                  <p className="mt-2 text-[11px] text-emerald-700">
                    Promo akan diterapkan ulang saat klik Pay Now.
                  </p>
                )}
              </div>
            )}

            {flightError && <p className="text-xs text-amber-700">{flightError}</p>}

            {usePersistedPrice ? (
              <>
                <div className="flex justify-between text-sm"><span>Ticket Price</span><span>{formatRupiah(persistedBreakdown?.ticketPrice ?? 0)}</span></div>
                <div className="flex justify-between text-sm"><span>Tax</span><span>{formatRupiah(persistedBreakdown?.tax ?? 0)}</span></div>
                <div className="flex justify-between text-sm"><span>Admin Fee</span><span>{formatRupiah(persistedBreakdown?.adminFee ?? 0)}</span></div>
                <div className="flex justify-between text-sm"><span>Seat Extra</span><span>{formatRupiah(persistedBreakdown?.seatExtra ?? 0)}</span></div>
                {persistedSeatDetails.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold text-slate-600">Detail Kursi</p>
                    <div className="mt-2 space-y-1.5">
                      {persistedSeatDetails.map((seat) => (
                        <div key={seat.seatNumber} className="flex justify-between text-xs text-slate-600">
                          <span>Kursi {seat.seatNumber}</span>
                          <span>{seat.additionalPrice > 0 ? formatRupiah(seat.additionalPrice) : "Termasuk"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(persistedBreakdown?.promoAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm font-semibold text-emerald-700">
                    <span>Promo Discount</span>
                    <span>-{formatRupiah(persistedBreakdown?.promoAmount ?? 0)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-blue-200 pt-3 text-lg font-bold text-blue-700"><span>Total Price</span><span>{formatRupiah(displayedTotalPrice)}</span></div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm"><span>Ticket Price</span><span>{formatRupiah(ticketPrice)}</span></div>
                <div className="flex justify-between text-sm"><span>Tax</span><span>{formatRupiah(tax)}</span></div>
                <div className="flex justify-between text-sm"><span>Admin Fee</span><span>{formatRupiah(adminFee)}</span></div>
                <div className="flex justify-between text-sm"><span>Seat Extra</span><span>{formatRupiah(extraPrice)}</span></div>
                {selectedSeatNumbersFromQuery.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold text-slate-600">Detail Kursi</p>
                    <p className="mt-1 text-xs text-slate-600">{selectedSeatNumbersFromQuery.join(", ")}</p>
                  </div>
                )}
                {promoAmount > 0 && (
                  <div className="flex justify-between text-sm font-semibold text-emerald-700">
                    <span>Promo Discount{selectedPromo?.title ? ` (${selectedPromo.title})` : ""} ({promoDiscountPercent}%)</span>
                    <span>-{formatRupiah(promoAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-blue-200 pt-3 text-lg font-bold text-blue-700"><span>Total Price</span><span>{formatRupiah(displayedTotalPrice)}</span></div>
              </>
            )}
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
                    disabled={changingMethod || countdown === 0}
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

          {!paymentPending && !paid && (
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
          {countdown === 0 && !paid && (
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
