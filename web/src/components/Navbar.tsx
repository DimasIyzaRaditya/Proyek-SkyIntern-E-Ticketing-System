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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <button onClick={() => onNavigate("home")} className="text-3xl font-extrabold tracking-tight text-blue-600">
            SkyIntern
          </button>

          <div className="hidden items-center gap-6 text-sm font-medium md:flex">
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

        <div className="flex items-center gap-3">
          <button onClick={onOpenLogin} className="rounded-xl px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50">
            Masuk
          </button>
          <button onClick={onOpenRegister} className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
            Daftar
          </button>
        </div>
      </div>
    </nav>
  );
}
