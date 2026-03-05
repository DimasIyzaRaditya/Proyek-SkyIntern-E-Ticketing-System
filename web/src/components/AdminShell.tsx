"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import MainNav from "@/components/MainNav";
import AdminNav from "@/components/AdminNav";
import { getRole } from "@/lib/auth";

type AdminShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export default function AdminShell({ title, description, children }: AdminShellProps) {
  const authSnapshot = useSyncExternalStore(
    () => () => {},
    () => `hydrated::${getRole() ?? "guest"}`,
    () => "ssr::guest",
  );

  const [hydrationState, role] = authSnapshot.split("::");
  const isHydrated = hydrationState === "hydrated";
  const isAllowed = role === "admin";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {!isHydrated ? (
          <section className="rounded-3xl border border-blue-100 bg-white p-6 text-center shadow-sm sm:p-8">
            <p className="text-xs text-slate-600 sm:text-sm">Memuat akses admin...</p>
          </section>
        ) : isAllowed ? (
          <>
            <AdminNav />
            <section className="mb-6 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
              <h1 className="text-xl font-black text-slate-900 sm:text-2xl">{title}</h1>
              {description && <p className="mt-1 text-xs text-slate-600 sm:text-sm">{description}</p>}
            </section>
            {children}
          </>
        ) : (
          <section className="rounded-3xl border border-red-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <h1 className="text-xl font-black text-red-700 sm:text-2xl">Akses Admin Ditolak</h1>
            <p className="mt-2 text-xs text-slate-600 sm:text-sm">Silakan login menggunakan akun admin terlebih dahulu.</p>
            <Link href="/auth/login" className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 sm:px-5 sm:py-2.5 sm:text-sm">
              Ke Halaman Login
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
