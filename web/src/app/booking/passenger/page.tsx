"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MainNav from "@/components/MainNav";
import { isAuthenticated, getUserSession } from "@/lib/auth";

function PassengerFormPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authenticated = isAuthenticated();
  const session = getUserSession();

  const [title, setTitle] = useState("Mr");
  const [firstName, setFirstName] = useState(() => session?.fullName?.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(() => session?.fullName?.split(" ").slice(1).join(" ") ?? "");
  const [idType, setIdType] = useState("KTP");
  const [idNumber, setIdNumber] = useState("");
  const [nationality, setNationality] = useState("Indonesian");
  const [dob, setDob] = useState("");

  useEffect(() => {
    if (!authenticated) {
      const redirect = encodeURIComponent(`/booking/passenger?${searchParams.toString()}`);
      router.replace(`/auth/login?redirect=${redirect}`);
    }
  }, [authenticated, router, searchParams]);

  const continueToPayment = () => {
    const query = new URLSearchParams({
      flightId: searchParams.get("flightId") ?? "",
      origin: searchParams.get("origin") ?? "",
      destination: searchParams.get("destination") ?? "",
      departureDate: searchParams.get("departureDate") ?? "",
      returnDate: searchParams.get("returnDate") ?? searchParams.get("departureDate") ?? "",
      adult: searchParams.get("adult") ?? "1",
      child: searchParams.get("child") ?? "0",
      seats: searchParams.get("seats") ?? "",
      extraPrice: searchParams.get("extraPrice") ?? "0",
      // passenger fields for booking API
      pTitle: title,
      pFirstName: firstName,
      pLastName: lastName,
      pIdType: idType,
      pIdNumber: idNumber,
      pNationality: nationality,
      pDob: dob,
    });

    router.push(`/booking/payment?${query.toString()}`);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
        <MainNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <section className="rounded-3xl border border-blue-100 bg-white p-8 shadow-lg">
          <h1 className="text-3xl font-black text-slate-900">Data Penumpang</h1>
          <p className="mt-1 text-sm text-slate-500">Isi data sesuai identitas resmi yang berlaku.</p>

          <div className="mt-6 space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Sapaan</label>
              <select value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                <option>Mr</option>
                <option>Mrs</option>
                <option>Ms</option>
              </select>
            </div>

            {/* First Name */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Nama Depan</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Nama Belakang</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3"
              />
            </div>

            {/* ID Type */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Jenis Identitas</label>
              <select value={idType} onChange={(e) => setIdType(e.target.value)} className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                <option>KTP</option>
                <option>Passport</option>
                <option>SIM</option>
              </select>
            </div>

            {/* ID Number */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Nomor Identitas</label>
              <input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="3174010101010001"
                className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3"
              />
            </div>

            {/* Nationality */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Kewarganegaraan</label>
              <input
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="Indonesian"
                className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Tanggal Lahir</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3"
              />
            </div>

            <button
              onClick={continueToPayment}
              disabled={!firstName.trim() || !idNumber.trim()}
              className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Lanjutkan ke Pembayaran
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function PassengerFormPage() {
  return (
    <Suspense>
      <PassengerFormPageContent />
    </Suspense>
  );
}
