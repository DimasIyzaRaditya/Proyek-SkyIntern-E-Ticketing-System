"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { getAdminAirportById, updateAdminAirport } from "@/lib/admin-api";

type AirportForm = {
  name: string;
  city: string;
  country: string;
  timezone: string;
};

export default function AdminAirportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const airportId = Number.parseInt(params.id, 10);

  const [form, setForm] = useState<AirportForm>({
    name: "",
    city: "",
    country: "",
    timezone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
      });

      setMessage("Airport updated successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update airport.");
    } finally {
      setSaving(false);
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
            <div className="grid gap-3 md:grid-cols-4">
              <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Name" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
              <input value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} placeholder="City" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
              <input value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} placeholder="Country" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
              <input value={form.timezone} onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))} placeholder="Timezone" className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2" />
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
