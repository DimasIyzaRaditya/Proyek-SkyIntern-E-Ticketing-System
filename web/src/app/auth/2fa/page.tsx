"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MainNav from "@/components/MainNav";
import { setUserSession } from "@/lib/auth";
import { resendTwoFactorCodeFromApi, verifyTwoFactorLoginWithApi } from "@/lib/auth-api";

function TwoFactorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const twoFactorToken = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "email Anda";
  const redirectTarget = useMemo(() => searchParams.get("redirect") ?? "/dashboard", [searchParams]);

  const handleVerify = async () => {
    if (!twoFactorToken) {
      setIsError(true);
      setMessage("Sesi verifikasi tidak ditemukan. Silakan login ulang.");
      return;
    }

    if (!/^\d{6}$/.test(code.trim())) {
      setIsError(true);
      setMessage("Masukkan 6 digit kode verifikasi.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const session = await verifyTwoFactorLoginWithApi({
        twoFactorToken,
        code: code.trim(),
      });

      setUserSession(
        {
          id: session.user.id,
          fullName: session.user.fullName,
          email: session.user.email,
          phoneNumber: session.user.phoneNumber,
          avatarUrl: session.user.avatarUrl,
          twoFactorEnabled: session.user.twoFactorEnabled,
          role: session.user.role,
        },
        session.token,
        session.refreshToken,
      );

      setIsError(false);
      setMessage("Verifikasi berhasil. Mengarahkan...");
      router.push(session.user.role === "admin" ? "/admin" : redirectTarget);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Verifikasi gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!twoFactorToken) {
      setIsError(true);
      setMessage("Sesi verifikasi tidak ditemukan. Silakan login ulang.");
      return;
    }

    setResending(true);
    setMessage("");

    try {
      const response = await resendTwoFactorCodeFromApi({ twoFactorToken });
      setIsError(false);
      setMessage(response.message || "Kode baru berhasil dikirim.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Gagal mengirim ulang kode.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-lg px-4 py-8 page-enter sm:px-6 lg:py-12">
        <section className="animate-scale-in rounded-3xl border border-blue-100 bg-white p-6 shadow-lg sm:p-8">
          <h2 className="text-center text-3xl font-black text-slate-900">Verifikasi 2FA</h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Masukkan 6 digit kode yang sudah dikirim ke <span className="font-semibold text-slate-800">{email}</span>.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Kode Verifikasi</label>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                type="text"
                inputMode="numeric"
                placeholder="123456"
                className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-center text-2xl tracking-[0.35em] outline-none ring-blue-200 focus:ring"
              />
            </div>

            <button
              disabled={loading}
              onClick={handleVerify}
              type="button"
              className="btn-animate btn-sheen w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Memverifikasi..." : "Verifikasi dan Login"}
            </button>

            <button
              disabled={resending}
              onClick={handleResend}
              type="button"
              className="w-full rounded-2xl border border-blue-200 bg-blue-50 py-3 font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {resending ? "Mengirim ulang..." : "Kirim Ulang Kode"}
            </button>
          </div>

          {message && (
            <p className={`mt-4 text-center text-sm font-medium ${isError ? "text-red-600" : "text-blue-700"}`}>
              {message}
            </p>
          )}

          <p className="mt-5 text-center text-sm text-slate-600">
            Kembali ke <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700">halaman login</Link>
          </p>
        </section>
      </main>
    </div>
  );
}

export default function TwoFactorPage() {
  return (
    <Suspense>
      <TwoFactorPageContent />
    </Suspense>
  );
}
