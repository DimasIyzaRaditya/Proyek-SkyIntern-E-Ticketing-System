"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import MainNav from "@/components/MainNav";
import { formatRupiah } from "@/lib/currency";
import { isAuthenticated } from "@/lib/auth";
import { getFlightDetailFromApi, type FlightCardItem } from "@/lib/flight-api";

const extractAirportCode = (value: string) => {
  const match = value.match(/\(([A-Z]{3})\)$/);
  if (match) return match[1];
  return value.split(" - ")[0].trim();
};

export default function PaymentSummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [gateway, setGateway] = useState<"Dummy Payment" | "Midtrans Sandbox">("Dummy Payment");
  const [countdown, setCountdown] = useState(15 * 60);
  const [paid, setPaid] = useState(false);
  const [gatewaySimulated, setGatewaySimulated] = useState(false);
  const [flight, setFlight] = useState<FlightCardItem | null>(null);
  const [isLoadingFlight, setIsLoadingFlight] = useState(true);
  const [flightError, setFlightError] = useState<string | null>(null);
  const authenticated = isAuthenticated();

  const flightId = searchParams.get("flightId") ?? "";
  const adult = Number(searchParams.get("adult") ?? "1");
  const child = Number(searchParams.get("child") ?? "0");
  const extraPrice = Number(searchParams.get("extraPrice") ?? "0");

  const fallbackFlight = useMemo<FlightCardItem>(() => ({
    id: flightId || "-",
    flightNumber: (searchParams.get("flightNumber") ?? flightId) || "-",
    airline: searchParams.get("airlineName") ?? "Airline",
    logo: "✈️",
    aircraft: "Aircraft",
    origin: searchParams.get("origin") ?? "Origin",
    destination: searchParams.get("destination") ?? "Destination",
    departureTime: "-",
    arrivalTime: "-",
    duration: "-",
    price: Number(searchParams.get("price") ?? "0"),
    facilities: ["Cabin Bag 7kg"],
  }), [flightId, searchParams]);

  useEffect(() => {
    let isMounted = true;

    const loadFlight = async () => {
      if (!flightId) {
        setFlight(fallbackFlight);
        setIsLoadingFlight(false);
        return;
      }

      try {
        setIsLoadingFlight(true);
        setFlightError(null);
        const data = await getFlightDetailFromApi(flightId);
        if (!isMounted) return;
        setFlight(data);
      } catch (error) {
        if (!isMounted) return;
        setFlight(fallbackFlight);
        setFlightError(error instanceof Error ? error.message : "Gagal memuat data flight dari backend.");
      } finally {
        if (isMounted) {
          setIsLoadingFlight(false);
        }
      }
    };

    loadFlight();

    return () => {
      isMounted = false;
    };
  }, [fallbackFlight, flightId]);

  const activeFlight = flight ?? fallbackFlight;

  const ticketPrice = activeFlight.price * adult + Math.round(activeFlight.price * 0.75 * child);
  const tax = Math.round(ticketPrice * 0.1);
  const adminFee = 12000;
  const totalPrice = ticketPrice + tax + adminFee + extraPrice;

  useEffect(() => {
    if (!authenticated) {
      const redirect = encodeURIComponent(`/booking/payment?${searchParams.toString()}`);
      router.replace(`/auth/login?redirect=${redirect}`);
    }
  }, [authenticated, router, searchParams]);

  useEffect(() => {
    if (paid) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paid]);

  const countdownText = `${Math.floor(countdown / 60)
    .toString()
    .padStart(2, "0")}:${(countdown % 60).toString().padStart(2, "0")}`;

  const handlePayNow = () => {
    if (!gatewaySimulated) return;
    setPaid(true);

    const seats = (searchParams.get("seats") ?? "12A").split(",");
    const origin = extractAirportCode(searchParams.get("origin") ?? "Jakarta, Indonesia (CGK)");
    const destination = extractAirportCode(searchParams.get("destination") ?? "Denpasar, Indonesia (DPS)");

    const query = new URLSearchParams({
      flightNumber: activeFlight.flightNumber,
      airline: activeFlight.airline,
      origin,
      destination,
      departureDate: searchParams.get("departureDate") ?? "2026-03-15",
      seat: seats[0] ?? "12A",
      fullName: searchParams.get("fullName") ?? "Passenger",
    });

    setTimeout(() => {
      router.push(`/bookings?${query.toString()}`);
    }, 700);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
        <MainNav />
      </div>
    );
  }

  if (isLoadingFlight) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
        <MainNav />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <section className="rounded-3xl border border-blue-100 bg-white p-8 text-sm text-slate-600 shadow-lg">
            Memuat ringkasan penerbangan dari backend...
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dbeafe_0%,#eef5ff_45%,#dbeafe_100%)]">
      <MainNav />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <section className="rounded-3xl border border-blue-100 bg-white p-8 shadow-lg">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-black text-slate-900">Payment Summary Page</h1>
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-mono text-xl font-bold text-red-600">{countdownText}</div>
          </div>

          <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            {flightError && <p className="text-xs text-amber-700">{flightError}</p>}
            <div className="flex justify-between text-sm"><span>Ticket Price</span><span>{formatRupiah(ticketPrice)}</span></div>
            <div className="flex justify-between text-sm"><span>Tax</span><span>{formatRupiah(tax)}</span></div>
            <div className="flex justify-between text-sm"><span>Admin Fee</span><span>{formatRupiah(adminFee)}</span></div>
            <div className="flex justify-between text-sm"><span>Seat Extra</span><span>{formatRupiah(extraPrice)}</span></div>
            <div className="flex justify-between border-t border-blue-200 pt-3 text-lg font-bold text-blue-700"><span>Total Price</span><span>{formatRupiah(totalPrice)}</span></div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-slate-700">Choose Payment Method</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Bank Transfer", "Credit Card", "E-Wallet"].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    paymentMethod === method
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-blue-100 bg-white text-slate-700 hover:bg-blue-50"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Simulasi Payment Gateway</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {(["Dummy Payment", "Midtrans Sandbox"] as const).map((provider) => (
                <button
                  key={provider}
                  onClick={() => {
                    setGateway(provider);
                    setGatewaySimulated(false);
                  }}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                    gateway === provider
                      ? "bg-blue-600 text-white"
                      : "border border-blue-200 bg-white text-blue-700"
                  }`}
                >
                  {provider}
                </button>
              ))}
              <button
                onClick={() => setGatewaySimulated(true)}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Simulasikan Gateway
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Provider aktif: <span className="font-semibold text-blue-700">{gateway}</span> • Status: {gatewaySimulated ? "Terhubung" : "Belum disimulasikan"}
            </p>
          </div>

          <button
            onClick={handlePayNow}
            disabled={countdown === 0 || !gatewaySimulated}
            className="mt-8 w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Pay Now
          </button>

          {!gatewaySimulated && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              Silakan klik <span className="font-semibold">Simulasikan Gateway</span> sebelum melakukan pembayaran.
            </div>
          )}

          {paid && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Pembayaran berhasil via {paymentMethod}. Flow booking selesai end-to-end.
            </div>
          )}
          {countdown === 0 && !paid && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Waktu pembayaran habis. Silakan ulangi proses booking.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
