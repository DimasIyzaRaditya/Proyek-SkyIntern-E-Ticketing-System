"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MainNav from "@/components/MainNav";
import { isAuthenticated, getUserSession } from "@/lib/auth";
import { getPassengerProfile } from "@/lib/passenger-profile";
import { validateDateOfBirth, validateIdentityNumber } from "@/lib/identity-validation";

function PassengerFormPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [idType, setIdType] = useState<"KTP" | "PASSPORT">("KTP");
  const [idNumber, setIdNumber] = useState("");
  const [nationality, setNationality] = useState("Indonesian");
  const [dob, setDob] = useState("");
  const [idNumberTouched, setIdNumberTouched] = useState(false);
  const [dobTouched, setDobTouched] = useState(false);

  const handleIdentityTypeChange = (nextType: "KTP" | "PASSPORT") => {
    setIdType(nextType);
    setIdNumber((prev) => {
      if (nextType === "KTP") {
        return prev.replace(/\D/g, "").slice(0, 16);
      }
      return prev.replace(/[^A-Za-z0-9]/g, "").slice(0, 20);
    });
  };

  const handleIdentityNumberChange = (value: string) => {
    if (idType === "KTP") {
      setIdNumber(value.replace(/\D/g, "").slice(0, 16));
      return;
    }
    setIdNumber(value.replace(/[^A-Za-z0-9]/g, "").slice(0, 20));
  };

  const idNumberError = idNumberTouched ? validateIdentityNumber(idType, idNumber) : null;
  const dobError = dobTouched ? validateDateOfBirth(dob) : null;

  const isFormValid =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    validateIdentityNumber(idType, idNumber) === null &&
    nationality.trim() !== "" &&
    validateDateOfBirth(dob) === null;

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

    const savedPassengerProfile = getPassengerProfile(session?.id);
    if (savedPassengerProfile) {
      setFirstName(savedPassengerProfile.firstName);
      setLastName(savedPassengerProfile.lastName);
      setIdType(savedPassengerProfile.idType);
      setIdNumber(savedPassengerProfile.idNumber);
      setNationality(savedPassengerProfile.nationality);
      setDob(savedPassengerProfile.dateOfBirth);
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
    const promoId = searchParams.get("promoId") ?? "";
    if (promoId) params.promoId = promoId;
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
                onChange={(e) => handleIdentityTypeChange(e.target.value === "PASSPORT" ? "PASSPORT" : "KTP")}
                className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 focus:border-blue-400 focus:outline-none"
              >
                <option>KTP</option>
                <option value="PASSPORT">Passport</option>
              </select>
            </div>

            {/* ID Number */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Nomor Identitas <span className="text-red-500">*</span>
              </label>
              <input
                value={idNumber}
                onChange={(e) => handleIdentityNumberChange(e.target.value)}
                onBlur={() => setIdNumberTouched(true)}
                placeholder={idType === "KTP" ? "16 digit angka" : "8-20 karakter alfanumerik"}
                inputMode={idType === "KTP" ? "numeric" : "text"}
                maxLength={idType === "KTP" ? 16 : 20}
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
                onBlur={() => setDobTouched(true)}
                max={new Date().toISOString().slice(0, 10)}
                className={`w-full rounded-2xl border px-4 py-3 focus:outline-none ${
                  dobError
                    ? "border-red-400 bg-red-50 focus:border-red-400"
                    : "border-blue-100 bg-blue-50 focus:border-blue-400"
                }`}
              />
              {dobError && (
                <p className="mt-1 text-xs text-red-500">{dobError}</p>
              )}
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
