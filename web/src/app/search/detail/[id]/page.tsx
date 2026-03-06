"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import MainNav from "@/components/MainNav";
import { formatRupiah } from "@/lib/currency";
import { getFlightDetailFromApi, type FlightCardItem } from "@/lib/flight-api";

function FlightDetailPageContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [flight, setFlight] = useState<FlightCardItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const origin = searchParams.get("origin") ?? "CGK - Jakarta";
  const destination = searchParams.get("destination") ?? "DPS - Denpasar";
  const departureDate = searchParams.get("departureDate") ?? "2026-03-15";
  const returnDate = searchParams.get("returnDate") ?? departureDate;
  const adult = searchParams.get("adult") ?? "1";
  const child = searchParams.get("child") ?? "0";

  useEffect(() => {
    let isMounted = true;

    const loadFlightDetail = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await getFlightDetailFromApi(params.id);
        if (!isMounted) return;
        setFlight(data);
      } catch (error) {
        if (!isMounted) return;
        setFlight(null);
        setErrorMessage(error instanceof Error ? error.message : "Gagal memuat detail flight.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFlightDetail();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
        <MainNav />
        <main className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-3xl border border-blue-200 bg-white p-8 text-center text-slate-700">Memuat detail flight dari backend...</div>
        </main>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
        <MainNav />
        <main className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center text-red-700">{errorMessage ?? "Flight tidak ditemukan."}</div>
        </main>
      </div>
    );
  }

  const query = new URLSearchParams({
    flightId: flight.id,
    airlineName: flight.airline,
    flightNumber: flight.flightNumber,
    price: String(flight.price),
    origin,
    destination,
    departureDate,
    returnDate,
    adult,
    child,
  });

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <section className="rounded-3xl border border-blue-100 bg-white p-8 shadow-lg">
          <h1 className="text-3xl font-black text-slate-900">Flight Detail Page</h1>

          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                {flight.logo.startsWith("http") ? (
                  <img src={flight.logo} alt={flight.airline} className="h-10 w-10 rounded-full object-contain" />
                ) : (
                  <span className="text-3xl">{flight.logo}</span>
                )}
                <p className="text-2xl font-bold text-slate-900">{flight.airline}</p>
              </div>
              <p className="mt-2 text-slate-600">Aircraft Type: {flight.aircraft}</p>
              <p className="mt-1 text-slate-600">Route: {origin} → {destination}</p>
              <p className="mt-1 text-slate-600">Time: {flight.departureTime} - {flight.arrivalTime} ({flight.duration})</p>
              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-800">Facilities</p>
                <ul className="mt-1 list-disc pl-5 text-sm text-slate-600">
                  {flight.facilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-right">
              <p className="text-sm text-slate-600">Price</p>
              <p className="text-3xl font-black text-blue-700">{formatRupiah(flight.price)}</p>
              <Link
                href={`/booking/seat?${query.toString()}`}
                className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Select Seat
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function FlightDetailPage() {
  return (
    <Suspense>
      <FlightDetailPageContent />
    </Suspense>
  );
}
