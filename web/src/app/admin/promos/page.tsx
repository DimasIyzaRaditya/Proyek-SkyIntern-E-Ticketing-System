"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Pencil, Plus, Tag, Trash2, ToggleLeft, ToggleRight, Plane, Globe, X } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import {
  getAdminPromos,
  getAdminFlights,
  createAdminPromo,
  updateAdminPromo,
  deleteAdminPromo,
  type Promo,
  type PromoPayload,
  type AdminFlight,
} from "@/lib/admin-api";

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

const toInputDate = (iso: string) => new Date(iso).toISOString().slice(0, 10);

const today = () => new Date().toISOString().slice(0, 10);

const isCurrentlyActive = (promo: Promo) => {
  if (!promo.isActive) return false;
  const now = new Date();
  return new Date(promo.startDate) <= now && new Date(promo.endDate) >= now;
};

type FormState = {
  title: string;
  description: string;
  discount: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  flightId: number | null;    // null = global
  flightSearch: string;       // text search for flight picker
};

const emptyForm = (): FormState => ({
  title: "",
  description: "",
  discount: "0",
  startDate: today(),
  endDate: today(),
  isActive: true,
  flightId: null,
  flightSearch: "",
});

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [flights, setFlights] = useState<AdminFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [showFlightPicker, setShowFlightPicker] = useState(false);

  // Filter flights for picker based on flight search text
  const filteredFlights = useMemo(() => {
    const kw = form.flightSearch.trim().toLowerCase();
    if (!kw) return flights.slice(0, 30); // show first 30 when empty
    return flights
      .filter((f) =>
        f.flightNumber.toLowerCase().includes(kw) ||
        f.origin.city.toLowerCase().includes(kw) ||
        f.destination.city.toLowerCase().includes(kw) ||
        f.airline.name.toLowerCase().includes(kw),
      )
      .slice(0, 30);
  }, [flights, form.flightSearch]);

  const selectedFlight = useMemo(
    () => form.flightId ? flights.find((f) => f.id === form.flightId) ?? null : null,
    [flights, form.flightId],
  );

  const load = async () => {
    setLoading(true);
    setMessage("");
    try {
      const [promoData, flightData] = await Promise.all([getAdminPromos(), getAdminFlights()]);
      setPromos(promoData);
      setFlights(flightData);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
    setShowFlightPicker(false);
    setShowModal(true);
  };

  const openEdit = (promo: Promo) => {
    setEditingId(promo.id);
    setForm({
      title: promo.title,
      description: promo.description ?? "",
      discount: String(promo.discount),
      startDate: toInputDate(promo.startDate),
      endDate: toInputDate(promo.endDate),
      isActive: promo.isActive,
      flightId: promo.flightId,
      flightSearch: "",
    });
    setFormError("");
    setShowFlightPicker(false);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setShowFlightPicker(false); };

  const handleSave = async () => {
    setFormError("");
    if (!form.title.trim()) { setFormError("Judul promo wajib diisi."); return; }
    if (!form.startDate || !form.endDate) { setFormError("Tanggal wajib diisi."); return; }
    if (form.endDate <= form.startDate) { setFormError("Tanggal akhir harus setelah tanggal awal."); return; }

    const payload: PromoPayload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      discount: Number(form.discount) || 0,
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: form.isActive,
      flightId: form.flightId,
    };

    setSaving(true);
    try {
      if (editingId !== null) {
        await updateAdminPromo(editingId, payload);
      } else {
        await createAdminPromo(payload);
      }
      setIsSuccess(true);
      setMessage(editingId !== null ? "Promo berhasil diperbarui." : "Promo berhasil dibuat.");
      closeModal();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan promo.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleToggleActive = async (promo: Promo) => {
    try {
      await updateAdminPromo(promo.id, { isActive: !promo.isActive });
      setPromos((prev) => prev.map((p) => (p.id === promo.id ? { ...p, isActive: !p.isActive } : p)));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Gagal mengubah status.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Hapus promo ini?")) return;
    try {
      await deleteAdminPromo(id);
      setPromos((prev) => prev.filter((p) => p.id !== id));
      setIsSuccess(true);
      setMessage("Promo berhasil dihapus.");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setIsSuccess(false);
      setMessage(err instanceof Error ? err.message : "Gagal menghapus promo.");
    }
  };

  return (
    <AdminShell title="Manajemen Promo" description="Kelola promo dan banner beserta jadwal tayang di halaman utama.">

      {/* Toast */}
      {message && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold ${isSuccess ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">{promos.length} promo terdaftar</p>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Tambah Promo
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : promos.length === 0 ? (
        <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center text-sm text-slate-500">
          Belum ada promo. Klik <strong>Tambah Promo</strong> untuk membuat yang pertama.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Judul</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Diskon</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Berlaku Untuk</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Tanggal Tayang</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promos.map((promo) => {
                  const active = isCurrentlyActive(promo);
                  return (
                    <tr key={promo.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Tag className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{promo.title}</p>
                            {promo.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1">{promo.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {promo.discount > 0 ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                            {promo.discount}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      {/* Berlaku untuk kolom */}
                      <td className="px-4 py-3">
                        {promo.flight ? (
                          <div className="flex items-center gap-1.5">
                            <Plane className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{promo.flight.flightNumber}</p>
                              <p className="text-[10px] text-slate-400">{promo.flight.origin.city} → {promo.flight.destination.city}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-700">Semua Tiket</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-1.5 text-xs">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          {fmtDate(promo.startDate)} – {fmtDate(promo.endDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => void handleToggleActive(promo)}
                          className="inline-flex items-center gap-1.5"
                          title={promo.isActive ? "Klik untuk nonaktifkan" : "Klik untuk aktifkan"}
                        >
                          {promo.isActive ? (
                            <ToggleRight className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-slate-400" />
                          )}
                          <span className={`text-xs font-semibold ${active ? "text-emerald-600" : promo.isActive ? "text-amber-600" : "text-slate-400"}`}>
                            {active ? "Aktif Tayang" : promo.isActive ? "Dijadwalkan" : "Nonaktif"}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(promo)}
                            className="rounded-lg border border-blue-200 bg-blue-50 p-1.5 text-blue-700 hover:bg-blue-100"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => void handleDelete(promo.id)}
                            className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-blue-100 bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-black text-slate-900">
                {editingId !== null ? "Edit Promo" : "Tambah Promo Baru"}
              </h2>
            </div>

            <div className="space-y-4 px-6 py-5">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">
                  Judul Promo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="cth. Flash Sale Akhir Pekan"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Deskripsi singkat promo (opsional)"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Discount */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Diskon (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.discount}
                  onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">
                    Tanggal Mulai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">
                    Tanggal Akhir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className="shrink-0"
                >
                  {form.isActive ? (
                    <ToggleRight className="h-7 w-7 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-slate-400" />
                  )}
                </button>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {form.isActive ? "Promo Aktif" : "Promo Nonaktif"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {form.isActive
                      ? "Promo akan ditampilkan saat masuk periode tayang."
                      : "Promo tidak akan ditampilkan meski dalam periode."}
                  </p>
                </div>
              </div>

              {/* ── Flight selector ── */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Berlaku Untuk</label>
                {form.flightId === null ? (
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                      <Globe className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">Semua Tiket (Global)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFlightPicker(true)}
                      className="shrink-0 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                    >
                      Pilih Penerbangan
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5">
                      <Plane className="h-4 w-4 shrink-0 text-blue-600" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-blue-700">{selectedFlight?.flightNumber}</p>
                        <p className="text-[11px] text-blue-500">{selectedFlight?.origin.city} → {selectedFlight?.destination.city} · {selectedFlight?.airline.name}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFlightPicker(true)}
                      className="shrink-0 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                    >
                      Ganti
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, flightId: null, flightSearch: "" }))}
                      className="shrink-0 rounded-xl border border-slate-200 p-2.5 text-slate-400 hover:border-red-200 hover:text-red-500"
                      title="Hapus pilihan"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Flight picker dropdown */}
                {showFlightPicker && (
                  <div className="mt-2 rounded-xl border border-blue-100 bg-white shadow-lg">
                    <div className="border-b border-blue-50 p-2">
                      <input
                        autoFocus
                        type="text"
                        value={form.flightSearch}
                        onChange={(e) => setForm((f) => ({ ...f, flightSearch: e.target.value }))}
                        placeholder="Cari nomor penerbangan, kota, atau maskapai..."
                        className="w-full rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {filteredFlights.length === 0 ? (
                        <p className="px-3 py-4 text-center text-xs text-slate-400">Tidak ada penerbangan ditemukan.</p>
                      ) : (
                        filteredFlights.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({ ...prev, flightId: f.id, flightSearch: "", }));
                              setShowFlightPicker(false);
                            }}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-blue-50"
                          >
                            <Plane className="h-4 w-4 shrink-0 text-blue-400" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800">{f.flightNumber}</p>
                              <p className="text-[11px] text-slate-500">{f.origin.city} → {f.destination.city} · {f.airline.name}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : editingId !== null ? "Simpan Perubahan" : "Buat Promo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
