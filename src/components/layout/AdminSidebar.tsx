"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "대시보드", icon: "📊" },
  { href: "/admin/sessions", label: "세션 관리", icon: "📋" },
  { href: "/admin/assets", label: "자료 관리", icon: "📁" },
  { href: "/admin/submissions", label: "제출물", icon: "📨" },
  { href: "/admin/attendance", label: "출석 관리", icon: "✅" },
  { href: "/admin/members", label: "회원 관리", icon: "👥" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col border-r border-gray-100 bg-[#F0F4F8]">
      <div className="border-b border-gray-200 px-4 py-3">
        <Link href="/admin" className="text-sm font-bold text-slate-800">
          관리자 패널
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map(({ href, label, icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-gray-100 hover:text-slate-900"
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 p-2">
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-500 hover:bg-gray-100 hover:text-slate-900"
          >
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
