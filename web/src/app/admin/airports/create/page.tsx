"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { createAdminAirport } from "@/lib/admin-api";

type AirportForm = {
  name: string;
  city: string;
  country: string;
  timezone: string;
};

export default function AdminAirportCreatePage() {
  const router = useRouter();
  const [form, setForm] = useState<AirportForm>({
    name: "",
    city: "",
    country: "Indonesia",
    timezone: "Asia/Jakarta",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    if (!form.name.trim() || !form.city.trim() || !form.country.trim() || !form.timezone.trim()) {
      setMessage("Name, City, Country, and Timezone are required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await createAdminAirport({
        name: form.name.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        timezone: form.timezone.trim(),
      });

      router.push("/admin/airports");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add airport.");
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Add Airport" description="Create a new airport and save it directly to backend.">
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <Link
            href="/admin/airports"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Name" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} placeholder="City" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} placeholder="Country" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <input value={form.timezone} onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))} placeholder="Timezone" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
          <button disabled={saving} onClick={() => void handleSave()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 md:col-span-4">
            <Plus className="h-4 w-4" /> Add Airport
          </button>
        </div>

        {message && <p className="mt-3 text-sm text-rose-700">{message}</p>}
      </section>
    </AdminShell>
  );
}
