import Link from "next/link";
import { Plane } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";

export default function SiteFooter() {
  return (
    <footer className="border-t border-blue-100 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-5 px-6 py-6 text-sm text-slate-600 md:grid-cols-[1.2fr_auto] md:items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-base font-bold text-blue-700">
            <Plane className="h-4 w-4" /> SkyIntern E-Ticketing
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Platform booking penerbangan yang cepat, aman, dan nyaman untuk semua perjalanan Anda.
          </p>
          <p className="mt-2 text-xs text-slate-400">© 2026 SkyIntern. All rights reserved.</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Follow Us</p>
          <div className="flex items-center gap-2">
            <Link href="https://instagram.com" target="_blank" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-600 transition hover:-translate-y-0.5 hover:bg-fuchsia-100" aria-label="Instagram SkyIntern">
              <FaInstagram className="h-4 w-4" />
            </Link>
            <Link href="https://youtube.com" target="_blank" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:-translate-y-0.5 hover:bg-red-100" aria-label="YouTube SkyIntern">
              <FaYoutube className="h-4 w-4" />
            </Link>
            <Link href="https://facebook.com" target="_blank" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100" aria-label="Facebook SkyIntern">
              <FaFacebookF className="h-4 w-4" />
            </Link>
            <Link href="https://tiktok.com" target="_blank" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-200" aria-label="TikTok SkyIntern">
              <FaTiktok className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
