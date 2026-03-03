import { CircleUserRound, LogOut, Search } from "lucide-react";

export type UserPageKey =
  | "home"
  | "results"
  | "detail"
  | "seat"
  | "passenger"
  | "payment"
  | "bookings"
  | "eticket"
  | "profile";

type Flight = {
  id: number;
  airline: string;
  logo: string;
  dep: string;
  arr: string;
  dur: string;
  price: number;
  seatLeft: number;
  code: string;
};

type Booking = {
  id: string;
  status: "Upcoming" | "Completed" | "Cancelled";
  airline: string;
  code: string;
  date: string;
  route: string;
  time: string;
  amount: number;
  seats: string[];
  passengerName: string;
};

type BookingFlowProps = {
  page: UserPageKey;
  origin: string;
  dest: string;
  date: string;
  passenger: string;
  routeOptions: string[];
  setOrigin: (value: string) => void;
  setDest: (value: string) => void;
  setDate: (value: string) => void;
  setPassenger: (value: string) => void;
  searchFlight: () => void;
  resultFlights: Flight[];
  sortResults: (mode: "price-low" | "price-high" | "duration") => void;
  openDetail: (flight: Flight) => void;
  selectedFlight: Flight | null;
  goSeatSelection: () => void;
  selectedSeats: string[];
  occupiedSeats: Set<string>;
  toggleSeat: (seat: string) => void;
  continueToPassenger: () => void;
  passengerName: string;
  passengerId: string;
  passengerDob: string;
  setPassengerName: (value: string) => void;
  setPassengerId: (value: string) => void;
  setPassengerDob: (value: string) => void;
  goToPayment: () => void;
  countdownText: string;
  totalPrice: number;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  completePayment: () => void;
  bookings: Booking[];
  bookingTab: "Upcoming" | "Completed" | "Cancelled";
  setBookingTab: (value: "Upcoming" | "Completed" | "Cancelled") => void;
  activeTicket: Booking | null;
  setActiveTicket: (booking: Booking) => void;
  goPage: (target: UserPageKey) => void;
  profileName: string;
  profilePhone: string;
  setProfileName: (value: string) => void;
  setProfilePhone: (value: string) => void;
  saveProfile: () => void;
  logout: () => void;
  qrData: boolean[];
  formatRupiah: (value: number) => string;
};

export default function BookingFlow({
  page,
  origin,
  dest,
  date,
  passenger,
  routeOptions,
  setOrigin,
  setDest,
  setDate,
  setPassenger,
  searchFlight,
  resultFlights,
  sortResults,
  openDetail,
  selectedFlight,
  goSeatSelection,
  selectedSeats,
  occupiedSeats,
  toggleSeat,
  continueToPassenger,
  passengerName,
  passengerId,
  passengerDob,
  setPassengerName,
  setPassengerId,
  setPassengerDob,
  goToPayment,
  countdownText,
  totalPrice,
  paymentMethod,
  setPaymentMethod,
  completePayment,
  bookings,
  bookingTab,
  setBookingTab,
  activeTicket,
  setActiveTicket,
  goPage,
  profileName,
  profilePhone,
  setProfileName,
  setProfilePhone,
  saveProfile,
  logout,
  qrData,
  formatRupiah,
}: BookingFlowProps) {
  const filteredBookings = bookings.filter((item) => item.status === bookingTab);

  if (page === "home") {
    return (
      <section>
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-16 text-white shadow-xl md:px-12">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-4xl font-extrabold md:text-5xl">Terbang ke Mana Hari Ini?</h2>
            <p className="mt-3 text-lg text-blue-100">Cari tiket termurah dalam hitungan detik</p>

            <div className="mt-10 rounded-3xl border border-white/30 bg-white p-6 text-slate-900 shadow-2xl md:p-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Dari</label>
                  <select
                    value={origin}
                    onChange={(event) => setOrigin(event.target.value)}
                    className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-3 py-3 outline-none ring-blue-200 focus:ring"
                  >
                    {routeOptions.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Ke</label>
                  <select
                    value={dest}
                    onChange={(event) => setDest(event.target.value)}
                    className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-3 py-3 outline-none ring-blue-200 focus:ring"
                  >
                    {routeOptions.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Tanggal</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-3 py-3 outline-none ring-blue-200 focus:ring"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Penumpang</label>
                  <select
                    value={passenger}
                    onChange={(event) => setPassenger(event.target.value)}
                    className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-3 py-3 outline-none ring-blue-200 focus:ring"
                  >
                    <option>1 Dewasa</option>
                    <option>2 Dewasa</option>
                    <option>1 Dewasa + 1 Anak</option>
                  </select>
                </div>

                <button
                  onClick={searchFlight}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  <Search className="h-4 w-4" /> Cari
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (page === "results") {
    return (
      <section>
        <h2 className="mb-6 text-3xl font-bold">Hasil Pencarian: <span className="text-blue-600">{origin} → {dest}</span></h2>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="h-fit w-full rounded-3xl border border-blue-100 bg-white p-6 shadow-sm lg:w-72">
            <h3 className="mb-4 text-lg font-semibold">Filter</h3>
            <div className="space-y-2 text-sm">
              <button onClick={() => sortResults("price-low")} className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-blue-50">Harga Termurah</button>
              <button onClick={() => sortResults("price-high")} className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-blue-50">Harga Tertinggi</button>
              <button onClick={() => sortResults("duration")} className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-blue-50">Durasi Tercepat</button>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {resultFlights.map((flight) => (
              <button
                key={flight.id}
                onClick={() => openDetail(flight)}
                className="flex w-full items-center gap-6 rounded-3xl border border-blue-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-4xl">{flight.logo}</div>
                <div className="flex-1">
                  <p className="font-semibold">{flight.airline}</p>
                  <p className="text-xl font-bold">{flight.dep} - {flight.arr}</p>
                  <p className="text-sm text-slate-500">{flight.dur} • Sisa kursi {flight.seatLeft}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-blue-600">{formatRupiah(flight.price)}</p>
                  <p className="mt-1 text-sm font-semibold text-blue-600">Lihat Detail →</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (page === "detail" && selectedFlight) {
    return (
      <section className="mx-auto max-w-4xl rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <div className="mb-2 flex items-center gap-3 text-3xl">
              <span>{selectedFlight.logo}</span>
              <span className="font-semibold">{selectedFlight.airline}</span>
            </div>
            <p className="text-5xl font-black tracking-tight text-blue-700">{selectedFlight.dep} → {selectedFlight.arr}</p>
            <p className="mt-2 text-slate-500">Boeing 737-800 • {selectedFlight.code}</p>
          </div>

          <div className="text-left md:text-right">
            <p className="text-4xl font-black text-blue-600">{formatRupiah(selectedFlight.price)}</p>
            <button onClick={goSeatSelection} className="mt-5 rounded-2xl bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700">
              Pilih Kursi
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (page === "seat") {
    return (
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-6 text-2xl font-bold">Pilih Kursi - {selectedFlight?.code ?? "GA-123"}</h2>
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1">
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-2"><span className="h-5 w-5 rounded bg-blue-100" /> Tersedia</span>
              <span className="inline-flex items-center gap-2"><span className="h-5 w-5 rounded bg-blue-600" /> Dipilih</span>
              <span className="inline-flex items-center gap-2"><span className="h-5 w-5 rounded bg-slate-400" /> Terisi</span>
            </div>

            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 15 }, (_, rowIndex) => {
                const row = rowIndex + 1;
                return Array.from({ length: 8 }, (_, colIndex) => {
                  const letter = String.fromCharCode(65 + colIndex);
                  const seatId = `${row}${letter}`;
                  const isOccupied = occupiedSeats.has(seatId);
                  const isSelected = selectedSeats.includes(seatId);

                  return (
                    <button
                      key={seatId}
                      onClick={() => toggleSeat(seatId)}
                      disabled={isOccupied}
                      className={`rounded-lg py-2 text-xs font-semibold transition ${
                        isOccupied
                          ? "cursor-not-allowed bg-slate-400 text-white"
                          : isSelected
                            ? "bg-blue-600 text-white shadow"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                    >
                      {seatId}
                    </button>
                  );
                });
              })}
            </div>
          </div>

          <aside className="w-full lg:w-80">
            <div className="sticky top-24 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <h3 className="font-semibold">Kursi Terpilih</h3>
              <div className="mt-3 min-h-16 space-x-2 space-y-2">
                {selectedSeats.length ? (
                  selectedSeats.map((seat) => (
                    <span key={seat} className="inline-block rounded-xl bg-blue-600 px-3 py-1 text-sm font-semibold text-white">{seat}</span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Belum ada kursi dipilih.</p>
                )}
              </div>
              <button onClick={continueToPassenger} className="mt-6 w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700">
                Lanjut ke Data Penumpang
              </button>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  if (page === "passenger") {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold">Data Penumpang</h2>
        <input value={passengerName} onChange={(event) => setPassengerName(event.target.value)} className="mb-4 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 outline-none ring-blue-200 focus:ring" placeholder="Nama Lengkap" />
        <input value={passengerId} onChange={(event) => setPassengerId(event.target.value)} className="mb-4 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 outline-none ring-blue-200 focus:ring" placeholder="Nomor KTP / Passport" />
        <input type="date" value={passengerDob} onChange={(event) => setPassengerDob(event.target.value)} className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 outline-none ring-blue-200 focus:ring" />
        <button onClick={goToPayment} className="mt-8 w-full rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700">Lanjut ke Pembayaran</button>
      </section>
    );
  }

  if (page === "payment") {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Ringkasan Pembayaran</h2>
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 font-mono text-xl font-bold text-red-600">{countdownText}</div>
        </div>

        <div className="space-y-3 text-lg">
          <div className="flex justify-between"><span>Tiket ({passenger})</span><span>{formatRupiah((selectedFlight?.price ?? 1250000) * (passenger.includes("2") ? 2 : 1))}</span></div>
          <div className="flex justify-between"><span>Tax & Fee</span><span>{formatRupiah(185000 * (passenger.includes("2") ? 2 : 1))}</span></div>
          <div className="flex justify-between border-t border-blue-100 pt-3 font-bold"><span>Total</span><span className="text-2xl text-blue-700">{formatRupiah(totalPrice)}</span></div>
        </div>

        <div className="mt-8">
          <h3 className="mb-3 font-semibold">Pilih Metode Pembayaran</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {["Bank Transfer", "Kartu Kredit", "E-Wallet"].map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`rounded-2xl border px-4 py-4 text-center text-sm font-medium transition ${
                  paymentMethod === method
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-blue-100 bg-white hover:bg-blue-50"
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <button onClick={completePayment} className="mt-10 w-full rounded-2xl bg-blue-600 py-4 text-xl font-bold text-white transition hover:bg-blue-700">Bayar Sekarang</button>
      </section>
    );
  }

  if (page === "bookings") {
    return (
      <section className="max-w-5xl">
        <div className="mb-6 flex flex-wrap gap-3">
          {(["Upcoming", "Completed", "Cancelled"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setBookingTab(tab)}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
                bookingTab === tab
                  ? "bg-blue-600 text-white"
                  : "border border-blue-100 bg-white text-slate-600 hover:bg-blue-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredBookings.length ? (
            filteredBookings.map((booking) => (
              <button
                key={booking.id}
                onClick={() => {
                  setActiveTicket(booking);
                  goPage("eticket");
                }}
                className="flex w-full items-center gap-5 rounded-3xl border border-blue-100 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
              >
                <div className="rounded-xl bg-blue-50 p-3 text-3xl">🛫</div>
                <div className="flex-1">
                  <p className="font-semibold">{booking.airline} • {booking.code}</p>
                  <p className="text-sm text-slate-500">{booking.date} • {booking.route} • {booking.time}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${booking.status === "Upcoming" ? "bg-blue-100 text-blue-700" : booking.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {booking.status}
                  </span>
                  <p className="mt-2 text-sm font-semibold text-blue-600">Lihat E-Ticket →</p>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-blue-100 bg-white p-8 text-center text-slate-500">Tidak ada data untuk tab {bookingTab}.</div>
          )}
        </div>
      </section>
    );
  }

  if (page === "eticket" && activeTicket) {
    return (
      <section className="mx-auto max-w-md overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl">
        <div className="bg-blue-600 p-7 text-center text-white"><h2 className="text-2xl font-bold">Boarding Pass</h2></div>
        <div className="p-6">
          <div className="mb-6 text-center">
            <p className="text-3xl font-black">{activeTicket.code}</p>
            <p className="text-slate-500">{activeTicket.route}</p>
            <p className="mt-2 text-4xl font-mono font-bold">{activeTicket.date}</p>
          </div>

          <div className="mb-6 rounded-2xl border-2 border-dashed border-blue-200 p-4 text-center">
            <p className="text-sm text-slate-500">Kursi</p>
            <p className="text-5xl font-black text-blue-600">{activeTicket.seats.join(", ")}</p>
          </div>

          <div className="rounded-2xl bg-blue-50 p-4 text-center">
            <div className="mx-auto w-fit rounded-xl bg-white p-2">
              <div className="grid grid-cols-12 gap-0.5">
                {qrData.map((filled, index) => (
                  <div key={`${activeTicket.id}-${index}`} className={`h-2 w-2 ${filled ? "bg-slate-900" : "bg-white"}`} />
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold">{activeTicket.passengerName}</p>
          </div>
        </div>
        <button onClick={() => goPage("bookings")} className="w-full bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700">Kembali ke Pesanan Saya</button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg rounded-3xl border border-blue-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col items-center">
        <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
          <CircleUserRound className="h-14 w-14" />
        </div>

        <input value={profileName} onChange={(event) => setProfileName(event.target.value)} className="mb-6 w-full border-b border-blue-200 pb-2 text-center text-3xl font-bold outline-none" />

        <div className="w-full space-y-4">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Email</label>
            <input readOnly value="abim@contoh.com" className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Nomor Telepon</label>
            <input value={profilePhone} onChange={(event) => setProfilePhone(event.target.value)} className="w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 outline-none ring-blue-200 focus:ring" />
          </div>
        </div>

        <button onClick={saveProfile} className="mt-8 rounded-2xl bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700">Simpan Perubahan</button>
        <button onClick={logout} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-red-600"><LogOut className="h-4 w-4" /> Logout</button>
      </div>
    </section>
  );
}
