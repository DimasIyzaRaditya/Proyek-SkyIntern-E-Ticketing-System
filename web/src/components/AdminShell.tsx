"use client";

import { useMemo } from "react";
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
  const isAllowed = useMemo(() => {
    if (typeof window === "undefined") return false;
    return getRole() === "admin";
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-7xl px-6 py-8">
        {isAllowed ? (
          <>
            <AdminNav />
            <section className="mb-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <h1 className="text-2xl font-black text-slate-900">{title}</h1>
              {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
            </section>
            {children}
          </>
        ) : (
          <section className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-black text-red-700">Akses Admin Ditolak</h1>
            <p className="mt-2 text-sm text-slate-600">Silakan login menggunakan akun admin terlebih dahulu.</p>
            <Link href="/auth/login" className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              Ke Halaman Login
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
