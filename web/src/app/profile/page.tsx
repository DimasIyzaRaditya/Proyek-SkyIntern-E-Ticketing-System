"use client";

import Link from "next/link";
import Image from "next/image";
import { type ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainNav from "@/components/MainNav";
import { clearSession, getUserSession, isAuthenticated, setUserSession } from "@/lib/auth";
import { getProfileFromApi, updateProfileFromApi } from "@/lib/auth-api";

export default function ProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState(() => getUserSession()?.fullName ?? "User SkyIntern");
  const [phoneNumber, setPhoneNumber] = useState(() => getUserSession()?.phoneNumber ?? "");
  const [avatarUrl, setAvatarUrl] = useState(() => getUserSession()?.avatarUrl ?? "");
  const [city, setCity] = useState("Jakarta");
  const [email, setEmail] = useState(() => getUserSession()?.email ?? "user@skyintern.com");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const authenticated = isAuthenticated();

  useEffect(() => {
    if (!authenticated) {
      router.replace("/auth/login?redirect=/profile");
      return;
    }

    const loadProfile = async () => {
      try {
        const profile = await getProfileFromApi();
        setFullName(profile.fullName);
        setPhoneNumber(profile.phoneNumber ?? "");
        setAvatarUrl(profile.avatarUrl ?? "");
        setEmail(profile.email);
        setUserSession(profile);
      } catch {
        clearSession();
        router.replace("/auth/login?redirect=/profile");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [authenticated, router]);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("File harus berupa gambar.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;

      try {
        const profile = await updateProfileFromApi({ avatarUrl: result });
        setUserSession(profile);
        setAvatarUrl(profile.avatarUrl ?? "");
        setSaved(true);
        setMessage("Foto profil berhasil diperbarui.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Gagal upload foto profil.");
      }
    };
    reader.readAsDataURL(file);
  };

  if (!authenticated || loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
        <MainNav />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <section className="rounded-3xl border border-blue-100 bg-white p-8 text-center text-sm font-semibold text-slate-600 shadow-lg">
            Memeriksa sesi login...
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-blue-100 bg-white p-8 shadow-lg">
            <h1 className="text-3xl font-black text-slate-900">Profile Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Kelola akun, lihat statistik perjalanan, dan update data pribadi Anda.</p>

            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="h-20 w-20 overflow-hidden rounded-full border border-blue-200 bg-white">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Foto profil" width={80} height={80} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">👤</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-black text-slate-900">{fullName}</p>
                <p className="text-sm text-slate-600">{email}</p>
                <p className="text-xs font-semibold text-blue-600">SkyIntern Silver Member</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="mt-2 block text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:font-semibold file:text-white hover:file:bg-blue-700"
                />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold text-slate-600">Total Booking</p>
                <p className="mt-1 text-2xl font-black text-slate-900">12</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-semibold text-slate-600">Flight Points</p>
                <p className="mt-1 text-2xl font-black text-emerald-700">8.450</p>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-xs font-semibold text-slate-600">Membership</p>
                <p className="mt-1 text-2xl font-black text-violet-700">Silver</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Full Name</label>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 outline-none ring-blue-200 focus:ring" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Phone Number</label>
                  <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 outline-none ring-blue-200 focus:ring" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">City</label>
                  <input value={city} onChange={(event) => setCity(event.target.value)} className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 outline-none ring-blue-200 focus:ring" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
                <input value={email} readOnly className="w-full rounded-2xl border border-blue-100 bg-slate-100 px-4 py-3 text-slate-500" />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={async () => {
                  setSaving(true);
                  setMessage("");
                  setSaved(false);

                  try {
                    const profile = await updateProfileFromApi({
                      name: fullName.trim(),
                      phone: phoneNumber.trim(),
                    });
                    setUserSession(profile);
                    setAvatarUrl(profile.avatarUrl ?? "");
                    setSaved(true);
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : "Gagal menyimpan profil.");
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                {saving ? "Menyimpan..." : "Save Profile"}
              </button>
              <button
                onClick={() => {
                  clearSession();
                  router.push("/auth/login");
                }}
                className="rounded-2xl border border-red-200 bg-red-50 px-6 py-3 font-semibold text-red-700 hover:bg-red-100"
              >
                Logout
              </button>
            </div>

            {saved && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Profil berhasil disimpan.
              </div>
            )}
            {message && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {message}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg">
              <h2 className="text-xl font-black text-slate-900">Upcoming Trip</h2>
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-700">JKT → DPS</p>
                <p className="mt-1 text-lg font-black text-slate-900">Garuda Indonesia</p>
                <p className="text-sm text-slate-600">14 Mar 2026 • 09:40 WIB</p>
                <p className="mt-2 text-xs font-semibold text-emerald-700">Status: Confirmed</p>
              </div>
              <Link href="/bookings" className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
                Lihat semua booking →
              </Link>
            </section>

            <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg">
              <h2 className="text-xl font-black text-slate-900">Quick Actions</h2>
              <div className="mt-4 grid gap-3">
                <Link href="/search" className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                  Cari Tiket Baru
                </Link>
                <Link href="/bookings" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  Kelola Pesanan
                </Link>
                <Link href="/bookings/e-ticket" className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">
                  Lihat E-Ticket
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
