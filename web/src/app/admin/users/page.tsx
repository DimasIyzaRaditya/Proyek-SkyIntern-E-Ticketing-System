"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, ShieldOff, ShieldCheck } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { getAdminBookings, type AdminBooking, getAllAdminUsers, blockAdminUser, type AdminUser } from "@/lib/admin-api";
import { formatRupiah } from "@/lib/currency";

type UserView = AdminUser & {
  bookingCount: number;
  totalSpent: number;
};

const mergeUsers = (users: AdminUser[], bookings: AdminBooking[]): UserView[] => {
  const bookingMap = new Map<number, { count: number; spent: number }>();
  for (const b of bookings) {
    const u = b.user;
    if (!bookingMap.has(u.id)) bookingMap.set(u.id, { count: 0, spent: 0 });
    const entry = bookingMap.get(u.id)!;
    entry.count += 1;
    if (b.status === "PAID" || b.payment?.status === "SUCCESS") entry.spent += b.totalPrice;
  }
  return users
    .filter((u) => u.role !== "ADMIN")
    .map((u) => ({
      ...u,
      bookingCount: bookingMap.get(u.id)?.count ?? 0,
      totalSpent: bookingMap.get(u.id)?.spent ?? 0,
    }))
    .sort((a, b) => b.bookingCount - a.bookingCount);
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [blockingId, setBlockingId] = useState<number | null>(null);
  const [rowsPerView, setRowsPerView] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    setLoading(true);
    setMessage("");
    try {
      const [allUsers, bookings] = await Promise.all([getAllAdminUsers(), getAdminBookings()]);
      setUsers(mergeUsers(allUsers, bookings));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat data user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleToggleBlock = async (userId: number) => {
    setBlockingId(userId);
    try {
      const updated = await blockAdminUser(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isBlocked: updated.isBlocked } : u))
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengubah status blokir.");
    } finally {
      setBlockingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(users.length / rowsPerView));

  const visibleUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerView;
    return users.slice(start, start + rowsPerView);
  }, [users, currentPage, rowsPerView]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  useEffect(() => { setCurrentPage(1); }, [rowsPerView]);

  return (
    <AdminShell title="User Management" description="Daftar user terdaftar. Admin dapat memblokir/membuka blokir akun user.">
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

        {message && <p className="mb-3 text-sm text-rose-700">{message}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50 text-slate-600">
              <tr>
                <th className="rounded-l-xl p-3">ID</th>
                <th className="p-3">Nama</th>
                <th className="p-3">Email</th>
                <th className="p-3">Booking</th>
                <th className="p-3">Total Spent</th>
                <th className="rounded-r-xl p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-4 text-center text-slate-500">Memuat data user...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-slate-500">Belum ada data user.</td></tr>
              ) : visibleUsers.map((item) => (
                <tr key={item.id} className={`border-b border-blue-100 last:border-0 ${item.isBlocked ? "bg-red-50" : ""}`}>
                  <td className="p-3 font-semibold text-slate-700">#{item.id}</td>
                  <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                  <td className="p-3 text-slate-600">{item.email}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">{item.bookingCount}x</span>
                  </td>
                  <td className="p-3 text-slate-700">{formatRupiah(item.totalSpent)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {item.isBlocked && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">Diblokir</span>
                      )}
                      <button
                        onClick={() => void handleToggleBlock(item.id)}
                        disabled={blockingId === item.id}
                        title={item.isBlocked ? "Buka blokir" : "Blokir user"}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                          item.isBlocked
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        }`}
                      >
                        {blockingId === item.id ? (
                          "..."
                        ) : item.isBlocked ? (
                          <><ShieldCheck className="h-3.5 w-3.5" /> Buka Blokir</>
                        ) : (
                          <><ShieldOff className="h-3.5 w-3.5" /> Blokir</>
                        )}
                      </button>
                    </div>
                  </td>
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
