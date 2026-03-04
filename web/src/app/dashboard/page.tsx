"use client";

import Link from "next/link";
import Image from "next/image";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    if (!authenticated) {
      router.replace("/auth/login?redirect=/dashboard");
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setMessage("");

      try {
        const [profile, bookingData] = await Promise.all([getProfileFromApi(), getMyBookingsFromApi()]);

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

  const upcomingCount = useMemo(
    () => bookings.filter((booking) => booking.status === "PENDING" || booking.status === "PAID").length,
    [bookings],
  );

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
        <main className="mx-auto max-w-6xl px-6 py-10">
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
      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg">
          <h1 className="text-3xl font-black text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Profil pengguna dan riwayat pemesanan dari API.</p>

          <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center">
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

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-semibold text-slate-600">Nama</p>
              <p className="mt-1 text-base font-black text-slate-900">{fullName}</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-semibold text-slate-600">Email</p>
              <p className="mt-1 text-base font-black text-slate-900">{email}</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-semibold text-slate-600">No. HP</p>
              <p className="mt-1 text-base font-black text-slate-900">{phoneNumber || "-"}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-slate-600">Total Booking</p>
              <p className="mt-1 text-2xl font-black text-emerald-700">{bookings.length}</p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-xs font-semibold text-slate-600">Upcoming / Paid</p>
              <p className="mt-1 text-2xl font-black text-indigo-700">{upcomingCount}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-blue-100 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-xl font-black text-slate-900">
              <Ticket className="h-5 w-5 text-blue-700" /> Riwayat Pemesanan
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
              bookings.slice(0, 5).map((booking) => (
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
        </section>
      </main>
    </div>
  );
}
