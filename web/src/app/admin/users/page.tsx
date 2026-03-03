"use client";

import { useState } from "react";
import { ShieldBan, ShieldCheck } from "lucide-react";
import AdminShell from "@/components/AdminShell";

type UserItem = {
  id: string;
  name: string;
  email: string;
  blocked: boolean;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([
    { id: "USR001", name: "Abimanyu Pratama", email: "abim@contoh.com", blocked: false },
    { id: "USR002", name: "Nadia Putri", email: "nadia@contoh.com", blocked: false },
    { id: "USR003", name: "Rizki Hidayat", email: "rizki@contoh.com", blocked: true },
  ]);

  const toggleBlock = (id: string) => {
    setUsers((prev) => prev.map((item) => (item.id === id ? { ...item, blocked: !item.blocked } : item)));
  };

  return (
    <AdminShell title="User Management" description="Lihat user terdaftar dan blokir/unblock user bila diperlukan.">
      <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-blue-50 text-slate-600">
              <tr>
                <th className="rounded-l-xl p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Status</th>
                <th className="rounded-r-xl p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id} className="border-b border-blue-100 last:border-0">
                  <td className="p-3 font-semibold">{item.id}</td>
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.email}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.blocked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {item.blocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleBlock(item.id)}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${item.blocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
                    >
                      {item.blocked ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldBan className="h-3.5 w-3.5" />}
                      {item.blocked ? "Unblock" : "Block"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
