"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MainNav from "@/components/MainNav";
import { isAuthenticated, getUserSession } from "@/lib/auth";

function PassengerFormPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [idType, setIdType] = useState("KTP");
  const [idNumber, setIdNumber] = useState("");
  const [nationality, setNationality] = useState("Indonesian");
  const [dob, setDob] = useState("");
  const [idNumberTouched, setIdNumberTouched] = useState(false);

  const idNumberError =
    idNumberTouched && idNumber.trim().length > 0 && idNumber.trim().length < 8
      ? "Nomor identitas minimal 8 karakter"
      : null;

  const isFormValid =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    idNumber.trim().length >= 8 &&
    nationality.trim() !== "" &&
    dob !== "";

  useEffect(() => {
    if (!isAuthenticated()) {
      const redirect = encodeURIComponent(`/booking/passenger?${searchParams.toString()}`);
      router.replace(`/auth/login?redirect=${redirect}`);
      return;
    }
    const session = getUserSession();
    if (session?.fullName) {
      const parts = session.fullName.split(" ");
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" "));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const continueToPayment = () => {
    if (!isFormValid) return;
    const existingBookingId = searchParams.get("existingBookingId") ?? "";
    const params: Record<string, string> = {
      flightId: searchParams.get("flightId") ?? "",
      origin: searchParams.get("origin") ?? "",
      destination: searchParams.get("destination") ?? "",
      departureDate: searchParams.get("departureDate") ?? "",
      returnDate: searchParams.get("returnDate") ?? searchParams.get("departureDate") ?? "",
      adult: searchParams.get("adult") ?? "1",
      child: searchParams.get("child") ?? "0",
      seats: searchParams.get("seats") ?? "",
      seatFlightIds: searchParams.get("seatFlightIds") ?? "",
      extraPrice: searchParams.get("extraPrice") ?? "0",
      pFirstName: firstName,
      pLastName: lastName,
      pIdType: idType,
      pIdNumber: idNumber,
      pNationality: nationality,
      pDob: dob,
    };
    if (existingBookingId) params.existingBookingId = existingBookingId;

    router.push(`/booking/payment?${new URLSearchParams(params).toString()}`);
  };

  return (
    <div className="grid h-dvh grid-rows-[auto_1fr] bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="overflow-y-auto">
        <div className="flex min-h-full items-center justify-center px-6 py-10">
        <section className="w-full max-w-md rounded-3xl border border-blue-100 bg-white p-8 shadow-lg">
          <h1 className="text-center text-3xl font-black text-slate-900">Data Penumpang</h1>
          <p className="mt-1 text-center text-sm text-slate-500">Isi data sesuai identitas resmi yang berlaku.</p>

          <div className="mt-6 space-y-4">
            {/* First Name */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Nama Depan <span className="text-red-500">*</span>
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Nama Belakang <span className="text-red-500">*</span>
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
            </div>

            {/* ID Type */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Jenis Identitas <span className="text-red-500">*</span>
              </label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 focus:border-blue-400 focus:outline-none"
              >
                <option>KTP</option>
                <option>Passport</option>
                <option>SIM</option>
              </select>
            </div>

            {/* ID Number */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Nomor Identitas <span className="text-red-500">*</span>
              </label>
              <input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                onBlur={() => setIdNumberTouched(true)}
                placeholder="Minimal 8 karakter"
                className={`w-full rounded-2xl border px-4 py-3 focus:outline-none ${
                  idNumberError
                    ? "border-red-400 bg-red-50 focus:border-red-400"
                    : "border-blue-100 bg-blue-50 focus:border-blue-400"
                }`}
              />
              {idNumberError && (
                <p className="mt-1 text-xs text-red-500">{idNumberError}</p>
              )}
            </div>

            {/* Nationality */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Kewarganegaraan <span className="text-red-500">*</span>
              </label>
              <input
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="Indonesian"
                className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Tanggal Lahir <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 focus:border-blue-400 focus:outline-none"
              />
            </div>

            {!isFormValid && (
              <p className="text-center text-xs text-slate-400">
                Lengkapi semua data untuk melanjutkan ke pembayaran.
              </p>
            )}

            <button
              onClick={continueToPayment}
              disabled={!isFormValid}
              className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Lanjutkan ke Pembayaran
            </button>
          </div>
        </section>
        </div>
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
