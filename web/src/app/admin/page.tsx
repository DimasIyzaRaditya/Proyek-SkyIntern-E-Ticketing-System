"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ReceiptText, UserCircle2 } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { clearSession, getUserSession, isAuthenticated, setUserSession } from "@/lib/auth";
import { getProfileFromApi } from "@/lib/auth-api";
import { getAdminBookings, type AdminBooking } from "@/lib/admin-api";

const formatRupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;
const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const paymentLabel = (booking: AdminBooking) => {
  if (booking.ticket) return "ISSUED";
  if (booking.payment?.status === "SUCCESS" || booking.status === "PAID") return "PAID";
  if (booking.status === "CANCELLED" || booking.status === "EXPIRED") return "CANCELLED";
  return "PENDING";
};

export default function AdminPage() {
  const router = useRouter();
  const authenticated = isAuthenticated();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [adminName, setAdminName] = useState(() => getUserSession()?.fullName ?? "Admin");
  const [adminEmail, setAdminEmail] = useState(() => getUserSession()?.email ?? "");

  useEffect(() => {
    if (!authenticated) {
      router.replace("/auth/login?redirect=/admin");
      return;
    }

    if (getUserSession()?.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setMessage("");

      try {
        const [profile, adminBookings] = await Promise.all([getProfileFromApi(), getAdminBookings()]);

        setUserSession(profile);
        setAdminName(profile.fullName);
        setAdminEmail(profile.email);
        setBookings(adminBookings);
      } catch (error) {
        clearSession();
        setMessage(error instanceof Error ? error.message : "Gagal memuat dashboard admin.");
        router.replace("/auth/login?redirect=/admin");
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [authenticated, router]);

  const paidCount = useMemo(
    () => bookings.filter((booking) => paymentLabel(booking) === "PAID" || paymentLabel(booking) === "ISSUED").length,
    [bookings],
  );

  const totalRevenue = useMemo(
    () =>
      bookings.reduce((total, booking) => {
        const label = paymentLabel(booking);
        if (label === "PAID" || label === "ISSUED") {
          return total + booking.totalPrice;
        }
        return total;
      }, 0),
    [bookings],
  );

  return (
    <AdminShell
      title="Admin Dashboard"
      description="Ringkasan profil admin dan riwayat pemesanan dari API."
    >
      {message && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p>}

      {loading ? (
        <section className="rounded-3xl border border-blue-100 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
          Memuat dashboard admin...
        </section>
      ) : (
        <section className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"><UserCircle2 className="h-4 w-4" /> Admin</p>
              <p className="mt-2 text-lg font-black text-slate-900">{adminName}</p>
              <p className="text-sm text-slate-600">{adminEmail}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-600">Booking Paid / Issued</p>
              <p className="mt-1 text-3xl font-black text-emerald-700">{paidCount}</p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-600">Total Revenue</p>
              <p className="mt-1 text-3xl font-black text-indigo-700">{formatRupiah(totalRevenue)}</p>
            </div>
          </section>

          <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <h2 className="inline-flex items-center gap-2 text-xl font-black text-slate-900"><ReceiptText className="h-5 w-5 text-blue-700" /> Riwayat Pemesanan</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-blue-50 text-slate-600">
                  <tr>
                    <th className="rounded-l-xl p-3">Booking Code</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Flight</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Tanggal</th>
                    <th className="rounded-r-xl p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-500">Belum ada riwayat pemesanan.</td>
                    </tr>
                  ) : (
                    bookings.map((item) => {
                      const label = paymentLabel(item);
                      return (
                        <tr key={item.id} className="border-b border-blue-100 last:border-0">
                          <td className="p-3 font-semibold">{item.bookingCode}</td>
                          <td className="p-3">
                            <p className="font-semibold text-slate-900">{item.user.name}</p>
                            <p className="text-xs text-slate-500">{item.user.email}</p>
                          </td>
                          <td className="p-3 font-semibold">{item.flight.airline.name} • {item.flight.flightNumber}</td>
                          <td className="p-3">{formatRupiah(item.totalPrice)}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                              <CalendarDays className="h-3.5 w-3.5" /> {formatDateTime(item.createdAt)}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              label === "ISSUED"
                                ? "bg-emerald-100 text-emerald-700"
                                : label === "PAID"
                                  ? "bg-blue-100 text-blue-700"
                                  : label === "CANCELLED"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-amber-100 text-amber-700"
                            }`}>
                              {label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      )}
    </AdminShell>
  );
}
