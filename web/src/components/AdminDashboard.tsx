"use client";

import { useMemo, useState } from "react";
import { Clock3, LayoutDashboard, MapPin, Plus, ShieldCheck } from "lucide-react";

type AdminTransaction = {
  flight: string;
  customer: string;
  amount: number;
  status: "Paid" | "Pending" | "Issued";
};

type AdminStats = {
  todaySales: string;
  monthSales: string;
  activitySummary: string;
  topRouteSummary: string;
  healthSummary: string;
};

type AdminDashboardProps = {
  transactions: AdminTransaction[];
  stats: AdminStats;
  onStatsChange: <K extends keyof AdminStats>(key: K, value: AdminStats[K]) => void;
  onTransactionChange: (
    index: number,
    field: "flight" | "customer" | "amount" | "status",
    value: string | number,
  ) => void;
  onAddTransaction: () => void;
  formatRupiah: (value: number) => string;
};

type UserItem = {
  id: string;
  name: string;
  email: string;
  blocked: boolean;
};

const revenueChart = [45, 52, 61, 58, 72, 68, 79];

export default function AdminDashboard({
  transactions,
  stats,
  onStatsChange,
  onTransactionChange,
  onAddTransaction,
  formatRupiah,
}: AdminDashboardProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Paid" | "Issued">("All");
  const [users, setUsers] = useState<UserItem[]>([
    { id: "USR001", name: "Abimanyu Pratama", email: "abim@contoh.com", blocked: false },
    { id: "USR002", name: "Nadia Putri", email: "nadia@contoh.com", blocked: false },
    { id: "USR003", name: "Rizki Hidayat", email: "rizki@contoh.com", blocked: true },
  ]);

  const filteredTransactions = useMemo(() => {
    if (statusFilter === "All") return transactions;
    return transactions.filter((item) => item.status === statusFilter);
  }, [statusFilter, transactions]);

  const toggleBlockUser = (id: string) => {
    setUsers((prev) => prev.map((item) => (item.id === id ? { ...item, blocked: !item.blocked } : item)));
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-blue-600" />
          <h2 className="text-3xl font-black text-slate-900">Dashboard Overview</h2>
        </div>
        <button
          onClick={() => setIsEditMode((prev) => !prev)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            isEditMode
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isEditMode ? "Selesai Edit" : "Edit Dashboard"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-blue-100 bg-white p-6">
          {isEditMode ? (
            <input
              value={stats.todaySales}
              onChange={(event) => onStatsChange("todaySales", event.target.value)}
              className="w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-2xl font-black text-emerald-600 outline-none"
            />
          ) : (
            <p className="text-4xl font-black text-emerald-600">{stats.todaySales}</p>
          )}
          <p className="text-sm text-slate-500">Total Sales Today</p>
        </div>
        <div className="rounded-3xl border border-blue-100 bg-white p-6">
          {isEditMode ? (
            <input
              value={stats.monthSales}
              onChange={(event) => onStatsChange("monthSales", event.target.value)}
              className="w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-2xl font-black text-blue-600 outline-none"
            />
          ) : (
            <p className="text-4xl font-black text-blue-600">{stats.monthSales}</p>
          )}
          <p className="text-sm text-slate-500">Total Sales This Month</p>
        </div>
        <div className="rounded-3xl border border-blue-100 bg-white p-6">
          <p className="text-4xl font-black">{transactions.length}</p>
          <p className="text-sm text-slate-500">Total Transactions</p>
        </div>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-white p-6">
        <h3 className="text-lg font-bold text-slate-900">Revenue Chart (7 Hari)</h3>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {revenueChart.map((point, index) => (
            <div key={index} className="text-center">
              <div className="mx-auto flex h-32 w-8 items-end rounded bg-blue-50 p-1">
                <div className="w-full rounded bg-blue-600" style={{ height: `${point}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">D{index + 1}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">Daftar Transaksi</h3>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "All" | "Pending" | "Paid" | "Issued")}
              className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Issued">Issued</option>
            </select>
            {isEditMode && (
              <button
                onClick={onAddTransaction}
                className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                <Plus className="h-4 w-4" /> Tambah
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50 text-slate-600">
              <tr>
                <th className="rounded-l-xl p-3">Flight</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Amount</th>
                <th className="rounded-r-xl p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((row, index) => (
                <tr key={`${row.flight}-${index}`} className="border-b border-blue-100 last:border-0">
                  <td className="p-3 font-semibold">
                    {isEditMode ? (
                      <input
                        value={row.flight}
                        onChange={(event) => onTransactionChange(index, "flight", event.target.value)}
                        className="w-full min-w-20 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1"
                      />
                    ) : row.flight}
                  </td>
                  <td className="p-3">
                    {isEditMode ? (
                      <input
                        value={row.customer}
                        onChange={(event) => onTransactionChange(index, "customer", event.target.value)}
                        className="w-full min-w-32 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1"
                      />
                    ) : row.customer}
                  </td>
                  <td className="p-3">
                    {isEditMode ? (
                      <input
                        type="number"
                        value={row.amount}
                        onChange={(event) => onTransactionChange(index, "amount", Number(event.target.value) || 0)}
                        className="w-full min-w-24 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1"
                      />
                    ) : formatRupiah(row.amount)}
                  </td>
                  <td className="p-3">
                    {isEditMode ? (
                      <select
                        value={row.status}
                        onChange={(event) => onTransactionChange(index, "status", event.target.value)}
                        className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Issued">Issued</option>
                      </select>
                    ) : (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          row.status === "Issued"
                            ? "bg-emerald-100 text-emerald-700"
                            : row.status === "Paid"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-white p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"><Clock3 className="h-4 w-4" /> Aktivitas 24 Jam</p>
          {isEditMode ? (
            <textarea
              value={stats.activitySummary}
              onChange={(event) => onStatsChange("activitySummary", event.target.value)}
              className="mt-2 min-h-20 w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-slate-700"
            />
          ) : (
            <p className="mt-2 text-sm text-slate-600">{stats.activitySummary}</p>
          )}
        </div>
        <div className="rounded-2xl border border-blue-100 bg-white p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"><MapPin className="h-4 w-4" /> Rute Terpopuler</p>
          {isEditMode ? (
            <textarea
              value={stats.topRouteSummary}
              onChange={(event) => onStatsChange("topRouteSummary", event.target.value)}
              className="mt-2 min-h-20 w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-slate-700"
            />
          ) : (
            <p className="mt-2 text-sm text-slate-600">{stats.topRouteSummary}</p>
          )}
        </div>
        <div className="rounded-2xl border border-blue-100 bg-white p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"><ShieldCheck className="h-4 w-4" /> Health Check</p>
          {isEditMode ? (
            <textarea
              value={stats.healthSummary}
              onChange={(event) => onStatsChange("healthSummary", event.target.value)}
              className="mt-2 min-h-20 w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-slate-700"
            />
          ) : (
            <p className="mt-2 text-sm text-slate-600">{stats.healthSummary}</p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-slate-900">Manajemen User (Preview)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50 text-slate-600">
              <tr>
                <th className="rounded-l-xl p-3">User</th>
                <th className="p-3">Email</th>
                <th className="p-3">Status</th>
                <th className="rounded-r-xl p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id} className="border-b border-blue-100 last:border-0">
                  <td className="p-3 font-semibold">{item.name}</td>
                  <td className="p-3">{item.email}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.blocked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {item.blocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleBlockUser(item.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${item.blocked ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}
                    >
                      {item.blocked ? "Unblock" : "Block"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
