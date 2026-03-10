"use client";
// Komponen berjalan di browser sehingga bisa memakai useState, useEffect, dll.

import { useEffect, useMemo, useState } from "react";
import { Eye, X } from "lucide-react";
// Icon untuk tombol lihat detail, issue tiket, dan batal

import AdminShell from "@/components/AdminShell";
// Layout halaman admin

import { formatRupiah } from "@/lib/currency";
// Fungsi untuk mengubah angka menjadi format Rupiah

import { getAdminBookings, updateAdminBookingStatus, type AdminBooking } from "@/lib/admin-api";
// Mengambil data booking dari API admin


// Jenis status transaksi — didefinisikan duluan agar bisa dipakai di konstanta di bawah
type TransactionStatus = "Pending" | "Paid" | "Issued" | "Cancelled";

type StatusAction = "markpending" | "markpaid" | "markissued" | "cancel";

// Semua kemungkinan transisi status — setiap status bisa pindah ke 3 status lainnya
const statusTransitions: Record<
  TransactionStatus,
  { label: string; action: StatusAction; color: string }[]
> = {
  Pending: [
    { label: "Tandai Paid",    action: "markpaid",    color: "bg-blue-600 hover:bg-blue-700" },
    { label: "Tandai Issued",  action: "markissued",  color: "bg-emerald-600 hover:bg-emerald-700" },
    { label: "Batalkan",       action: "cancel",      color: "bg-rose-600 hover:bg-rose-700" },
  ],
  Paid: [
    { label: "Tandai Pending", action: "markpending", color: "bg-amber-500 hover:bg-amber-600" },
    { label: "Tandai Issued",  action: "markissued",  color: "bg-emerald-600 hover:bg-emerald-700" },
    { label: "Batalkan",       action: "cancel",      color: "bg-rose-600 hover:bg-rose-700" },
  ],
  Issued: [
    { label: "Tandai Pending", action: "markpending", color: "bg-amber-500 hover:bg-amber-600" },
    { label: "Tandai Paid",    action: "markpaid",    color: "bg-blue-600 hover:bg-blue-700" },
    { label: "Batalkan",       action: "cancel",      color: "bg-rose-600 hover:bg-rose-700" },
  ],
  Cancelled: [
    { label: "Tandai Pending", action: "markpending", color: "bg-amber-500 hover:bg-amber-600" },
    { label: "Tandai Paid",    action: "markpaid",    color: "bg-blue-600 hover:bg-blue-700" },
    { label: "Tandai Issued",  action: "markissued",  color: "bg-emerald-600 hover:bg-emerald-700" },
    { label: "Batalkan",       action: "cancel",      color: "bg-rose-600 hover:bg-rose-700" },
  ],
};

// Status baru setelah aksi dijalankan
const statusAfterAction: Record<StatusAction, TransactionStatus> = {
  markpending: "Pending",
  markpaid:    "Paid",
  markissued:  "Issued",
  cancel:      "Cancelled",
};

// Teks sukses per aksi
const actionSuccessText: Record<StatusAction, string> = {
  markpending: "Status berhasil diubah ke Pending.",
  markpaid:    "Status berhasil diubah ke Paid.",
  markissued:  "Tiket berhasil diterbitkan (Issued).",
  cancel:      "Booking berhasil dibatalkan.",
};


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

  // ID transaksi yang popup detail-nya sedang terbuka
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // daftar transaksi
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [rowsPerView, setRowsPerView] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // status loading
  const [loading, setLoading] = useState(true);

  // pesan error
  const [message, setMessage] = useState("");

  // status loading aksi edit
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{id: string; text: string; ok: boolean} | null>(null);

  // konfirmasi sebelum ubah status
  const [pendingAction, setPendingAction] = useState<{
    item: TransactionItem;
    action: StatusAction;
    label: string;
  } | null>(null);


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


  // fungsi untuk melakukan aksi edit status booking
  const handleAction = async (
    item: TransactionItem,
    action: StatusAction
  ) => {
    setActionLoading(true);
    setActionMessage(null);
    setPendingAction(null);
    try {
      await updateAdminBookingStatus(Number(item.id), action);
      const newStatus = statusAfterAction[action];
      setActionMessage({ id: item.id, text: actionSuccessText[action], ok: true });
      // perbarui status di list lokal
      setTransactions((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      setActionMessage({
        id: item.id,
        text: err instanceof Error ? err.message : "Gagal melakukan aksi.",
        ok: false,
      });
    } finally {
      setActionLoading(false);
    }
  };


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
    setExpandedId(null);
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
                visibleTransactions.flatMap((item) => {
                  const isOpen = expandedId === item.id;
                  return [
                    <tr
                      key={item.id}
                      className={`border-b border-blue-100 last:border-0 transition-colors ${
                        isOpen ? "bg-blue-50/60" : ""
                      }`}
                    >
                      <td className="p-3 font-semibold">{item.id}</td>
                      <td className="p-3">{item.customer}</td>
                      <td className="p-3">{item.flight}</td>
                      <td className="p-3">{formatRupiah(item.amount)}</td>

                      {/* status transaksi */}
                      <td className="p-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
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
                          onClick={() =>
                            setExpandedId((prev) => (prev === item.id ? null : item.id))
                          }
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors ${
                            isOpen
                              ? "bg-slate-500 hover:bg-slate-600"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {isOpen ? "Tutup" : "View Detail"}
                        </button>
                      </td>
                    </tr>,

                    // baris detail inline — muncul tepat di bawah baris yang diklik
                    isOpen && (
                      <tr key={`detail-${item.id}`} className="bg-blue-50/40">
                        <td colSpan={6} className="px-4 pb-4 pt-0">
                          <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                              <h4 className="font-bold text-slate-800">Detail Transaksi #{item.id}</h4>
                              <button
                                onClick={() => setExpandedId(null)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2 md:grid-cols-3">
                              <p><span className="font-semibold">Booking Code:</span> {item.bookingCode}</p>
                              <p><span className="font-semibold">Customer:</span> {item.customer}</p>
                              <p><span className="font-semibold">Flight:</span> {item.flight}</p>
                              <p><span className="font-semibold">Created:</span> {new Date(item.createdAt).toLocaleString("id-ID")}</p>
                              <p><span className="font-semibold">Amount:</span> {formatRupiah(item.amount)}</p>
                              <p>
                                <span className="font-semibold">Status:</span>{" "}
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
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
                              </p>
                            </div>

                            {/* pesan hasil aksi */}
                            {actionMessage?.id === item.id && (
                              <p
                                className={`mt-3 rounded-xl px-3 py-2 text-xs font-medium ${
                                  actionMessage.ok
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {actionMessage.text}
                              </p>
                            )}

                            {/* tombol ubah status — tampil untuk semua status */}
                              <div className="mt-4 border-t border-slate-100 pt-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Ubah Status</p>
                                <div className="flex flex-wrap gap-2">
                                  {statusTransitions[item.status].map((opt) => (
                                    <button
                                      key={opt.action}
                                      disabled={actionLoading}
                                      onClick={() =>
                                        setPendingAction({ item, action: opt.action, label: opt.label })
                                      }
                                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-60 ${opt.color}`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>

                                {/* dialog konfirmasi aksi */}
                                {pendingAction?.item.id === item.id && (
                                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                                    <p className="flex-1 text-xs text-amber-800">
                                      Konfirmasi: <span className="font-semibold">{pendingAction.label}</span> untuk booking #{item.id}?
                                    </p>
                                    <button
                                      disabled={actionLoading}
                                      onClick={() => handleAction(pendingAction.item, pendingAction.action)}
                                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                                    >
                                      {actionLoading ? "Menyimpan..." : "Ya, Lanjutkan"}
                                    </button>
                                    <button
                                      disabled={actionLoading}
                                      onClick={() => setPendingAction(null)}
                                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                )}
                              </div>
                          </div>
                        </td>
                      </tr>
                    ),
                  ];
                })

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


      {/* panel detail tidak diperlukan lagi — detail muncul inline di tabel */}

    </AdminShell>
  );
}