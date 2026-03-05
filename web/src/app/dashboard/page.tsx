"use client";

import Link from "next/link";
import Image from "next/image";
import { type ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Plane, Ticket } from "lucide-react";
import MainNav from "@/components/MainNav";
import { clearSession, getUserSession, isAuthenticated, setUserSession } from "@/lib/auth";
import { getProfileFromApi, updateProfileFromApi } from "@/lib/auth-api";
import { getMyBookingsFromApi } from "@/lib/booking-api";

type BookingCard = {
  id: number;
  flightNumber: string;
  airline: string;
  route: string;
  departureTime: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function DashboardPage() {
  const router = useRouter();
  const authenticated = isAuthenticated();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [fullName, setFullName] = useState(() => getUserSession()?.fullName ?? "");
  const [email, setEmail] = useState(() => getUserSession()?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(() => getUserSession()?.phoneNumber ?? "");
  const [avatarUrl, setAvatarUrl] = useState(() => getUserSession()?.avatarUrl ?? "");
  const [bookings, setBookings] = useState<BookingCard[]>([]);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(5);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);

  const historyTotalPages = Math.max(1, Math.ceil(bookings.length / historyRowsPerPage));
  const visibleBookings = bookings.slice(
    (historyCurrentPage - 1) * historyRowsPerPage,
    historyCurrentPage * historyRowsPerPage,
  );

  const historyPageNumbers = (() => {
    if (historyTotalPages <= 5) {
      return Array.from({ length: historyTotalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, historyCurrentPage - 2);
    const end = Math.min(historyTotalPages, start + 4);
    const normalizedStart = Math.max(1, end - 4);

    return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index);
  })();

  useEffect(() => {
    if (!authenticated) {
      router.replace("/auth/login?redirect=/dashboard");
      return;
    }

    if (getUserSession()?.role === "admin") {
      router.replace("/admin");
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setMessage("");

      try {
        const [profile, bookingData] = await Promise.all([getProfileFromApi(), getMyBookingsFromApi()]);

        if (profile.role === "admin") {
          router.replace("/admin");
          return;
        }

        setUserSession(profile);
        setFullName(profile.fullName);
        setEmail(profile.email);
        setPhoneNumber(profile.phoneNumber ?? "");
        setAvatarUrl(profile.avatarUrl ?? "");

        const mapped = bookingData.map((item) => ({
          id: item.id,
          flightNumber: item.flight.flightNumber,
          airline: item.flight.airline.name,
          route: `${item.flight.origin.code ?? item.flight.origin.city} → ${item.flight.destination.code ?? item.flight.destination.city}`,
          departureTime: item.flight.departureTime,
          status: item.status,
        }));

        setBookings(mapped);
      } catch (error) {
        clearSession();
        setMessage(error instanceof Error ? error.message : "Sesi berakhir. Silakan login kembali.");
        router.replace("/auth/login?redirect=/dashboard");
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [authenticated, router]);

  useEffect(() => {
    setHistoryCurrentPage(1);
  }, [historyRowsPerPage]);

  useEffect(() => {
    if (historyCurrentPage > historyTotalPages) {
      setHistoryCurrentPage(historyTotalPages);
    }
  }, [historyCurrentPage, historyTotalPages]);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("File harus berupa gambar.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;

      try {
        const profile = await updateProfileFromApi({ avatarUrl: result });
        setUserSession(profile);
        setAvatarUrl(profile.avatarUrl ?? "");
        setMessage("Foto profil berhasil diperbarui.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Gagal upload foto profil.");
      }
    };
    reader.readAsDataURL(file);
  };

  if (!authenticated || loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
        <MainNav />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <section className="rounded-3xl border border-blue-100 bg-white p-8 text-center text-sm font-semibold text-slate-600 shadow-lg">
            Memuat dashboard...
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="rounded-3xl border border-blue-100 bg-white p-4 shadow-lg sm:p-6">
          <h1 className="text-xl font-black text-slate-900 sm:text-2xl md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">Profil pengguna dan riwayat pemesanan dari API.</p>

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-3 sm:mt-5 sm:flex-row sm:items-center sm:p-4">
            <div className="h-20 w-20 overflow-hidden rounded-full border border-blue-200 bg-white">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Foto profil" width={80} height={80} className="h-full w-full object-cover" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">👤</div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Foto Profil</p>
              <p className="text-xs text-slate-500">Tambahkan gambar profil Anda.</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="mt-2 block text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:font-semibold file:text-white hover:file:bg-blue-700"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 sm:p-4">
              <p className="text-xs font-semibold text-slate-600">Nama</p>
              <p className="mt-1 text-sm font-black text-slate-900 sm:text-base">{fullName}</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 sm:p-4">
              <p className="text-xs font-semibold text-slate-600">Email</p>
              <p className="mt-1 truncate text-sm font-black text-slate-900 sm:text-base">{email}</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 sm:p-4">
              <p className="text-xs font-semibold text-slate-600">No. HP</p>
              <p className="mt-1 text-sm font-black text-slate-900 sm:text-base">{phoneNumber || "-"}</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-blue-100 bg-white p-4 shadow-lg sm:mt-6 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-base font-black text-slate-900 sm:text-xl">
              <Ticket className="h-4 w-4 text-blue-700 sm:h-5 sm:w-5" /> Riwayat Pemesanan
            </h2>
            <Link href="/bookings" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              Lihat semua
            </Link>
          </div>

          {message && <p className="mt-3 text-sm text-rose-700">{message}</p>}

          <div className="mt-4 space-y-3">
            {bookings.length === 0 ? (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">
                Belum ada pemesanan.
              </div>
            ) : (
              visibleBookings.map((booking) => (
                <article key={booking.id} className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="inline-flex items-center gap-2 font-semibold text-slate-900">
                    <Plane className="h-4 w-4 text-blue-700" /> {booking.airline} • {booking.flightNumber}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{booking.route}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" /> {formatDateTime(booking.departureTime)}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-blue-700">Status: {booking.status}</p>
                </article>
              ))
            )}
          </div>

          {bookings.length > 0 && (
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p>
                  Menampilkan {(historyCurrentPage - 1) * historyRowsPerPage + 1} - {Math.min(historyCurrentPage * historyRowsPerPage, bookings.length)} dari {bookings.length} data.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-100 pt-3">
                <div className="inline-flex items-center gap-2">
                  <label htmlFor="rows-per-view-history" className="font-medium text-slate-700">Tampilkan</label>
                  <select
                    id="rows-per-view-history"
                    value={historyRowsPerPage}
                    onChange={(event) => setHistoryRowsPerPage(Number(event.target.value))}
                    className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
                  >
                    <option value={5}>5 data</option>
                    <option value={10}>10 data</option>
                    <option value={20}>20 data</option>
                    <option value={50}>50 data</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setHistoryCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={historyCurrentPage === 1}
                    className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>
                  {historyPageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setHistoryCurrentPage(page)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                        page === historyCurrentPage
                          ? "bg-blue-600 text-white"
                          : "border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setHistoryCurrentPage((prev) => Math.min(historyTotalPages, prev + 1))}
                    disabled={historyCurrentPage === historyTotalPages}
                    className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
