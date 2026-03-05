"use client";
// Komponen berjalan di browser sehingga bisa memakai useState, useEffect, dll.

import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
// Icon untuk tombol lihat detail

import AdminShell from "@/components/AdminShell";
// Layout halaman admin

import { formatRupiah } from "@/lib/currency";
// Fungsi untuk mengubah angka menjadi format Rupiah

import { getAdminBookings, type AdminBooking } from "@/lib/admin-api";
// Mengambil data booking dari API admin


// Jenis status transaksi
type TransactionStatus = "Pending" | "Paid" | "Issued" | "Cancelled";


// Struktur data transaksi yang akan ditampilkan di tabel
type TransactionItem = {
  id: string;
  customer: string;
  flight: string;
  amount: number;
  status: TransactionStatus;
  bookingCode: string;
  createdAt: string;
};


// Mengubah status dari data API menjadi status transaksi
const mapStatus = (item: AdminBooking): TransactionStatus => {
  if (item.status === "CANCELLED" || item.status === "EXPIRED") return "Cancelled";
  if (item.ticket) return "Issued"; // tiket sudah diterbitkan
  if (item.status === "PAID") return "Paid"; // sudah dibayar
  return "Pending"; // belum dibayar
};


export default function AdminTransactionsPage() {

  // filter status transaksi
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Pending" | "Paid" | "Issued" | "Cancelled"
  >("All");

  // transaksi yang dipilih untuk melihat detail
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);

  // daftar transaksi
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [rowsPerView, setRowsPerView] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // status loading
  const [loading, setLoading] = useState(true);

  // pesan error
  const [message, setMessage] = useState("");


  useEffect(() => {

    // fungsi untuk mengambil data transaksi dari API
    const loadTransactions = async () => {

      setLoading(true);
      setMessage("");

      try {

        const bookings = await getAdminBookings();

        // mengubah data booking dari API menjadi format transaksi
        const mapped: TransactionItem[] = bookings.map((item) => ({
          id: String(item.id),
          customer: item.user.name,
          flight: item.flight.flightNumber,
          amount: item.totalPrice,
          status: mapStatus(item),
          bookingCode: item.bookingCode,
          createdAt: item.createdAt,
        }));

        setTransactions(mapped);

      } catch (error) {

        setMessage(
          error instanceof Error
            ? error.message
            : "Gagal memuat data transaksi."
        );

      } finally {

        setLoading(false);

      }
    };

    void loadTransactions();

  }, []);


  // filter transaksi berdasarkan status
  const filteredTransactions = useMemo(() => {

    if (statusFilter === "All") return transactions;

    return transactions.filter((item) => item.status === statusFilter);

  }, [statusFilter, transactions]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / rowsPerView));

  const visibleTransactions = useMemo(() => {
    const start = (currentPage - 1) * rowsPerView;
    const end = start + rowsPerView;
    return filteredTransactions.slice(start, end);
  }, [filteredTransactions, currentPage, rowsPerView]);

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
  }, [statusFilter, rowsPerView]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);


  return (

    <AdminShell
      title="Transaction Management"
      description="Tabel transaksi lengkap dengan filter status dan view detail."
    >

      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">

        {/* Filter status transaksi */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-700">
            Filter by Status
          </p>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "All"
                  | "Pending"
                  | "Paid"
                  | "Issued"
                  | "Cancelled"
              )
            }
            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Issued">Issued</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* jika ada pesan error */}
        {message && (
          <p className="mb-3 text-sm text-rose-700">{message}</p>
        )}

        <div className="overflow-x-auto">

          {/* tabel transaksi */}
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

              {/* jika data sedang dimuat */}
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    Memuat data transaksi...
                  </td>
                </tr>

              ) : (

                // menampilkan transaksi yang sudah difilter
                visibleTransactions.map((item) => (

                  <tr
                    key={item.id}
                    className="border-b border-blue-100 last:border-0"
                  >

                    <td className="p-3 font-semibold">{item.id}</td>
                    <td className="p-3">{item.customer}</td>
                    <td className="p-3">{item.flight}</td>
                    <td className="p-3">{formatRupiah(item.amount)}</td>

                    {/* status transaksi */}
                    <td className="p-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold
                        ${
                          item.status === "Issued"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status === "Paid"
                            ? "bg-blue-100 text-blue-700"
                            : item.status === "Cancelled"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* tombol lihat detail */}
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedTransaction(item)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Detail
                      </button>
                    </td>

                  </tr>

                ))

              )}

            </tbody>
          </table>

        </div>

        {!loading && filteredTransactions.length > 0 && (
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                Menampilkan {(currentPage - 1) * rowsPerView + 1} - {Math.min(currentPage * rowsPerView, filteredTransactions.length)} dari {filteredTransactions.length} data.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-100 pt-3">
              <div className="inline-flex items-center gap-2">
                <label htmlFor="rows-per-view-transactions" className="font-medium text-slate-700">Tampilkan</label>
                <select
                  id="rows-per-view-transactions"
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


      {/* jika ada transaksi dipilih tampilkan detail */}
      {selectedTransaction && (

        <section className="mt-5 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">

          <h3 className="text-lg font-bold text-slate-900">
            Detail Transaksi
          </h3>

          <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-2">

            <p>
              <span className="font-semibold">ID:</span> {selectedTransaction.id}
            </p>

            <p>
              <span className="font-semibold">Booking Code:</span>{" "}
              {selectedTransaction.bookingCode}
            </p>

            <p>
              <span className="font-semibold">Customer:</span>{" "}
              {selectedTransaction.customer}
            </p>

            <p>
              <span className="font-semibold">Flight:</span>{" "}
              {selectedTransaction.flight}
            </p>

            <p>
              <span className="font-semibold">Created:</span>{" "}
              {new Date(selectedTransaction.createdAt).toLocaleString("id-ID")}
            </p>

            <p>
              <span className="font-semibold">Amount:</span>{" "}
              {formatRupiah(selectedTransaction.amount)}
            </p>

            <p>
              <span className="font-semibold">Status:</span>{" "}
              {selectedTransaction.status}
            </p>

          </div>
        </section>

      )}

    </AdminShell>
  );
}