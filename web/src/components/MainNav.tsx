"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Menu, Plane, X } from "lucide-react";
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

export default function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll listener for navbar animation
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.removeProperty("overflow");
    }
    return () => { document.body.style.removeProperty("overflow"); };
  }, [menuOpen]);

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
    } as { loggedIn: boolean; role: "user" | "admin" | null; displayName: string };
  }, [authSnapshot]);

  const activeMenus = !authState.loggedIn
    ? publicMenus
    : authState.role === "admin"
    ? adminMenus
    : userMenus;

  const handleLogout = () => {
    clearSession();
    setMenuOpen(false);
    router.push("/auth/login");
  };

  const isActive = (href: string) =>
    pathname === href || (href === "/admin" && pathname.startsWith("/admin"));

  return (
    <>
      {/* Spacer so content is never hidden under the fixed nav */}
      <div className="h-13 md:h-15" aria-hidden="true" />
      <nav
        className={`fixed top-0 left-0 right-0 z-50 text-white transition-all duration-300 ${
          scrolled
            ? "border-b border-white/10 bg-[linear-gradient(120deg,rgba(11,47,97,0.88)_0%,rgba(17,74,143,0.88)_45%,rgba(10,35,73,0.88)_100%)] shadow-2xl backdrop-blur-md"
            : "border-b border-blue-100 bg-[linear-gradient(120deg,#0b2f61_0%,#114a8f_45%,#0a2349_100%)] shadow-lg"
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-5 md:py-3.5">
          {/* Logo */}
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 text-lg font-black tracking-tight md:text-xl lg:text-2xl"
          >
            <Plane className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
            <span>SkyIntern</span>
          </Link>

          {/* Desktop menu — hidden on mobile */}
          <div className="hidden items-center gap-1.5 sm:flex md:gap-2">
            {activeMenus.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-semibold transition md:px-3.5 md:text-sm lg:px-4 lg:py-2 ${
                  isActive(item.href)
                    ? "border-white/80 bg-white/20 text-white"
                    : "border-white/25 bg-white/5 text-blue-100 hover:bg-white/15 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {authState.loggedIn ? (
              <>
                <span className="inline-flex h-8 items-center whitespace-nowrap rounded-xl bg-white/95 px-3 text-xs font-semibold text-blue-700 md:h-9 md:px-3.5 md:text-sm lg:px-4">
                  {authState.displayName}
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex h-8 items-center whitespace-nowrap rounded-xl bg-rose-600 px-3 text-xs font-semibold text-white transition hover:bg-rose-700 md:h-9 md:px-3.5 md:text-sm lg:px-5"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="inline-flex h-8 items-center whitespace-nowrap rounded-xl bg-white/95 px-3 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 md:h-9 md:px-3.5 md:text-sm lg:px-4"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex h-8 items-center whitespace-nowrap rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 md:h-9 md:px-3.5 md:text-sm lg:px-5"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white transition hover:bg-white/20 sm:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* ── Mobile slide-in drawer (right half) ── */}
      {/* Backdrop */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 sm:hidden ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Drawer panel — slides in from right, ~70% wide */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-[72vw] max-w-xs flex-col bg-[linear-gradient(160deg,#0b2f61_0%,#0d3b7a_60%,#0a2349_100%)] shadow-2xl transition-transform duration-300 ease-out sm:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!menuOpen}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-base font-black text-white">
            <Plane className="h-4 w-4" />
            SkyIntern
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Tutup menu"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-1">
            {activeMenus.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive(item.href)
                    ? "bg-white/20 text-white"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Auth section pinned to bottom */}
        <div className="border-t border-white/10 px-3 py-4 space-y-2">
          {authState.loggedIn ? (
            <>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5">
                <span className="text-base">👤</span>
                <span className="truncate text-sm font-semibold text-white">
                  {authState.displayName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 active:scale-95"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="block rounded-xl bg-white/95 px-4 py-2.5 text-center text-sm font-bold text-blue-700 transition hover:bg-white active:scale-95"
              >
                Masuk
              </Link>
              <Link
                href="/auth/register"
                className="block rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95"
              >
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
