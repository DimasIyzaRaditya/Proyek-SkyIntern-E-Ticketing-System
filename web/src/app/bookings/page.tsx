"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, Plane, Ticket } from "lucide-react";
import MainNav from "@/components/MainNav";
import { isAuthenticated } from "@/lib/auth";
import { getMyBookingsFromApi } from "@/lib/booking-api";

type TabKey = "Upcoming" | "Completed" | "Cancelled";
type BookingStatus = "Pending" | "Paid" | "Issued" | "Cancelled";

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

export default function MyBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("Upcoming");
  const [liveBookings, setLiveBookings] = useState<BookingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const authenticated = isAuthenticated();

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
    };
  }, [searchParams]);

  useEffect(() => {
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
            status = "Issued";
          } else if (item.status === "PAID") {
            status = "Paid";
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
  }, [authenticated, router, searchParams]);

  const bookingList = useMemo(
    () => liveBookings.filter((item) => item.tab === activeTab),
    [activeTab, liveBookings],
  );

  const getStatusClass = (status: BookingStatus) => {
    if (status === "Issued") return "bg-emerald-100 text-emerald-700";
    if (status === "Paid") return "bg-blue-100 text-blue-700";
    if (status === "Cancelled") return "bg-rose-100 text-rose-700";
    return "bg-amber-100 text-amber-700";
  };

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
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="inline-flex items-center gap-2 text-3xl font-black text-slate-900">
          <Ticket className="h-7 w-7 text-blue-700" /> My Bookings Page
        </h1>
        {message && <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p>}

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
                      <div>
                        {booking.pdfUrl ? (
                          <Link
                            href={`/bookings/e-ticket?${query.toString()}`}
                            className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            View E-Ticket
                          </Link>
                        ) : (
                          <span className="mt-3 inline-block rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-500">
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
