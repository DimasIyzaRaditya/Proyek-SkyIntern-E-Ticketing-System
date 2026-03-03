"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import MainNav from "@/components/MainNav";
import { saveRegisteredUser } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = () => {
    if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
      setMessage("Semua field wajib diisi.");
      return;
    }

    if (!email.toLowerCase().endsWith("@gmail.com")) {
      setMessage("Gunakan akun Gmail (contoh: nama@gmail.com).");
      return;
    }

    if (password.length < 6) {
      setMessage("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Konfirmasi password tidak cocok.");
      return;
    }

    saveRegisteredUser({
      fullName,
      email: email.toLowerCase(),
      phoneNumber,
      password,
    });

    setMessage("Registrasi berhasil. Silakan login menggunakan email dan password yang barusan didaftarkan.");
    setTimeout(() => {
      router.push("/auth/login");
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6 lg:py-12">
        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg sm:p-8">
          <h2 className="text-center text-3xl font-black text-slate-900">Register</h2>
          <p className="mt-1 text-center text-sm text-slate-600">Buat akun baru untuk mulai booking.</p>

          <form className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} type="text" placeholder="Nama Lengkap" className="w-full rounded-2xl border border-blue-100 bg-blue-50 py-3 pl-10 pr-4 outline-none ring-blue-200 focus:ring" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Email Gmail</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="nama@gmail.com" className="w-full rounded-2xl border border-blue-100 bg-blue-50 py-3 pl-10 pr-4 outline-none ring-blue-200 focus:ring" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Phone Number</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} type="tel" placeholder="08xxxxxxxxxx" className="w-full rounded-2xl border border-blue-100 bg-blue-50 py-3 pl-10 pr-4 outline-none ring-blue-200 focus:ring" />
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
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Confirm Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-blue-100 bg-blue-50 py-3 pl-10 pr-11 outline-none ring-blue-200 focus:ring"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-blue-700"
                  aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Lihat konfirmasi password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button onClick={handleRegister} type="button" className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700">Register</button>
          </form>

          {message && <p className="mt-4 text-center text-sm font-medium text-blue-700">{message}</p>}

          <p className="mt-5 text-center text-sm text-slate-600">
            Sudah punya akun? <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700">Login</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
