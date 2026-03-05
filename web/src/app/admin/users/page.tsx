"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, ShieldBan, ShieldCheck } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { getAdminBookings, type AdminBooking } from "@/lib/admin-api";

type UserView = {
  id: number;
  name: string;
  email: string;
  bookingCount: number;
  totalSpent: number;
  blocked: boolean;
};

const formatRupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

const buildUsers = (bookings: AdminBooking[]): UserView[] => {
  const map = new Map<number, UserView>();
  for (const b of bookings) {
    const u = b.user;
    if (!map.has(u.id)) {
      map.set(u.id, { id: u.id, name: u.name, email: u.email, bookingCount: 0, totalSpent: 0, blocked: false });
    }
    const entry = map.get(u.id)!;
    entry.bookingCount += 1;
    const paid = b.status === "PAID" || (b.payment?.status === "SUCCESS");
    if (paid) entry.totalSpent += b.totalPrice;
  }
  return Array.from(map.values()).sort((a, b) => b.bookingCount - a.bookingCount);
};

export default function AdminUsersPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [blockedIds, setBlockedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await getAdminBookings();
      setBookings(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat data user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const users = useMemo(() => {
    const base = buildUsers(bookings);
    return base.map((u) => ({ ...u, blocked: blockedIds.has(u.id) }));
  }, [bookings, blockedIds]);

  const toggleBlock = (id: number) => {
    setBlockedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AdminShell title="User Management" description="Daftar user terdaftar berdasarkan riwayat booking dari API.">
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {loading ? "Memuat data..." : `${users.length} user ditemukan`}
          </p>
          <button
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {message && (
          <p className="mb-3 text-sm text-rose-700">{message}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50 text-slate-600">
              <tr>
                <th className="rounded-l-xl p-3">ID</th>
                <th className="p-3">Nama</th>
                <th className="p-3">Email</th>
                <th className="p-3">Booking</th>
                <th className="p-3">Total Spent</th>
                <th className="p-3">Status</th>
                <th className="rounded-r-xl p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-4 text-center text-slate-500">Memuat data user...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="p-4 text-center text-slate-500">Belum ada data user.</td></tr>
              ) : users.map((item) => (
                <tr key={item.id} className="border-b border-blue-100 last:border-0">
                  <td className="p-3 font-semibold text-slate-700">#{item.id}</td>
                  <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                  <td className="p-3 text-slate-600">{item.email}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">{item.bookingCount}x</span>
                  </td>
                  <td className="p-3 text-slate-700">{formatRupiah(item.totalSpent)}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.blocked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {item.blocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleBlock(item.id)}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${item.blocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
                    >
                      {item.blocked ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldBan className="h-3.5 w-3.5" />}
                      {item.blocked ? "Unblock" : "Block"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
