"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MainNav from "@/components/MainNav";
import { isAuthenticated } from "@/lib/auth";

export default function PassengerFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authenticated = isAuthenticated();

  const [fullName, setFullName] = useState("Abimanyu Pratama");
  const [passportId, setPassportId] = useState("3174010101010001");
  const [dob, setDob] = useState("1998-05-20");

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
      fullName,
      passportId,
      dob,
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
          <h1 className="text-3xl font-black text-slate-900">Passenger Form Page</h1>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Full Name</label>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">ID / Passport Number (sesuai aturan penerbangan)</label>
              <input value={passportId} onChange={(event) => setPassportId(event.target.value)} className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Date of Birth</label>
              <input type="date" value={dob} onChange={(event) => setDob(event.target.value)} className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3" />
            </div>
            <button onClick={continueToPayment} className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
              Continue
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
