"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, ReceiptText, Ticket, TrendingUp, UserCircle2, XCircle } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import LazySection from "@/components/LazySection";
import { clearSession, getUserSession, isAuthenticated, setUserSession } from "@/lib/auth";
import { getProfileFromApi } from "@/lib/auth-api";
import { getAdminBookings, type AdminBooking } from "@/lib/admin-api";
import type { ChartDataPoint } from "./AdminSalesChart";

const AdminSalesChart = dynamic(() => import("./AdminSalesChart"), {
  ssr: false,
  loading: () => (
    <div className="skeleton h-56 w-full rounded-2xl" aria-label="Memuat grafik..." />
  ),
});

const formatRupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const paymentLabel = (booking: AdminBooking): "ISSUED" | "PAID" | "CANCELLED" | "PENDING" => {
  if (booking.ticket) return "ISSUED";
  if (booking.payment?.status === "SUCCESS" || booking.status === "PAID") return "PAID";
  if (booking.status === "CANCELLED" || booking.status === "EXPIRED") return "CANCELLED";
  return "PENDING";
};

const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function AdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState("");
  const [chartView, setChartView] = useState<"daily" | "monthly" | "yearly">("monthly");

  useEffect(() => {
    const auth = isAuthenticated();
    setAuthenticated(auth);
    if (!auth) {
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
  }, [router]);

  const stats = useMemo(() => {
    let paid = 0, issued = 0, pending = 0, cancelled = 0, revenue = 0;
    const today = new Date().toDateString();
    let todayCount = 0;
    for (const b of bookings) {
      const label = paymentLabel(b);
      if (label === "PAID") { paid++; revenue += b.totalPrice; }
      else if (label === "ISSUED") { issued++; revenue += b.totalPrice; }
      else if (label === "PENDING") pending++;
      else cancelled++;
      if (new Date(b.createdAt).toDateString() === today) todayCount++;
    }
    return { total: bookings.length, paid, issued, pending, cancelled, revenue, today: todayCount };
  }, [bookings]);

  // Daily chart: last 30 days
  const dailyChartData = useMemo(() => {
    const now = new Date();
    const days: { label: string; fullLabel: string; paid: number; pending: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = d.toDateString();
      const paidCount = bookings.filter((b) => {
        const lbl = paymentLabel(b);
        return new Date(b.createdAt).toDateString() === dateStr && (lbl === "PAID" || lbl === "ISSUED");
      }).length;
      const pendingCount = bookings.filter((b) =>
        new Date(b.createdAt).toDateString() === dateStr && paymentLabel(b) === "PENDING"
      ).length;
      // Show label every 5 days or on 1st of month
      const showLabel = d.getDate() % 5 === 0 || d.getDate() === 1;
      const label = showLabel ? (d.getDate() === 1 ? `1 ${MONTHS_ID[d.getMonth()]}` : `${d.getDate()}`) : "";
      days.push({ label, fullLabel: `${d.getDate()} ${MONTHS_ID[d.getMonth()]}`, paid: paidCount, pending: pendingCount });
    }
    return days;
  }, [bookings]);

  // Monthly chart: last 12 months
  const monthlyChartData = useMemo(() => {
    const now = new Date();
    const months: { label: string; fullLabel: string; paid: number; pending: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const paidCount = bookings.filter((b) => {
        const bd = new Date(b.createdAt);
        const lbl = paymentLabel(b);
        return bd.getFullYear() === year && bd.getMonth() === month && (lbl === "PAID" || lbl === "ISSUED");
      }).length;
      const pendingCount = bookings.filter((b) => {
        const bd = new Date(b.createdAt);
        return bd.getFullYear() === year && bd.getMonth() === month && paymentLabel(b) === "PENDING";
      }).length;
      months.push({ label: MONTHS_ID[month], fullLabel: `${MONTHS_ID[month]} ${year}`, paid: paidCount, pending: pendingCount });
    }
    return months;
  }, [bookings]);

  // Yearly chart: last 5 years
  const yearlyChartData = useMemo(() => {
    const now = new Date();
    const years: { label: string; fullLabel: string; paid: number; pending: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const year = now.getFullYear() - i;
      const paidCount = bookings.filter((b) => {
        const lbl = paymentLabel(b);
        return new Date(b.createdAt).getFullYear() === year && (lbl === "PAID" || lbl === "ISSUED");
      }).length;
      const pendingCount = bookings.filter((b) =>
        new Date(b.createdAt).getFullYear() === year && paymentLabel(b) === "PENDING"
      ).length;
      years.push({ label: `${year}`, fullLabel: `${year}`, paid: paidCount, pending: pendingCount });
    }
    return years;
  }, [bookings]);

  const activeChartData: ChartDataPoint[] = chartView === "daily" ? dailyChartData : chartView === "monthly" ? monthlyChartData : yearlyChartData;

  const recentBookings = useMemo(
    () => [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8),
    [bookings],
  );

  return (
    <AdminShell title="Admin Dashboard" description="Overview penjualan tiket, revenue, dan aktivitas booking terkini.">
      {message && (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 sm:text-sm">{message}</p>
      )}

      {loading ? (
        <section className="space-y-6 page-enter">
          {/* Stat cards skeleton */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                <div className="skeleton mb-3 h-3.5 w-20 rounded" />
                <div className="skeleton h-9 w-24 rounded-lg" />
                <div className="skeleton mt-2 h-3 w-32 rounded" />
              </div>
            ))}
          </div>
          {/* Chart skeleton */}
          <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <div className="skeleton mb-4 h-6 w-36 rounded-lg" />
            <div className="skeleton h-56 w-full rounded-2xl" />
          </div>
        </section>
      ) : (
        <section className="space-y-6 page-enter">

          {/* ── Stat Cards ── */}
          <LazySection>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <p className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wide">
                <UserCircle2 className="h-3.5 w-3.5" /> Admin
              </p>
              <p className="mt-2 truncate text-base font-black text-slate-900 sm:text-lg">{adminName}</p>
              <p className="text-xs text-slate-500 truncate">{adminEmail}</p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Booking</p>
              <p className="mt-1 text-3xl font-black text-indigo-700 sm:text-4xl">{stats.total}</p>
              <p className="mt-1 text-xs text-slate-500">Hari ini: <span className="font-bold text-indigo-600">{stats.today}</span></p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tiket Terjual</p>
              <p className="mt-1 text-3xl font-black text-emerald-700 sm:text-4xl">{stats.paid + stats.issued}</p>
              <p className="mt-1 text-xs text-slate-500">Paid: {stats.paid} · Issued: {stats.issued}</p>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Revenue</p>
              <p className="mt-1 text-lg font-black leading-tight text-violet-700 sm:text-xl">{formatRupiah(stats.revenue)}</p>
              <p className="mt-1 text-xs text-slate-500">Pending: {stats.pending} · Batal: {stats.cancelled}</p>
            </div>
          </div>
          </LazySection>

          {/* ── Bar Chart & Status Side-by-Side ── */}
          <LazySection delay={1}>
          <div className="grid gap-4 lg:grid-cols-3">

            {/* Sales chart with Daily / Monthly / Yearly tabs */}
            <section className="col-span-2 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 text-base font-black text-slate-900 sm:text-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" /> Grafik Penjualan
                </h2>
                <div className="flex rounded-xl border border-blue-100 bg-slate-50 p-1 text-xs font-semibold gap-1">
                  {(["daily", "monthly", "yearly"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setChartView(v)}
                      className={`rounded-lg px-4 py-1.5 transition-all duration-200 ${
                        chartView === v
                          ? "bg-blue-600 text-white shadow"
                          : "text-slate-500 hover:text-slate-700 hover:bg-white"
                      }`}
                    >
                      {v === "daily" ? "Harian" : v === "monthly" ? "Bulanan" : "Tahunan"}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mb-4 text-xs text-slate-400">
                {chartView === "daily" ? "30 hari terakhir" : chartView === "monthly" ? "12 bulan terakhir" : "5 tahun terakhir"}
              </p>

              <div className="w-full">
                <AdminSalesChart data={activeChartData} view={chartView} />
              </div>
            </section>

            {/* Status breakdown */}
            <section className="rounded-3xl border border-blue-100 bg-white p-4 sm:p-6 shadow-sm flex flex-col gap-3">
              <h2 className="mb-1 text-sm font-black text-slate-900 sm:text-base md:text-lg">Status Booking</h2>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 sm:p-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:scale-[1.01]">
                <Ticket className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">Issued</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-black text-blue-700 leading-tight">{stats.issued}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 sm:p-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:scale-[1.01]">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">Paid</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-black text-emerald-700 leading-tight">{stats.paid}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 sm:p-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:scale-[1.01]">
                <Clock3 className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">Pending</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-black text-amber-700 leading-tight">{stats.pending}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-red-100 bg-red-50 p-3 sm:p-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:scale-[1.01]">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 shrink-0" />
                <div>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">Dibatalkan</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-black text-red-700 leading-tight">{stats.cancelled}</p>
                </div>
              </div>
            </section>
          </div>
          </LazySection>

          {/* ── Recent Bookings Table ── */}
          <LazySection delay={2}>
          <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-black text-slate-900 sm:text-xl">
              <ReceiptText className="h-5 w-5 text-blue-700" /> Booking Terbaru
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-blue-50 text-slate-600">
                  <tr>
                    <th className="rounded-l-xl p-3">Kode</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Penerbangan</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Tanggal</th>
                    <th className="rounded-r-xl p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center text-slate-500">Belum ada data booking.</td></tr>
                  ) : recentBookings.map((item) => {
                    const label = paymentLabel(item);
                    return (
                      <tr key={item.id} className="border-b border-blue-100 last:border-0">
                        <td className="p-3 font-semibold text-blue-700">{item.bookingCode}</td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-900">{item.user.name}</p>
                          <p className="text-xs text-slate-500">{item.user.email}</p>
                        </td>
                        <td className="p-3 font-semibold">{item.flight.airline.name} · {item.flight.flightNumber}</td>
                        <td className="p-3">{formatRupiah(item.totalPrice)}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <CalendarDays className="h-3.5 w-3.5" /> {formatDateTime(item.createdAt)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            label === "ISSUED" ? "bg-emerald-100 text-emerald-700"
                            : label === "PAID" ? "bg-blue-100 text-blue-700"
                            : label === "CANCELLED" ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                          }`}>{label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          </LazySection>

        </section>
      )}
    </AdminShell>
  );
}
