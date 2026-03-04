"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plane } from "lucide-react";
import { clearSession, getUserSession, isAuthenticated } from "@/lib/auth";

const userMenus = [
  { href: "/search", label: "Flights" },
  { href: "/bookings", label: "Bookings" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
];

/*
  NOTE:
  - Navbar tetap satu baris di semua ukuran layar.
  - Semua tombol (Flights, Bookings, Masuk, Daftar) rata kanan.
  - Grup tombol tetap fleksibel (bisa scroll di layar kecil) agar tidak tabrakan.
  - Di layar besar, scroll otomatis nonaktif dan layout kembali normal.
*/
export default function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-40 border-b border-blue-100 bg-[linear-gradient(120deg,#0b2f61_0%,#114a8f_45%,#0a2349_100%)] text-white shadow-lg">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-5 sm:py-3.5">
        <Link href="/" className="inline-flex shrink-0 items-center gap-1.5 text-lg font-black tracking-tight sm:gap-2 sm:text-2xl">
          <Plane className="h-4 w-4 shrink-0 sm:h-6 sm:w-6" />
          <span>SkyIntern</span>
        </Link>

        <div className="ml-auto flex min-w-0 max-w-[78%] items-center justify-end gap-1.5 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:max-w-none sm:overflow-visible sm:pb-0 sm:gap-2">
          {(loggedIn ? userMenus : userMenus.filter((item) => item.href === "/search" || item.href === "/bookings")).map((item) => (
            <Link
              key={`stable-${item.href}`}
              href={item.href}
              className={`inline-flex shrink-0 items-center justify-center rounded-xl border px-2.5 py-1 text-[11px] font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
                pathname === item.href
                  ? "border-white/80 bg-white/20 text-white"
                  : "border-white/25 bg-white/5 text-blue-100 hover:bg-white/15 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {loggedIn ? (
            <>
              <span className="inline-flex h-8 shrink-0 items-center rounded-xl bg-white/95 px-3 text-[11px] font-semibold text-blue-700 sm:h-auto sm:px-4 sm:py-2 sm:text-sm">
                {getUserSession()?.fullName ?? "User"}
              </span>
              <button
                onClick={() => {
                  clearSession();
                  setLoggedIn(false);
                  router.push("/auth/login");
                }}
                className="inline-flex h-8 shrink-0 items-center rounded-xl bg-rose-600 px-3 text-[11px] font-semibold text-white transition hover:bg-rose-700 sm:h-auto sm:px-5 sm:py-2 sm:text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="inline-flex h-8 shrink-0 items-center rounded-xl bg-white/95 px-3 text-[11px] font-semibold text-blue-600 transition hover:bg-blue-50 sm:h-auto sm:px-4 sm:py-2 sm:text-sm">
                Masuk
              </Link>
              <Link href="/auth/register" className="inline-flex h-8 shrink-0 items-center rounded-xl bg-blue-600 px-3 text-[11px] font-semibold text-white transition hover:bg-blue-700 sm:h-auto sm:px-5 sm:py-2 sm:text-sm">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
