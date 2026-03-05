"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Plus, X } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { createAdminAirline } from "@/lib/admin-api";

type AirlineForm = {
  code: string;
  name: string;
  country: string;
};

export default function AdminAirlineCreatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<AirlineForm>({ code: "", name: "", country: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setLogoFile(file);
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoPreview(null);
    }
  };

  const resetLogoSelection = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.country.trim()) {
      setMessage("Code, Airline Name, dan Country wajib diisi.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await createAdminAirline({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        country: form.country.trim(),
        logo: logoFile ?? undefined,
      });

      router.push("/admin/airlines");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menambah maskapai.");
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Add Airline" description="Tambahkan maskapai baru beserta logo. Setelah tersimpan, data muncul di tabel dengan kolom Logo, Code, Airline Name, Country, ID, dan Action.">
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/admin/airlines"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-[160px_1fr_1fr_auto]">
          <input value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))} placeholder="Code (GA)" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Airline Name" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} placeholder="Country" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <div className="flex gap-2">
            <button disabled={saving} onClick={() => void handleSave()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              <Plus className="h-4 w-4" /> Add Airline
            </button>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-slate-600">Logo Maskapai (opsional)</p>
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
                id="logo-upload-create"
              />
              <label
                htmlFor="logo-upload-create"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                <ImagePlus className="h-4 w-4" /> Pilih Gambar
              </label>
              {logoFile && <p className="mt-1 text-xs text-slate-500">{logoFile.name}</p>}
            </div>
          </div>
        </div>

        {message && <p className="mt-3 text-sm text-rose-700">{message}</p>}
      </section>
    </AdminShell>
  );
}
