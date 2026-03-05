import { ShieldCheck } from "lucide-react";

type NavKey = "home" | "bookings" | "profile";

type NavbarProps = {
  activeNav: NavKey;
  onNavigate: (target: NavKey) => void;
  onOpenAdmin: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
};

export default function Navbar({
  activeNav,
  onNavigate,
  onOpenAdmin,
  onOpenLogin,
  onOpenRegister,
}: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 border-b border-blue-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-4 sm:gap-8">
          <button onClick={() => onNavigate("home")} className="text-2xl font-extrabold tracking-tight text-blue-600 sm:text-3xl">
            SkyIntern
          </button>

          <div className="hidden items-center gap-4 text-sm font-medium lg:flex">
            {([
              ["home", "Home"],
              ["bookings", "Pesanan Saya"],
              ["profile", "Profil"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => onNavigate(key)}
                className={`border-b-2 pb-1 transition ${
                  activeNav === key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-blue-600"
                }`}
              >
                {label}
              </button>
            ))}

            <button onClick={onOpenAdmin} className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700">
              <ShieldCheck className="h-4 w-4" /> Admin
            </button>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-auto sm:overflow-visible">
          <button onClick={onOpenLogin} className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50">
            Masuk
          </button>
          <button onClick={onOpenRegister} className="shrink-0 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
            Daftar
          </button>
        </div>
      </div>
    </nav>
  );
}
