"use client";

import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { transactionSamples, type TransactionItem, formatRupiah } from "@/lib/mock-data";

export default function AdminTransactionsPage() {
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Paid" | "Issued">("All");
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);

  const filteredTransactions = useMemo(() => {
    if (statusFilter === "All") return transactionSamples;
    return transactionSamples.filter((item) => item.status === statusFilter);
  }, [statusFilter]);

  return (
    <AdminShell title="Transaction Management" description="Tabel transaksi lengkap dengan filter status dan view detail.">
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-700">Filter by Status</p>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "All" | "Pending" | "Paid" | "Issued")}
            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Issued">Issued</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50 text-slate-600">
              <tr>
                <th className="rounded-l-xl p-3">ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Flight</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="rounded-r-xl p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((item) => (
                <tr key={item.id} className="border-b border-blue-100 last:border-0">
                  <td className="p-3 font-semibold">{item.id}</td>
                  <td className="p-3">{item.customer}</td>
                  <td className="p-3">{item.flight}</td>
                  <td className="p-3">{formatRupiah(item.amount)}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === "Issued" ? "bg-emerald-100 text-emerald-700" : item.status === "Paid" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => setSelectedTransaction(item)} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                      <Eye className="h-3.5 w-3.5" /> View Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedTransaction && (
        <section className="mt-5 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Detail Transaksi</h3>
          <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            <p><span className="font-semibold">ID:</span> {selectedTransaction.id}</p>
            <p><span className="font-semibold">Customer:</span> {selectedTransaction.customer}</p>
            <p><span className="font-semibold">Flight:</span> {selectedTransaction.flight}</p>
            <p><span className="font-semibold">Amount:</span> {formatRupiah(selectedTransaction.amount)}</p>
            <p><span className="font-semibold">Status:</span> {selectedTransaction.status}</p>
          </div>
        </section>
      )}
    </AdminShell>
  );
}
