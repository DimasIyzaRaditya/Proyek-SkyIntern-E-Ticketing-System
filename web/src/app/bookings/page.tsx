"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { ArrowDownUp, CalendarDays, CheckCircle2, Clock3, Plane, Ticket } from "lucide-react";
import AppPagination from "@/components/AppPagination";
import MainNav from "@/components/MainNav";
import { getAuthToken, isAuthenticated } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api-client";
import { cancelBookingFromApi, getMyBookingsFromApi, getMyBookingsPageFromApi, syncPaymentFromApi } from "@/lib/booking-api";

type TabKey = "Upcoming" | "Completed" | "Cancelled";
type BookingStatus = "Pending" | "Paid" | "Issued" | "Cancelled";

type BookingView = {
  id: string;
  bookingCode: string;
  airline: string;
  airlineLogo?: string;
  route: string;
  date: string;
  status: BookingStatus;
  seat: string;
  passenger: string;
  flightNumber: string;
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
  // e-ticket display fields
  departureIso: string;
  arrivalIso: string;
  originAirportName: string;
  destAirportName: string;
  originCity: string;
  destCity: string;
  totalPriceAmt: number;
  isExpired: boolean;
};

const getTabByStatus = (status: BookingStatus): TabKey => {
  if (status === "Cancelled") return "Cancelled";
  if (status === "Issued") return "Completed";
  return "Upcoming";
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const isTicketExpired = (departureIso: string) => new Date(departureIso).getTime() < Date.now();

const mapBookingToView = (item: Awaited<ReturnType<typeof getMyBookingsFromApi>>[number]): BookingView => {
  const passenger = item.passengers[0]
    ? `${item.passengers[0].firstName} ${item.passengers[0].lastName}`.trim()
    : "Passenger";

  let status: BookingStatus = "Pending";
  if (item.ticket) {
    status = "Issued";
  } else if (item.status === "CANCELLED" || item.status === "EXPIRED") {
    status = "Cancelled";
  } else if (item.status === "PAID") {
    status = "Paid";
  }

  return {
    id: String(item.id),
    bookingCode: item.bookingCode,
    airline: item.flight.airline.name,
    airlineLogo: item.flight.airline.logo ?? "",
    route: `${item.flight.origin.code ?? item.flight.origin.city} → ${item.flight.destination.code ?? item.flight.destination.city}`,
    date: formatDate(item.flight.departureTime),
    status,
    seat: item.selectedSeats ?? "-",
    passenger,
    flightNumber: item.flight.flightNumber,
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
    departureIso: item.flight.departureTime,
    arrivalIso: item.flight.arrivalTime,
    originAirportName: item.flight.origin.name,
    destAirportName: item.flight.destination.name,
    originCity: item.flight.origin.city,
    destCity: item.flight.destination.city,
    totalPriceAmt: item.totalPrice,
    isExpired: isTicketExpired(item.flight.departureTime),
  };
};

function MyBookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("Upcoming");
  const [liveBookings, setLiveBookings] = useState<BookingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelDialogBooking, setCancelDialogBooking] = useState<BookingView | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const statusFilterByTab: Record<TabKey, "Pending" | "Issued" | "Cancelled"> = {
    Upcoming: "Pending",
    Completed: "Issued",
    Cancelled: "Cancelled",
  };

  const refreshBookings = useCallback(async () => {
    const response = await getMyBookingsPageFromApi({
      page: currentPage,
      limit: pageSize,
      statusFilter: statusFilterByTab[activeTab],
      sortDirection: sortOrder === "oldest" ? "asc" : "desc",
    });
    setLiveBookings(response.bookings.map(mapBookingToView));
    setTotalItems(response.pagination.totalItems);
    setTotalPages(response.pagination.totalPages);
    if (response.pagination.page !== currentPage) {
      setCurrentPage(response.pagination.page);
    }
  }, [activeTab, currentPage, pageSize, sortOrder]);

  const handleViewETicket = (booking: BookingView) => {
    const data = {
      passenger: booking.passenger,
      flightNumber: booking.flightNumber,
      seat: booking.seat,
      route: booking.route,
      date: booking.date,
      status: booking.status,
      bookingCode: booking.bookingCode,
      airline: booking.airline,
      airlineLogo: booking.airlineLogo ?? "",
      departureIso: booking.departureIso,
      arrivalIso: booking.arrivalIso,
      originAirportName: booking.originAirportName,
      destAirportName: booking.destAirportName,
      originCity: booking.originCity,
      destCity: booking.destCity,
      pTitle: booking.pTitle,
      pDocType: booking.pIdType,
      pDocNumber: booking.pIdNumber,
      totalPrice: String(booking.totalPriceAmt),
    };
    sessionStorage.setItem(`eticket_${booking.bookingCode}`, JSON.stringify(data));
    router.push(`/bookings/e-ticket/${booking.bookingCode}`);
  };

  const handleSyncPayment = async (bookingId: string) => {
    setSyncingId(bookingId);
    setPayError(null);
    try {
      const result = await syncPaymentFromApi(Number(bookingId));
      if (result.status === "PAID") {
        await refreshBookings();
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
    if (payingId === bookingId) return;
    const booking = liveBookings.find((item) => item.id === bookingId)
    if (!booking) return
    if (booking.status === "Paid" || booking.status === "Issued" || booking.status === "Cancelled") return;

    setPayingId(bookingId);
    setPayError(null);

    try {
      const sync = await syncPaymentFromApi(Number(bookingId));
      if (sync.status === "PAID") {
        await refreshBookings();
        setPayError("Pembayaran booking ini sudah berhasil, tidak perlu bayar ulang.");
        return;
      }

      if (sync.status === "CANCELLED") {
        setLiveBookings((prev) =>
          prev.map((item) =>
            item.id === bookingId
              ? {
                  ...item,
                  status: "Cancelled" as BookingStatus,
                  tab: "Cancelled" as TabKey,
                }
              : item,
          ),
        );
        setPayError("Booking sudah dibatalkan atau kedaluwarsa.");
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal sinkronisasi status pembayaran.";
      // Jika transaksi payment belum dibuat, langsung lanjut ke halaman payment
      // agar user bisa mulai proses bayar tanpa terblokir.
      if (!message.toLowerCase().includes("belum ada transaksi pembayaran")) {
        setPayError(message);
        return;
      }
    } finally {
      setPayingId(null);
    }

    const params = new URLSearchParams({
      existingBookingId: booking.id,
      flightId: booking.flightId,
      origin: booking.origin,
      destination: booking.destination,
      departureDate: booking.departureDate,
      adult: "1",
      child: "0",
      extraPrice: "0",
      pTitle: booking.pTitle,
      pFirstName: booking.pFirstName,
      pLastName: booking.pLastName,
      pIdType: booking.pIdType,
      pIdNumber: booking.pIdNumber,
      pNationality: booking.pNationality,
    })

    router.push(`/booking/payment?${params.toString()}`)
  };

  const openCancelDialog = (bookingId: string) => {
    const booking = liveBookings.find((item) => item.id === bookingId);
    if (!booking) return;
    if (booking.status !== "Pending") return;

    setCancelDialogBooking(booking);
  };

  const handleCancelBooking = async () => {
    if (!cancelDialogBooking) return;
    const bookingId = cancelDialogBooking.id;

    setCancellingId(bookingId);
    setMessage("");
    setPayError(null);

    try {
      await cancelBookingFromApi(Number(bookingId));
      setLiveBookings((prev) =>
        prev.map((item) =>
          item.id === bookingId
            ? {
                ...item,
                status: "Cancelled" as BookingStatus,
                tab: "Cancelled" as TabKey,
              }
            : item,
        ),
      );
      setMessage("Booking berhasil dibatalkan.");
      setActiveTab("Cancelled");
      setCancelDialogBooking(null);
    } catch (error) {
      setPayError(error instanceof Error ? error.message : "Gagal membatalkan booking.");
    } finally {
      setCancellingId(null);
    }
  };

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
        const statusFromQuery = searchParams.get("status");
        const bookingIdFromQuery = searchParams.get("bookingId");

        if (statusFromQuery === "success" && bookingIdFromQuery) {
          try {
            await syncPaymentFromApi(Number(bookingIdFromQuery));
          } catch {
            // Keep UI responsive even if sync endpoint temporarily fails.
          }
        }

        const bookingsResponse = await getMyBookingsPageFromApi({
          page: currentPage,
          limit: pageSize,
          statusFilter: statusFilterByTab[activeTab],
          sortDirection: sortOrder === "oldest" ? "asc" : "desc",
        });
        const mapped: BookingView[] = bookingsResponse.bookings.map((item) => {
          const passenger = item.passengers[0]
            ? `${item.passengers[0].firstName} ${item.passengers[0].lastName}`.trim()
            : "Passenger";

          let status: BookingStatus = "Pending";
          if (item.status === "CANCELLED" || item.status === "EXPIRED") {
            status = "Cancelled";
          } else if (item.ticket) {
            status = "Issued";
          } else if (item.status === "PAID") {
            status = "Paid";
          }

          return {
            id: String(item.id),
            bookingCode: item.bookingCode,
            airline: item.flight.airline.name,
            airlineLogo: item.flight.airline.logo ?? "",
            route: `${item.flight.origin.code ?? item.flight.origin.city} → ${item.flight.destination.code ?? item.flight.destination.city}`,
            date: formatDate(item.flight.departureTime),
            status,
            seat: item.selectedSeats ?? "-",
            passenger,
            flightNumber: item.flight.flightNumber,
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
            departureIso: item.flight.departureTime,
            arrivalIso: item.flight.arrivalTime,
            originAirportName: item.flight.origin.name,
            destAirportName: item.flight.destination.name,
            originCity: item.flight.origin.city,
            destCity: item.flight.destination.city,
            totalPriceAmt: item.totalPrice,
            isExpired: isTicketExpired(item.flight.departureTime),
          };
        });

        setLiveBookings(mapped);
        setTotalItems(bookingsResponse.pagination.totalItems);
        setTotalPages(bookingsResponse.pagination.totalPages);

        if (statusFromQuery === "success") {
          setActiveTab("Upcoming");
          setMessage("Pembayaran berhasil. Booking tampil di tab Upcoming sampai E-Ticket terbit.");
          router.replace("/bookings");
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Gagal memuat data booking.");
      } finally {
        setLoading(false);
      }
    };

    void loadBookings();

    // Poll fallback every 10 seconds for non-websocket updates.
    const pollInterval = setInterval(() => { void loadBookings(); }, 10000);
    return () => clearInterval(pollInterval);
  }, [activeTab, authenticated, currentPage, pageSize, refreshBookings, router, searchParams, sortOrder]);

  useEffect(() => {
    if (!authenticated) return;
    const pendingIds = liveBookings
      .filter((booking) => booking.status === "Pending")
      .map((booking) => Number(booking.id))
      .filter((id) => !Number.isNaN(id));

    if (pendingIds.length === 0) return;

    const interval = setInterval(() => {
      void Promise.all(
        pendingIds.map((id) =>
          syncPaymentFromApi(id).catch(() => null)
        )
      ).then(() => refreshBookings()).catch(() => null);
    }, 15000);

    return () => clearInterval(interval);
  }, [authenticated, liveBookings, refreshBookings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, pageSize, sortOrder]);

  useEffect(() => {
    if (!authenticated) return;
    const token = getAuthToken();
    if (!token) return;

    let cleanup: (() => void) | undefined;

    const init = async () => {
      const { io } = await import("socket.io-client");
      const socket = io(API_BASE_URL, {
        transports: ["websocket"],
        auth: { token },
      });

      socket.on("booking:updated", () => {
        void refreshBookings();
      });

      cleanup = () => {
        socket.disconnect();
      };
    };

    void init();

    return () => {
      if (cleanup) cleanup();
    };
  }, [authenticated, refreshBookings]);

  const bookingList = useMemo(() => liveBookings, [liveBookings]);

  const getStatusClass = (status: BookingStatus, isExpired: boolean) => {
    if (status === "Issued" && isExpired) return "bg-slate-200 text-slate-700";
    if (status === "Issued") return "bg-emerald-100 text-emerald-700";
    if (status === "Paid") return "bg-blue-100 text-blue-700";
    if (status === "Cancelled") return "bg-rose-100 text-rose-700";
    return "bg-amber-100 text-amber-700";
  };

  const getStatusLabel = (status: BookingStatus, isExpired: boolean) => {
    if (status === "Issued" && isExpired) return "Expired";
    return status;
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
      <MainNav />
      <main className="mx-auto max-w-6xl px-3 py-8 page-enter sm:px-6 sm:py-10">
        <h1 className="inline-flex items-center gap-2 text-2xl font-black text-slate-900 sm:text-3xl">
          <Ticket className="h-6 w-6 text-blue-700 sm:h-7 sm:w-7" /> My Bookings
        </h1>
        {message && <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p>}
        {payError && <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{payError}</p>}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-blue-100 bg-white p-1 shadow-sm">
            {(["Upcoming", "Completed", "Cancelled"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 rounded-xl px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-blue-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex w-full gap-1 rounded-2xl border border-blue-100 bg-white p-1 shadow-sm sm:w-auto">
            <button
              onClick={() => setSortOrder("newest")}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:flex-none ${
                sortOrder === "newest"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-blue-50"
              }`}
            >
              <ArrowDownUp className="h-3 w-3" />
              Terbaru
            </button>
            <button
              onClick={() => setSortOrder("oldest")}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:flex-none ${
                sortOrder === "oldest"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-blue-50"
              }`}
            >
              <ArrowDownUp className="h-3 w-3 rotate-180" />
              Terlama
            </button>
          </div>
        </div>

        <section className="mt-6 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-3xl border border-blue-100 bg-white p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <div className="skeleton h-5 w-36 rounded-lg" />
                      <div className="skeleton h-4 w-52 rounded" />
                      <div className="skeleton h-3.5 w-28 rounded" />
                      <div className="skeleton h-3.5 w-44 rounded" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="skeleton h-6 w-20 rounded-full" />
                      <div className="flex gap-2">
                        <div className="skeleton h-9 w-28 rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : bookingList.length === 0 ? (
            <div className="rounded-2xl border border-blue-100 bg-white p-8 text-center text-sm text-slate-500">
              Tidak ada booking pada tab {activeTab}.
            </div>
          ) : (
            bookingList.map((booking) => {
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
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(booking.status, booking.isExpired)}`}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> {getStatusLabel(booking.status, booking.isExpired)}
                      </span>
                      {booking.status === "Issued" && booking.isExpired && (
                        <p className="mt-1 text-xs font-semibold text-slate-600">
                          Ticket expired since {formatDateTime(booking.departureIso)}
                        </p>
                      )}
                      {booking.status === "Paid" && (
                        <p className="mt-1 text-xs font-semibold text-blue-700">
                          Sudah dibayar, menunggu E-Ticket terbit
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap justify-end gap-2">
                        {booking.status === "Pending" && (
                          <>
                            <button
                              onClick={() => openCancelDialog(booking.id)}
                              disabled={cancellingId === booking.id || payingId === booking.id || syncingId === booking.id}
                              className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                            >
                              {cancellingId === booking.id ? "Membatalkan..." : "Cancel"}
                            </button>
                            <button
                              onClick={() => void handlePayBooking(booking.id)}
                              disabled={payingId === booking.id || syncingId === booking.id || cancellingId === booking.id}
                              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {payingId === booking.id ? "Memproses..." : "Bayar Sekarang"}
                            </button>
                            <button
                              onClick={() => void handleSyncPayment(booking.id)}
                              disabled={syncingId === booking.id || payingId === booking.id || cancellingId === booking.id}
                              className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                            >
                              {syncingId === booking.id ? "Mengecek..." : "Cek Status Bayar"}
                            </button>
                          </>
                        )}
                        {booking.status === "Paid" && (
                          <>
                            <span className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
                              Menunggu Penerbitan Tiket...
                            </span>
                          </>
                        )}
                        {booking.status === "Issued" && (
                          <button
                            onClick={() => handleViewETicket(booking)}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                          >
                            {booking.isExpired ? "View E-Ticket (Archive)" : "View E-Ticket"}
                          </button>
                        )}
                        {booking.status === "Cancelled" && (
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

          {!loading && totalItems > 0 && (
            <AppPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
              pageSizeId="rows-per-view-bookings"
            />
          )}
        </section>
      </main>

      {cancelDialogBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black text-slate-900">Batalkan Booking?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Booking <span className="font-semibold text-slate-900">{cancelDialogBooking.bookingCode}</span> akan dibatalkan permanen dan tidak bisa dipulihkan.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {cancelDialogBooking.route} • {cancelDialogBooking.date}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setCancelDialogBooking(null)}
                disabled={cancellingId === cancelDialogBooking.id}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Kembali
              </button>
              <button
                onClick={() => void handleCancelBooking()}
                disabled={cancellingId === cancelDialogBooking.id}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancellingId === cancelDialogBooking.id ? "Membatalkan..." : "Ya, Batalkan"}
              </button>
            </div>
          </div>
        </div>
      )}
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
