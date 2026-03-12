"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload, ImageIcon } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { getAdminAirportById, updateAdminAirport, uploadAdminAirportCityImage } from "@/lib/admin-api";

type AirportForm = {
  name: string;
  city: string;
  country: string;
  timezone: string;
  cityImageUrl: string;
};

export default function AdminAirportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const airportId = Number.parseInt(params.id, 10);

  const [form, setForm] = useState<AirportForm>({
    name: "",
    city: "",
    country: "",
    timezone: "",
    cityImageUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    const loadAirport = async () => {
      if (Number.isNaN(airportId)) {
        setMessage("Invalid airport ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setMessage("");

      try {
        const airport = await getAdminAirportById(airportId);
        setForm({
          name: airport.name,
          city: airport.city,
          country: airport.country,
          timezone: airport.timezone,
          cityImageUrl: airport.cityImageUrl ?? "",
        });
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load airport details.");
      } finally {
        setLoading(false);
      }
    };

    void loadAirport();
  }, [airportId]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.city.trim() || !form.country.trim() || !form.timezone.trim()) {
      setMessage("Name, City, Country, and Timezone are required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await updateAdminAirport(airportId, {
        name: form.name.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        timezone: form.timezone.trim(),
        cityImageUrl: form.cityImageUrl.trim() || undefined,
      });

      setMessage("Airport updated successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update airport.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadMessage("");
    try {
      const url = await uploadAdminAirportCityImage(airportId, file);
      setForm((prev) => ({ ...prev, cityImageUrl: url }));
      setUploadMessage("✅ Foto berhasil diupload ke MinIO.");
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Gagal mengupload foto.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminShell title="Manage Airport" description="Edit airport information or delete airport from this page.">
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/admin/airports"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="text-sm font-medium text-slate-500">ID: {Number.isNaN(airportId) ? "-" : airportId}</div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-600">Loading airport details...</p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Airport Name" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
              <input value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} placeholder="City" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
              <input value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} placeholder="Country" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
              <input value={form.timezone} onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))} placeholder="Timezone" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />

              {/* City Photo — MinIO upload or URL */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Foto Kota — ditampilkan di kartu penerbangan halaman utama
                </label>

                {/* Current / preview image */}
                {form.cityImageUrl ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.cityImageUrl}
                      alt="City photo preview"
                      className="h-36 w-full rounded-xl object-cover border border-blue-100"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <span className="absolute top-2 left-2 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] text-white font-semibold">Preview</span>
                  </div>
                ) : (
                  <div className="flex h-28 w-full items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 text-slate-400">
                    <ImageIcon className="mr-2 h-5 w-5" /> Belum ada foto
                  </div>
                )}

                {/* Upload button */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Mengupload…" : "Upload ke MinIO"}
                  </button>
                  <span className="text-xs text-slate-400">atau tempel URL di bawah</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFileUpload(file);
                    e.target.value = "";
                  }}
                />

                {/* Manual URL */}
                <input
                  value={form.cityImageUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, cityImageUrl: event.target.value }))}
                  placeholder="https://… (atau gunakan tombol upload)"
                  className="w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm"
                />

                {uploadMessage && (
                  <p className={`text-xs ${uploadMessage.startsWith("✅") ? "text-emerald-700" : "text-rose-700"}`}>
                    {uploadMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                disabled={saving}
                onClick={() => void handleSave()}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Save className="h-4 w-4" /> Save Changes
              </button>
              <button
                disabled={saving}
                onClick={() => router.push("/admin/airports")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {message && <p className="mt-3 text-sm text-rose-700">{message}</p>}
      </section>
    </AdminShell>
  );
}
