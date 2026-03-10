"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { getAdminBookings, type AdminBooking } from "@/lib/admin-api";
import { formatRupiah } from "@/lib/currency";

type UserView = {
  id: number;
  name: string;
  email: string;
  bookingCount: number;
  totalSpent: number;
};

const buildUsers = (bookings: AdminBooking[]): UserView[] => {
  const map = new Map<number, UserView>();
  for (const b of bookings) {
    const u = b.user;
    if (!map.has(u.id)) {
      map.set(u.id, { id: u.id, name: u.name, email: u.email, bookingCount: 0, totalSpent: 0 });
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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [rowsPerView, setRowsPerView] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

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

  const users = useMemo(() => buildUsers(bookings), [bookings]);

  const totalPages = Math.max(1, Math.ceil(users.length / rowsPerView));

  const visibleUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerView;
    const end = start + rowsPerView;
    return users.slice(start, end);
  }, [users, currentPage, rowsPerView]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    const normalizedStart = Math.max(1, end - 4);

    return Array.from({ length: end - normalizedStart + 1 }, (_, index) => normalizedStart + index);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerView]);

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
                <th className="rounded-r-xl p-3">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-4 text-center text-slate-500">Memuat data user...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-slate-500">Belum ada data user.</td></tr>
              ) : visibleUsers.map((item) => (
                <tr key={item.id} className="border-b border-blue-100 last:border-0">
                  <td className="p-3 font-semibold text-slate-700">#{item.id}</td>
                  <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                  <td className="p-3 text-slate-600">{item.email}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">{item.bookingCount}x</span>
                  </td>
                  <td className="p-3 text-slate-700">{formatRupiah(item.totalSpent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && users.length > 0 && (
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                Menampilkan {(currentPage - 1) * rowsPerView + 1} - {Math.min(currentPage * rowsPerView, users.length)} dari {users.length} data.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-100 pt-3">
              <div className="inline-flex items-center gap-2">
                <label htmlFor="rows-per-view-users" className="font-medium text-slate-700">Tampilkan</label>
                <select
                  id="rows-per-view-users"
                  value={rowsPerView}
                  onChange={(event) => setRowsPerView(Number(event.target.value))}
                  className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
                >
                  <option value={10}>10 data</option>
                  <option value={20}>20 data</option>
                  <option value={50}>50 data</option>
                  <option value={100}>100 data</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                      page === currentPage
                        ? "bg-blue-600 text-white"
                        : "border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
