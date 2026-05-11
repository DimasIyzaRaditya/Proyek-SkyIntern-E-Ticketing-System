"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, ShieldOff, ShieldCheck } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import ResponsiveSelect from "@/components/ResponsiveSelect";
import { getAdminUsersPage, blockAdminUser, toggleAdminUserTwoFactor, type AdminUser } from "@/lib/admin-api";
import { formatRupiah } from "@/lib/currency";

type UserView = AdminUser & {
  bookingCount: number;
  totalSpent: number;
};

type SortField = "id" | "name" | "email" | "createdAt";
type SortDirection = "asc" | "desc";

const SORT_FIELD_OPTIONS: Array<{ value: SortField; label: string }> = [
  { value: "id", label: "ID" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
];

const SORT_DIRECTION_OPTIONS: Array<{ value: SortDirection; label: string }> = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserView[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [blockingId, setBlockingId] = useState<number | null>(null);
  const [togglingTwoFactorId, setTogglingTwoFactorId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [rowsPerView, setRowsPerView] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const trimmedSearch = search.trim();
  const isSearchInvalid = trimmedSearch.length > 0 && trimmedSearch.length < 3;
  const effectiveSearch = isSearchInvalid ? "" : trimmedSearch;

  const loadData = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await getAdminUsersPage({
        page: currentPage,
        limit: rowsPerView,
        excludeRole: "ADMIN",
        includeStats: true,
        search: effectiveSearch,
        sortBy: sortField,
        sortDirection,
      });

      const mapped: UserView[] = result.data.map((user) => ({
        ...user,
        bookingCount: user.bookingCount ?? 0,
        totalSpent: user.totalSpent ?? 0,
      }));

      setUsers(mapped);
      setTotalItems(result.pagination.totalItems);
      setTotalPages(result.pagination.totalPages);
      if (result.pagination.page !== currentPage) {
        setCurrentPage(result.pagination.page);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat data user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [currentPage, rowsPerView, search, sortField, sortDirection]);

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

  const handleToggleTwoFactor = async (userId: number) => {
    setTogglingTwoFactorId(userId);
    try {
      const updated = await toggleAdminUserTwoFactor(userId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, twoFactorEnabled: updated.twoFactorEnabled } : u,
        ),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengubah status 2FA user.");
    } finally {
      setTogglingTwoFactorId(null);
    }
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerView, search]);

  return (
    <AdminShell title="User Management" description="Daftar user terdaftar. Admin dapat memblokir/membuka blokir akun user.">
      <section className="max-w-full overflow-hidden rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-600">
            {loading ? "Memuat data..." : `${totalItems} user ditemukan`}
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

        <div className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_150px_auto]">
          <div className="w-full min-w-0">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ID, name, email, or phone"
              className="w-full min-w-0 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
            />
            {isSearchInvalid && (
              <p className="mt-1 text-xs text-slate-500">Ketik minimal 3 karakter untuk mencari.</p>
            )}
          </div>
          <ResponsiveSelect
            value={sortField}
            onChange={(nextValue) => setSortField(nextValue as SortField)}
            options={SORT_FIELD_OPTIONS}
            placeholder="Sort by"
          />
          <ResponsiveSelect
            value={sortDirection}
            onChange={(nextValue) => setSortDirection(nextValue as SortDirection)}
            options={SORT_DIRECTION_OPTIONS}
            placeholder="Direction"
          />
          <div className="flex items-center justify-start text-sm font-medium text-slate-600 sm:justify-end">
            Total: {totalItems}
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="min-w-180 w-full text-left text-sm">
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
                <tr key={item.id} className={`border-b border-blue-100 last:border-0 ${item.isBlocked ? "bg-red-50" : ""}`}>
                  <td className="p-3 font-semibold text-slate-700">#{item.id}</td>
                  <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                  <td className="p-3 text-slate-600">{item.email}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">{item.bookingCount}x</span>
                  </td>
                  <td className="p-3 text-slate-700">{formatRupiah(item.totalSpent)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.isBlocked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {item.isBlocked ? "Terblokir" : "Tidak Terblokir"}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.twoFactorEnabled ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-700"}`}>
                        {item.twoFactorEnabled ? "2FA Aktif" : "2FA Nonaktif"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void handleToggleTwoFactor(item.id)}
                        disabled={togglingTwoFactorId === item.id}
                        title={item.twoFactorEnabled ? "Nonaktifkan 2FA user" : "Aktifkan 2FA user"}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                          item.twoFactorEnabled
                            ? "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {togglingTwoFactorId === item.id
                          ? "..."
                          : item.twoFactorEnabled
                            ? "Matikan 2FA"
                            : "Hidupkan 2FA"}
                      </button>
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

        {!loading && totalItems > 0 && (
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                Menampilkan {(currentPage - 1) * rowsPerView + 1} - {Math.min(currentPage * rowsPerView, totalItems)} dari {totalItems} data.
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
