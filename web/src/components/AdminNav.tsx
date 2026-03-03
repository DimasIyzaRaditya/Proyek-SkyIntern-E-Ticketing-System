"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

const menus = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/airports", label: "Airports" },
  { href: "/admin/airlines", label: "Airlines" },
  { href: "/admin/schedules", label: "Schedules" },
  { href: "/admin/seats", label: "Seat Config" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/users", label: "Users" },
];

export default function AdminNav() {
  return (
    <nav className="mb-6 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
        <LayoutDashboard className="h-4 w-4" /> Admin Navigation
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {menus.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 hover:bg-blue-100"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
