"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import MainNav from "@/components/MainNav";
import { getRegisteredUser, setAdminSession, setUserSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const ADMIN_USERNAME = "admin@skyintern.com";
  const ADMIN_PASSWORD = "Admin123!";

  const handleLogin = () => {
    if (!email || !password) {
      setMessage("Isi email dan password terlebih dahulu.");
      return;
    }

    const redirectTarget = searchParams.get("redirect") ?? "/search";

    if (email === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setAdminSession();
      setMessage("Login admin berhasil. Mengarahkan ke dashboard...");
      router.push("/admin");
      return;
    }

    if (!email.trim().toLowerCase().endsWith("@gmail.com")) {
      setMessage("Untuk customer, login menggunakan akun Gmail yang didaftarkan.");
      return;
    }

    const registeredUser = getRegisteredUser();

    if (!registeredUser) {
      setMessage("Akun belum terdaftar. Silakan register terlebih dahulu.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== registeredUser.email || password !== registeredUser.password) {
      setMessage("Email atau password tidak sesuai dengan data registrasi.");
      return;
    }

    setUserSession({
      fullName: registeredUser.fullName,
      email: registeredUser.email,
    });
    setMessage("Login berhasil. Mengarahkan...");
    router.push(redirectTarget);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6 lg:py-12">
        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg sm:p-8">
          <h2 className="text-center text-3xl font-black text-slate-900">Login</h2>
          <p className="mt-1 text-center text-sm text-slate-600">Masuk ke akun SkyIntern Anda.</p>

          <form className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Email Gmail</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="nama@gmail.com" className="w-full rounded-2xl border border-blue-100 bg-blue-50 py-3 pl-10 pr-4 outline-none ring-blue-200 focus:ring" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-blue-100 bg-blue-50 py-3 pl-10 pr-11 outline-none ring-blue-200 focus:ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-blue-700"
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-blue-200" /> Remember Me
              </label>
              <Link href="/auth/forgot-password" className="font-semibold text-blue-600 hover:text-blue-700">Forgot Password?</Link>
            </div>

            <button onClick={handleLogin} type="button" className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700">Login</button>
          </form>

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-slate-600">
            <p className="font-semibold text-blue-700">Demo Admin Credential</p>
            <p>Username: admin@skyintern.com</p>
            <p>Password: Admin123!</p>
          </div>

          {message && <p className="mt-3 text-center text-sm font-medium text-blue-700">{message}</p>}

          <p className="mt-5 text-center text-sm text-slate-600">
            Belum punya akun? <Link href="/auth/register" className="font-semibold text-blue-600 hover:text-blue-700">Create Account</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
