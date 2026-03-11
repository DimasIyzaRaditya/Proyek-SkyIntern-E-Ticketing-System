"use client";

import Link from "next/link";
import Image from "next/image";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MainNav from "@/components/MainNav";
import LazySection from "@/components/LazySection";
import { useMinDelay } from "@/lib/use-min-delay";
import { clearSession, getUserSession, isAuthenticated, setUserSession } from "@/lib/auth";
import { getProfileFromApi, updateProfileFromApi, uploadAvatarToApi } from "@/lib/auth-api";
import { getMyBookingsFromApi } from "@/lib/booking-api";

export default function ProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState(() => getUserSession()?.fullName ?? "User SkyIntern");
  const [phoneNumber, setPhoneNumber] = useState(() => getUserSession()?.phoneNumber ?? "");
  const [avatarUrl, setAvatarUrl] = useState(() => getUserSession()?.avatarUrl ?? "");
  const [email, setEmail] = useState(() => getUserSession()?.email ?? "user@skyintern.com");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showSkeleton = useMinDelay(loading);
  const [message, setMessage] = useState("");
  const authenticated = isAuthenticated();

  type UpcomingTrip = { route: string; airline: string; date: string; status: string } | null;
  const [upcomingTrip, setUpcomingTrip] = useState<UpcomingTrip>(null);

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

    const loadUpcomingTrip = async () => {
      try {
        const allBookings = await getMyBookingsFromApi();
        const upcoming = allBookings.find(
          (b) => b.status === "PENDING" || b.status === "PAID",
        );
        if (upcoming) {
          const origin = upcoming.flight.origin.code ?? upcoming.flight.origin.city;
          const dest = upcoming.flight.destination.code ?? upcoming.flight.destination.city;
          const date = new Intl.DateTimeFormat("id-ID", {
            day: "2-digit", month: "short", year: "numeric",
          }).format(new Date(upcoming.flight.departureTime));
          setUpcomingTrip({
            route: `${origin} \u2192 ${dest}`,
            airline: upcoming.flight.airline.name,
            date,
            status: upcoming.status === "PAID" ? "Confirmed" : "Pending Payment",
          });
        }
      } catch { /* silent */ }
    };

    void loadProfile();
    void loadUpcomingTrip();
  }, [authenticated, router]);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("File harus berupa gambar.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Ukuran file maksimal 5MB.");
      return;
    }

    setAvatarUploading(true);
    setMessage("");

    try {
      // 1. Upload file ke MinIO via backend, dapat URL MinIO kembali
      const profile = await uploadAvatarToApi(file);
      // 2. Update session lokal dengan data terbaru (avatarUrl sudah disimpan di DB)
      setUserSession(profile);
      setAvatarUrl(profile.avatarUrl ?? "");
      setSaved(true);
      setMessage("Foto profil berhasil diperbarui.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal upload foto profil.");
    } finally {
      setAvatarUploading(false);
      // Reset input agar file yang sama bisa dipilih ulang
      if (event.target) event.target.value = "";
    }
  };

  if (!authenticated || showSkeleton) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
        <MainNav />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-blue-100 bg-white p-8 shadow-lg">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="skeleton h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <div className="skeleton h-6 w-40 rounded-lg" />
                  <div className="skeleton h-3.5 w-56 rounded" />
                </div>
              </div>
              {/* Fields */}
              <div className="mt-6 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="skeleton h-3.5 w-24 rounded" />
                    <div className="skeleton h-11 w-full rounded-2xl" />
                  </div>
                ))}
              </div>
              <div className="mt-5 skeleton h-11 w-32 rounded-2xl" />
            </div>
            <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg">
              <div className="skeleton mb-4 h-6 w-32 rounded-lg" />
              <div className="skeleton h-24 w-full rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <LazySection>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-blue-100 bg-white p-4 shadow-lg sm:p-6 md:p-8">
            <h1 className="text-xl font-black text-slate-900 sm:text-2xl md:text-3xl">Profile Dashboard</h1>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">Kelola akun dan update data pribadi Anda.</p>

            <div className="mt-4 flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 sm:mt-6 sm:gap-5 sm:p-4">
              {/* Clickable avatar with camera overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                title="Klik untuk ganti foto profil"
                className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-blue-300 bg-white shadow-sm transition hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:h-20 sm:w-20"
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Foto profil" width={80} height={80} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">👤</div>
                )}
                {/* Dark overlay on hover */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-full bg-black/0 transition-all duration-200 group-hover:bg-black/40">
                  {avatarUploading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <>
                      <svg className="h-5 w-5 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-[9px] font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">Ubah Foto</span>
                    </>
                  )}
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-black text-slate-900 sm:text-xl">{fullName}</p>
                <p className="text-xs text-slate-600 sm:text-sm">{email}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {avatarUploading ? "Mengupload..." : "Ganti Foto Profil"}
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 sm:text-sm">Full Name</label>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm outline-none ring-blue-200 focus:ring sm:px-4 sm:py-3" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 sm:text-sm">Phone Number</label>
                  <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm outline-none ring-blue-200 focus:ring sm:px-4 sm:py-3" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 sm:text-sm">Email</label>
                <input value={email} readOnly className="w-full rounded-2xl border border-blue-100 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 sm:px-4 sm:py-3" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
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
                className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70 sm:px-6 sm:py-3"
              >
                {saving ? "Menyimpan..." : "Save Profile"}
              </button>
              <button
                onClick={() => {
                  clearSession();
                  router.push("/auth/login");
                }}
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 sm:px-6 sm:py-3"
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

          <aside className="space-y-4 sm:space-y-6">
            <section className="rounded-3xl border border-blue-100 bg-white p-4 shadow-lg sm:p-6">
              <h2 className="text-base font-black text-slate-900 sm:text-xl">Upcoming Trip</h2>
              {upcomingTrip ? (
                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-700">{upcomingTrip.route}</p>
                  <p className="mt-1 text-lg font-black text-slate-900">{upcomingTrip.airline}</p>
                  <p className="text-sm text-slate-600">{upcomingTrip.date}</p>
                  <p className="mt-2 text-xs font-semibold text-emerald-700">Status: {upcomingTrip.status}</p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Tidak ada perjalanan mendatang.</p>
              )}
              <Link href="/bookings" className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
                Lihat semua booking →
              </Link>
            </section>

            <section className="rounded-3xl border border-blue-100 bg-white p-4 shadow-lg sm:p-6">
              <h2 className="text-base font-black text-slate-900 sm:text-xl">Quick Actions</h2>
              <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3">
                <Link href="/search" className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 sm:px-4 sm:py-3 sm:text-sm">
                  Cari Tiket Baru
                </Link>
                <Link href="/bookings" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:px-4 sm:py-3 sm:text-sm">
                  Kelola Pesanan
                </Link>
                <Link href="/bookings" className="rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 sm:px-4 sm:py-3 sm:text-sm">
                  Lihat E-Ticket
                </Link>
              </div>
            </section>
          </aside>
        </div>
        </LazySection>

      </main>
    </div>
  );
}
