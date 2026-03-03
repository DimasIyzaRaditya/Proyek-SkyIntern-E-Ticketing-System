"use client";

import { useMemo, useState } from "react";
import { RefreshCcw, Save } from "lucide-react";
import AdminShell from "@/components/AdminShell";

type SeatStatus = "available" | "occupied";

export default function AdminSeatsPage() {
  const [aircraftType, setAircraftType] = useState<"Boeing 737" | "ATR 72">("Boeing 737");
  const [seatStatusMap, setSeatStatusMap] = useState<Record<string, SeatStatus>>({});

  const layout = useMemo(() => {
    if (aircraftType === "Boeing 737") {
      const seats: string[] = [];
      for (let row = 1; row <= 20; row += 1) {
        ["A", "B", "C", "D", "E", "F"].forEach((col) => seats.push(`${row}${col}`));
      }
      return { seats, cols: 6, label: "Layout 3-3" };
    }

    const seats: string[] = [];
    for (let row = 1; row <= 18; row += 1) {
      ["A", "B", "C", "D"].forEach((col) => seats.push(`${row}${col}`));
    }
    return { seats, cols: 4, label: "Layout 2-2" };
  }, [aircraftType]);

  const toggleSeat = (seat: string) => {
    setSeatStatusMap((prev) => ({
      ...prev,
      [seat]: prev[seat] === "occupied" ? "available" : "occupied",
    }));
  };

  const resetSeat = () => {
    setSeatStatusMap({});
  };

  const occupiedCount = layout.seats.filter((seat) => seatStatusMap[seat] === "occupied").length;

  return (
    <AdminShell title="Seat Management" description="Konfigurasi layout kursi per tipe pesawat dan reset status kursi jika diperlukan.">
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={aircraftType}
            onChange={(event) => {
              setAircraftType(event.target.value as "Boeing 737" | "ATR 72");
              setSeatStatusMap({});
            }}
            className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 font-semibold text-slate-700"
          >
            <option>Boeing 737</option>
            <option>ATR 72</option>
          </select>
          <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{layout.label}</span>
          <span className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">Occupied: {occupiedCount}</span>
          <button onClick={resetSeat} className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">
            <RefreshCcw className="h-4 w-4" /> Reset Seat
          </button>
          <button className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <Save className="h-4 w-4" /> Save Layout
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="mb-3 flex flex-wrap gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500" /> Available</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-slate-500" /> Occupied</span>
          </div>

          <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))` }}>
            {layout.seats.map((seat) => {
              const status = seatStatusMap[seat] ?? "available";
              return (
                <button
                  key={seat}
                  onClick={() => toggleSeat(seat)}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold text-white ${status === "occupied" ? "bg-slate-500" : "bg-emerald-500"}`}
                >
                  {seat}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
