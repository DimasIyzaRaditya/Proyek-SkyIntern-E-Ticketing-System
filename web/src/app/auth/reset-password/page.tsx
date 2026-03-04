"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import MainNav from "@/components/MainNav";
import { resetPasswordFromApi } from "@/lib/auth-api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!token) {
      setMessage("Token reset tidak ditemukan atau tidak valid.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setMessage("Semua field wajib diisi.");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await resetPasswordFromApi({
        resetToken: token,
        newPassword,
      });

      setSuccess(true);
      setMessage(response.message || "Password berhasil direset. Silakan login.");

      setTimeout(() => {
        router.push("/auth/login");
      }, 1200);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-lg px-6 py-12">
        <section className="rounded-3xl border border-blue-100 bg-white p-8 shadow-lg">
          <h1 className="text-3xl font-black text-slate-900">Reset Password</h1>
          <p className="mt-1 text-sm text-slate-600">Masukkan password baru Anda.</p>

          <form className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Password Baru</label>
              <input
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 outline-none ring-blue-200 focus:ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Konfirmasi Password</label>
              <input
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 outline-none ring-blue-200 focus:ring"
              />
            </div>
            <button
              disabled={loading}
              onClick={() => void handleResetPassword()}
              type="button"
              className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Memproses..." : "Reset Password"}
            </button>
          </form>

          {message && success && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}
          {message && !success && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {message}
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
