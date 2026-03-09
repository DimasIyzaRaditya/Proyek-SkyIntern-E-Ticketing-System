"use client";

import Link from "next/link";
import Script from "next/script";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, Plane, Ticket } from "lucide-react";
import MainNav from "@/components/MainNav";
import { isAuthenticated } from "@/lib/auth";
import { getMyBookingsFromApi, createPaymentFromApi, syncPaymentFromApi } from "@/lib/booking-api";

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

type TabKey = "Upcoming" | "Completed" | "Cancelled";
type BookingStatus = "Pending" | "Processing" | "Paid" | "Cancelled";

type BookingView = {
  id: string;
  airline: string;
  route: string;
  date: string;
  status: BookingStatus;
  seat: string;
  passenger: string;
  flightNumber: string;
  pdfUrl: string;
  tab: TabKey;
  // fields needed for edit links
  flightId: string;
  origin: string;
  destination: string;
  departureDate: string;
  pTitle: string;
  pFirstName: string;
  pLastName: string;
  pIdType: string;
  pIdNumber: string;
  pNationality: string;
};

const getTabByStatus = (status: BookingStatus): TabKey => {
  if (status === "Cancelled") return "Cancelled";
  if (status === "Paid") return "Completed";
  return "Upcoming";
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

function MyBookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("Upcoming");
  const [liveBookings, setLiveBookings] = useState<BookingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSyncPayment = async (bookingId: string) => {
    setSyncingId(bookingId);
    setPayError(null);
    try {
      const result = await syncPaymentFromApi(Number(bookingId));
      if (result.status === "PAID") {
        const bookings = await getMyBookingsFromApi();
        const mapped: BookingView[] = bookings.map((item) => {
          const passenger = item.passengers[0]
            ? `${item.passengers[0].firstName} ${item.passengers[0].lastName}`.trim()
            : "Passenger";
          let status: BookingStatus = "Pending";
          if (item.status === "CANCELLED" || item.status === "EXPIRED") status = "Cancelled";
          else if (item.ticket) status = "Paid";
          else if (item.status === "PAID") status = "Processing";
          return {
            id: String(item.id),
            airline: item.flight.airline.name,
            route: `${item.flight.origin.code ?? item.flight.origin.city} → ${item.flight.destination.code ?? item.flight.destination.city}`,
            date: formatDate(item.flight.departureTime),
            status,
            seat: "-",
            passenger,
            flightNumber: item.flight.flightNumber,
            pdfUrl: item.ticket?.pdfUrl ?? "",
            tab: getTabByStatus(status),
            flightId: String(item.flightId),
            origin: item.flight.origin.code ?? item.flight.origin.city,
            destination: item.flight.destination.code ?? item.flight.destination.city,
            departureDate: item.flight.departureTime.slice(0, 10),
            pTitle: item.passengers[0]?.title ?? "Mr",
            pFirstName: item.passengers[0]?.firstName ?? "Passenger",
            pLastName: item.passengers[0]?.lastName ?? "",
            pIdType: item.passengers[0]?.documentType ?? "KTP",
            pIdNumber: item.passengers[0]?.documentNumber ?? "",
            pNationality: item.passengers[0]?.nationality ?? "Indonesian",
          };
        });
        setLiveBookings(mapped);
        setActiveTab("Upcoming");
      } else if (result.status === "CANCELLED") {
        setLiveBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId
              ? { ...b, status: "Cancelled" as BookingStatus, tab: "Cancelled" as TabKey }
              : b
          )
        );
        setActiveTab("Cancelled");
      } else {
        // PENDING: belum bayar atau masih menunggu konfirmasi
        setPayError(result.message ?? "Pembayaran belum dikonfirmasi. Coba lagi setelah menyelesaikan pembayaran.");
      }
    } catch (error) {
      setPayError(error instanceof Error ? error.message : "Gagal cek status pembayaran.");
    } finally {
      setSyncingId(null);
    }
  };

  const handlePayBooking = async (bookingId: string) => {
    setPayingId(bookingId);
    setPayError(null);
    try {
      const result = await createPaymentFromApi(Number(bookingId));
      const snapToken = result.payment?.snapToken;
      const redirectUrl = result.payment?.redirectUrl;

      const reloadBookings = async () => {
        try {
          const bookings = await getMyBookingsFromApi();
          const mapped: BookingView[] = bookings.map((item) => {
            const passenger = item.passengers[0]
              ? `${item.passengers[0].firstName} ${item.passengers[0].lastName}`.trim()
              : "Passenger";
            let status: BookingStatus = "Pending";
            if (item.status === "CANCELLED" || item.status === "EXPIRED") status = "Cancelled";
            else if (item.ticket) status = "Paid";
            else if (item.status === "PAID") status = "Processing";
            return {
              id: String(item.id),
              airline: item.flight.airline.name,
              route: `${item.flight.origin.code ?? item.flight.origin.city} → ${item.flight.destination.code ?? item.flight.destination.city}`,
              date: formatDate(item.flight.departureTime),
              status,
              seat: "-",
              passenger,
              flightNumber: item.flight.flightNumber,
              pdfUrl: item.ticket?.pdfUrl ?? "",
              tab: getTabByStatus(status),
              flightId: String(item.flightId),
              origin: item.flight.origin.code ?? item.flight.origin.city,
              destination: item.flight.destination.code ?? item.flight.destination.city,
              departureDate: item.flight.departureTime.slice(0, 10),
              pTitle: item.passengers[0]?.title ?? "Mr",
              pFirstName: item.passengers[0]?.firstName ?? "Passenger",
              pLastName: item.passengers[0]?.lastName ?? "",
              pIdType: item.passengers[0]?.documentType ?? "KTP",
              pIdNumber: item.passengers[0]?.documentNumber ?? "",
              pNationality: item.passengers[0]?.nationality ?? "Indonesian",
            };
          });
          setLiveBookings(mapped);
        } catch { /* silent */ }
      };

      if (snapToken && typeof window !== "undefined" && window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: () => void reloadBookings(),
          onPending: () => void reloadBookings(),
          onError: () => setPayError("Pembayaran gagal. Silakan coba lagi."),
          onClose: () => { /* token still valid, user can retry */ },
        });
      } else if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        setPayError("Gagal memuat gateway pembayaran.");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      const isExpired =
        msg.toLowerCase().includes("kedaluwarsa") ||
        msg.toLowerCase().includes("expired");
      if (isExpired) {
        setLiveBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId
              ? { ...b, status: "Cancelled" as BookingStatus, tab: "Cancelled" as TabKey }
              : b
          )
        );
        setActiveTab("Cancelled");
      } else {
        setPayError(msg || "Gagal memuat pembayaran.");
      }
    } finally {
      setPayingId(null);
    }
  };

  const dynamicBooking = useMemo<BookingView | null>(() => {
    const flightNumber = searchParams.get("flightNumber");
    if (!flightNumber) return null;

    const origin = searchParams.get("origin") ?? "CGK";
    const destination = searchParams.get("destination") ?? "DPS";
    const departureDate = searchParams.get("departureDate") ?? "2026-03-15";

    return {
      id: `BK-${flightNumber}-${departureDate}-${origin}-${destination}`,
      airline: searchParams.get("airline") ?? "SkyIntern Airline",
      route: `${origin} → ${destination}`,
      date: departureDate,
      status: "Paid",
      seat: searchParams.get("seat") ?? "12A",
      passenger: searchParams.get("fullName") ?? "Passenger",
      flightNumber,
      pdfUrl: searchParams.get("pdfUrl") ?? `https://minio.skyintern.local/e-ticket/${flightNumber}.pdf`,
      tab: "Upcoming",
      flightId: "",
      origin,
      destination,
      departureDate,
      pTitle: "Mr",
      pFirstName: searchParams.get("fullName")?.split(" ")[0] ?? "Passenger",
      pLastName: searchParams.get("fullName")?.split(" ").slice(1).join(" ") ?? "",
      pIdType: "KTP",
      pIdNumber: "",
      pNationality: "Indonesian",
    };
  }, [searchParams]);

  useEffect(() => {
    const auth = isAuthenticated();
    setAuthenticated(auth);
  }, []);

  useEffect(() => {
    if (authenticated === null) return;
    if (!authenticated) {
      const redirect = encodeURIComponent(`/bookings?${searchParams.toString()}`);
      router.replace(`/auth/login?redirect=${redirect}`);
      return;
    }

    const loadBookings = async () => {
      setLoading(true);
      setMessage("");

      try {
        const bookings = await getMyBookingsFromApi();
        const mapped: BookingView[] = bookings.map((item) => {
          const passenger = item.passengers[0]
            ? `${item.passengers[0].firstName} ${item.passengers[0].lastName}`.trim()
            : "Passenger";

          let status: BookingStatus = "Pending";
          if (item.status === "CANCELLED" || item.status === "EXPIRED") {
            status = "Cancelled";
          } else if (item.ticket) {
            status = "Paid";
          } else if (item.status === "PAID") {
            status = "Processing";
          }

          return {
            id: String(item.id),
            airline: item.flight.airline.name,
            route: `${item.flight.origin.code ?? item.flight.origin.city} → ${item.flight.destination.code ?? item.flight.destination.city}`,
            date: formatDate(item.flight.departureTime),
            status,
            seat: "-",
            passenger,
            flightNumber: item.flight.flightNumber,
            pdfUrl: item.ticket?.pdfUrl ?? "",
            tab: getTabByStatus(status),
            flightId: String(item.flightId),
            origin: item.flight.origin.code ?? item.flight.origin.city,
            destination: item.flight.destination.code ?? item.flight.destination.city,
            departureDate: item.flight.departureTime.slice(0, 10),
            pTitle: item.passengers[0]?.title ?? "Mr",
            pFirstName: item.passengers[0]?.firstName ?? "Passenger",
            pLastName: item.passengers[0]?.lastName ?? "",
            pIdType: item.passengers[0]?.documentType ?? "KTP",
            pIdNumber: item.passengers[0]?.documentNumber ?? "",
            pNationality: item.passengers[0]?.nationality ?? "Indonesian",
          };
        });

        const merged = dynamicBooking ? [dynamicBooking, ...mapped] : mapped;
        const uniqueBookings = new Map<string, BookingView>();
        for (const booking of merged) {
          uniqueBookings.set(booking.id, booking);
        }

        setLiveBookings(Array.from(uniqueBookings.values()));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Gagal memuat data booking.");
      } finally {
        setLoading(false);
      }
    };

    void loadBookings();
  }, [authenticated, dynamicBooking, router, searchParams]);

  const bookingList = useMemo(
    () => liveBookings.filter((item) => item.tab === activeTab),
    [activeTab, liveBookings],
  );

  const getStatusClass = (status: BookingStatus) => {
    if (status === "Paid") return "bg-emerald-100 text-emerald-700";
    if (status === "Processing") return "bg-blue-100 text-blue-700";
    if (status === "Cancelled") return "bg-rose-100 text-rose-700";
    return "bg-amber-100 text-amber-700";
  };

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
        <MainNav />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
        <MainNav />
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
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="inline-flex items-center gap-2 text-3xl font-black text-slate-900">
          <Ticket className="h-7 w-7 text-blue-700" /> My Bookings Page
        </h1>
        {message && <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p>}
        {payError && <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{payError}</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          {(["Upcoming", "Completed", "Cancelled"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "border border-blue-100 bg-white text-slate-700 hover:bg-blue-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <section className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-blue-100 bg-white p-8 text-center text-sm text-slate-500">
              Memuat booking...
            </div>
          ) : bookingList.length === 0 ? (
            <div className="rounded-2xl border border-blue-100 bg-white p-8 text-center text-sm text-slate-500">
              Tidak ada booking pada tab {activeTab}.
            </div>
          ) : (
            bookingList.map((booking) => {
              const query = new URLSearchParams({
                passenger: booking.passenger,
                flightNumber: booking.flightNumber,
                seat: booking.seat,
                route: booking.route,
                date: booking.date,
                status: booking.status,
                pdfUrl: booking.pdfUrl,
              });

              return (
                <article key={booking.id} className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="inline-flex items-center gap-2 font-bold text-slate-900">
                        <Plane className="h-4 w-4 text-blue-700" /> {booking.airline}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{booking.route}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" /> {booking.date}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                        <Clock3 className="h-3.5 w-3.5" /> Flight {booking.flightNumber} • Seat {booking.seat}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(booking.status)}`}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> {booking.status}
                      </span>
                      <div className="mt-2 flex flex-wrap justify-end gap-2">
                        {(booking.status === "Pending" || booking.status === "Processing") && (
                          <>
                            <Link
                              href={`/booking/seat?${new URLSearchParams({ flightId: booking.flightId, origin: booking.origin, destination: booking.destination, departureDate: booking.departureDate, flightNumber: booking.flightNumber, existingBookingId: booking.id }).toString()}`}
                              className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                            >
                              Ubah Kursi
                            </Link>
                            <Link
                              href={`/booking/passenger?${new URLSearchParams({ flightId: booking.flightId, origin: booking.origin, destination: booking.destination, departureDate: booking.departureDate, flightNumber: booking.flightNumber, existingBookingId: booking.id, pTitle: booking.pTitle, pFirstName: booking.pFirstName, pLastName: booking.pLastName, pIdType: booking.pIdType, pIdNumber: booking.pIdNumber, pNationality: booking.pNationality }).toString()}`}
                              className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                            >
                              Ubah Data Penumpang
                            </Link>
                            <button
                              onClick={() => void handlePayBooking(booking.id)}
                              disabled={payingId === booking.id}
                              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                              {payingId === booking.id ? "Memuat..." : "Bayar Sekarang"}
                            </button>
                            <button
                              onClick={() => void handleSyncPayment(booking.id)}
                              disabled={syncingId === booking.id}
                              className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                            >
                              {syncingId === booking.id ? "Mengecek..." : "Cek Status Bayar"}
                            </button>
                          </>
                        )}
                        {booking.status === "Paid" ? (
                          <Link
                            href={`/bookings/e-ticket?${query.toString()}`}
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            View E-Ticket
                          </Link>
                        ) : (booking.status !== "Pending" && booking.status !== "Processing") && (
                          <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-500">
                            E-Ticket belum tersedia
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense>
      <MyBookingsPageContent />
    </Suspense>
  );
}
