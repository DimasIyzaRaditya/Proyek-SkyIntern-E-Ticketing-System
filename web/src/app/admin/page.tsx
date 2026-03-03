"use client";

import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import AdminDashboard from "@/components/AdminDashboard";

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

const formatRupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

export default function AdminPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([
    { flight: "GA-123", customer: "Abimanyu Pratama", amount: 1435000, status: "Issued" },
    { flight: "JT-221", customer: "Nadia Putri", amount: 1185000, status: "Paid" },
    { flight: "QG-909", customer: "Rizki Hidayat", amount: 1035000, status: "Pending" },
  ]);

  const [stats, setStats] = useState<AdminStats>({
    todaySales: "Rp 48jt",
    monthSales: "Rp 1.2M",
    activitySummary: "154 booking baru diproses.",
    topRouteSummary: "CGK → DPS mendominasi 34% transaksi.",
    healthSummary: "Payment gateway dan seat engine normal.",
  });

  const onStatsChange = <K extends keyof AdminStats>(key: K, value: AdminStats[K]) => {
    setStats((prev) => ({ ...prev, [key]: value }));
  };

  const onTransactionChange = (
    index: number,
    field: "flight" | "customer" | "amount" | "status",
    value: string | number,
  ) => {
    setTransactions((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        if (field === "amount") return { ...row, amount: Number(value) || 0 };
        if (field === "status") {
          const status = value === "Pending" || value === "Issued" ? value : "Paid";
          return { ...row, status };
        }
        return { ...row, [field]: String(value) };
      }),
    );
  };

  const onAddTransaction = () => {
    setTransactions((prev) => [...prev, { flight: "XX-000", customer: "Customer Baru", amount: 0, status: "Pending" }]);
  };

  return (
    <AdminShell
      title="Admin Dashboard"
      description="Dashboard overview, monitoring transaksi, dan kontrol user admin."
    >
      <AdminDashboard
        transactions={transactions}
        stats={stats}
        onStatsChange={onStatsChange}
        onTransactionChange={onTransactionChange}
        onAddTransaction={onAddTransaction}
        formatRupiah={formatRupiah}
      />
    </AdminShell>
  );
}
