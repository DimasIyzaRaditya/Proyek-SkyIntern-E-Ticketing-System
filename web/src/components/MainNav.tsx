"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import { Plane } from "lucide-react";
import { clearSession, getUserSession, isAuthenticated } from "@/lib/auth";

const publicMenus = [
  { href: "/search", label: "Flights" },
  { href: "/bookings", label: "Bookings" },
];

const userMenus = [
  ...publicMenus,
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
];

const adminMenus = [
  ...publicMenus,
  { href: "/admin", label: "Admin Dashboard" },
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

  const authSnapshot = useSyncExternalStore(
    () => () => {},
    () => {
      const authenticated = isAuthenticated();
      const session = getUserSession();
      if (!authenticated || !session) return "guest::User";
      return `${session.role}::${session.fullName ?? "User"}`;
    },
    () => "guest::User",
  );

  const authState = useMemo(() => {
    const [roleRaw, nameRaw] = authSnapshot.split("::");
    const role = roleRaw === "admin" ? "admin" : roleRaw === "user" ? "user" : null;
    return {
      loggedIn: role !== null,
      role,
      displayName: nameRaw || "User",
    } as {
      loggedIn: boolean;
      role: "user" | "admin" | null;
      displayName: string;
    };
  }, [authSnapshot]);

  const activeMenus = !authState.loggedIn ? publicMenus : authState.role === "admin" ? adminMenus : userMenus;

  return (
    <nav className="sticky top-0 z-40 border-b border-blue-100 bg-[linear-gradient(120deg,#0b2f61_0%,#114a8f_45%,#0a2349_100%)] text-white shadow-lg">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 px-2.5 py-2.5 sm:flex-nowrap sm:gap-3 sm:px-4 sm:py-3 md:px-5 md:py-3.5">
        <Link href="/" className="inline-flex shrink-0 items-center gap-1.5 text-base font-black tracking-tight sm:gap-2 sm:text-lg md:text-xl lg:text-2xl">
          <Plane className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
          <span>SkyIntern</span>
        </Link>

        <div className="w-full min-w-0 sm:ml-auto sm:w-auto">
          <div className="flex flex-wrap items-center justify-start gap-1 sm:justify-end sm:gap-1.5 md:gap-2">
            {activeMenus.map((item) => (
              <Link
                key={`stable-${item.href}`}
                href={item.href}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl border px-2 py-1 text-[10px] font-semibold transition sm:px-2.5 sm:py-1.5 sm:text-[11px] md:px-3 md:py-1.5 md:text-xs lg:px-4 lg:py-2 lg:text-sm ${
                  pathname === item.href || (item.href === "/admin" && pathname.startsWith("/admin"))
                    ? "border-white/80 bg-white/20 text-white"
                    : "border-white/25 bg-white/5 text-blue-100 hover:bg-white/15 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {authState.loggedIn ? (
              <>
                <span className="inline-flex h-7 items-center whitespace-nowrap rounded-xl bg-white/95 px-2.5 text-[10px] font-semibold text-blue-700 sm:h-8 sm:px-3 sm:text-[11px] md:h-9 md:px-3.5 md:text-xs lg:h-auto lg:px-4 lg:py-2 lg:text-sm">
                  {authState.displayName}
                </span>
                <button
                  onClick={() => {
                    clearSession();
                    router.push("/auth/login");
                  }}
                  className="inline-flex h-7 items-center whitespace-nowrap rounded-xl bg-rose-600 px-2.5 text-[10px] font-semibold text-white transition hover:bg-rose-700 sm:h-8 sm:px-3 sm:text-[11px] md:h-9 md:px-3.5 md:text-xs lg:h-auto lg:px-5 lg:py-2 lg:text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="inline-flex h-7 items-center whitespace-nowrap rounded-xl bg-white/95 px-2.5 text-[10px] font-semibold text-blue-600 transition hover:bg-blue-50 sm:h-8 sm:px-3 sm:text-[11px] md:h-9 md:px-3.5 md:text-xs lg:h-auto lg:px-4 lg:py-2 lg:text-sm">
                  Masuk
                </Link>
                <Link href="/auth/register" className="inline-flex h-7 items-center whitespace-nowrap rounded-xl bg-blue-600 px-2.5 text-[10px] font-semibold text-white transition hover:bg-blue-700 sm:h-8 sm:px-3 sm:text-[11px] md:h-9 md:px-3.5 md:text-xs lg:h-auto lg:px-5 lg:py-2 lg:text-sm">
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
