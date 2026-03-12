"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

const menus = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/airports", label: "Airports" },
  { href: "/admin/airlines", label: "Airlines" },
  { href: "/admin/schedules", label: "Schedules" },
  { href: "/admin/seats", label: "Seat Config" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/promos", label: "Promos" },
];

export default function AdminNav() {
  const pathname = usePathname();

  const isActiveMenu = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="mb-6 rounded-2xl border border-blue-100 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-blue-700 sm:text-sm">
        <LayoutDashboard className="h-4 w-4" /> Admin Navigation
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:flex sm:flex-wrap sm:text-sm">
        {menus.map((item) => {
          const isActive = isActiveMenu(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`min-w-0 whitespace-nowrap rounded-lg border px-3 py-2 text-center font-semibold transition-colors duration-200 sm:w-auto ${
                isActive
                  ? "border-blue-300 bg-blue-100 text-blue-800"
                  : "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
