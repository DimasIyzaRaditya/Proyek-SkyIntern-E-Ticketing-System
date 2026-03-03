"use client";

import { useState } from "react";
import Link from "next/link";
import MainNav from "@/components/MainNav";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-lg px-6 py-12">
        <section className="rounded-3xl border border-blue-100 bg-white p-8 shadow-lg">
          <h1 className="text-3xl font-black text-slate-900">Forgot Password</h1>
          <p className="mt-1 text-sm text-slate-600">Masukkan email untuk mengirim link reset password.</p>

          <form className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
              <input type="email" placeholder="nama@email.com" className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 outline-none ring-blue-200 focus:ring" />
            </div>
            <button onClick={() => setSent(true)} type="button" className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700">Send Reset</button>
          </form>

          {sent && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Success Notification: Link reset password berhasil dikirim.
            </div>
          )}

          <p className="mt-5 text-center text-sm text-slate-600">
            Kembali ke <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700">Login</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
