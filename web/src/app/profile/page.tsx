"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainNav from "@/components/MainNav";
import { clearSession, getRegisteredUser, getUserSession, isAuthenticated } from "@/lib/auth";

export default function ProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState(() => getUserSession()?.fullName ?? "User SkyIntern");
  const [phoneNumber, setPhoneNumber] = useState(() => getRegisteredUser()?.phoneNumber ?? "081234567890");
  const [city, setCity] = useState("Jakarta");
  const [email] = useState(() => getUserSession()?.email ?? "user@skyintern.com");
  const [saved, setSaved] = useState(false);
  const authenticated = isAuthenticated();

  useEffect(() => {
    if (!authenticated) {
      router.replace("/auth/login?redirect=/profile");
    }
  }, [authenticated, router]);

  if (!authenticated) {
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
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl text-white">
                👤
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-black text-slate-900">{fullName}</p>
                <p className="text-sm text-slate-600">{email}</p>
                <p className="text-xs font-semibold text-blue-600">SkyIntern Silver Member</p>
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
                onClick={() => setSaved(true)}
                className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Save Profile
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
