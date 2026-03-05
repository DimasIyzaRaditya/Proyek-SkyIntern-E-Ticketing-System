"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ImagePlus, Save, Trash2, ArrowLeft, X } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import {
  deleteAdminAirline,
  getAdminAirlineById,
  type AdminAirline,
  updateAdminAirline,
} from "@/lib/admin-api";

type AirlineForm = {
  code: string;
  name: string;
  country: string;
};

export default function AdminAirlineDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const airlineId = Number.parseInt(params.id, 10);

  const [airline, setAirline] = useState<AdminAirline | null>(null);
  const [form, setForm] = useState<AirlineForm>({ code: "", name: "", country: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const resetLogoSelection = () => {
    setLogoFile(null);
    setLogoPreview(airline?.logo ?? null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const loadAirline = async () => {
    if (Number.isNaN(airlineId)) {
      setMessage("ID maskapai tidak valid.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const data = await getAdminAirlineById(airlineId);
      setAirline(data);
      setForm({ code: data.code, name: data.name, country: data.country });
      setLogoPreview(data.logo);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat detail maskapai.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAirline();
  }, [airlineId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setLogoFile(file);
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoPreview(airline?.logo ?? null);
    }
  };

  const handleSave = async () => {
    if (!airline || !form.code.trim() || !form.name.trim() || !form.country.trim()) return;

    setSaving(true);
    setMessage("");

    try {
      const updated = await updateAdminAirline(airline.id, {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        country: form.country.trim(),
        logo: logoFile ?? undefined,
      });

      setAirline(updated);
      setForm({ code: updated.code, name: updated.name, country: updated.country });
      setLogoPreview(updated.logo);
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage("Maskapai berhasil diperbarui.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengupdate maskapai.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!airline) return;

    const confirmed = window.confirm(`Hapus maskapai ${airline.name}?`);
    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    try {
      await deleteAdminAirline(airline.id);
      router.push("/admin/airlines");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menghapus maskapai.");
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Kelola Maskapai" description="Edit data, upload logo baru, atau hapus maskapai dari halaman ini.">
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/admin/airlines"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <div className="text-sm font-medium text-slate-500">ID: {Number.isNaN(airlineId) ? "-" : airlineId}</div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-600">Memuat detail maskapai...</p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                value={form.code}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                placeholder="Code"
                className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
              />
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Airline Name"
                className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
              />
              <input
                value={form.country}
                onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
                placeholder="Country"
                className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2"
              />
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-slate-600">Logo Maskapai (pilih gambar baru jika ingin mengganti)</p>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-blue-100 bg-blue-50">
                    <Image src={logoPreview} alt="Logo preview" fill className="object-contain p-1" unoptimized />
                    <button
                      onClick={resetLogoSelection}
                      className="absolute right-0.5 top-0.5 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-300">
                    <ImagePlus className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="logo-upload-detail"
                  />
                  <label
                    htmlFor="logo-upload-detail"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    <ImagePlus className="h-4 w-4" /> Pilih Gambar
                  </label>
                  {logoFile && <p className="mt-1 text-xs text-slate-500">{logoFile.name}</p>}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                disabled={saving}
                onClick={() => void handleSave()}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Save className="h-4 w-4" /> Simpan Perubahan
              </button>
              <button
                disabled={saving}
                onClick={() => void handleDelete()}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Trash2 className="h-4 w-4" /> Hapus Maskapai
              </button>
            </div>
          </>
        )}

        {message && <p className="mt-3 text-sm text-rose-700">{message}</p>}
      </section>
    </AdminShell>
  );
}