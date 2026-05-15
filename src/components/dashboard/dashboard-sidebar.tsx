"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import {
  DASHBOARD_NAV_ITEMS,
  isDashboardNavActive,
} from "@/lib/dashboard-nav";
import { Button } from "@/components/ui/button";

export function DashboardSidebar({
  userName,
  userEmail,
}: {
  userName: string | null;
  userEmail: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex h-svh w-60 flex-col overflow-y-auto border-r border-zinc-200 bg-white max-lg:hidden">
      <div className="flex items-center gap-2 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-sm font-semibold text-zinc-900">
          R
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-zinc-900">
            Reliz
          </p>
          <p className="text-[11px] font-medium text-zinc-400">
            Espace traiteur
          </p>
        </div>
      </div>
      <nav className="flex flex-col gap-1 px-3 pb-4">
        <p className="w-full px-2 pb-1 pt-2 text-[11px] font-medium text-zinc-400">
          Navigation
        </p>
        {DASHBOARD_NAV_ITEMS.map((l) => {
          const active = isDashboardNavActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-[1.15rem] px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-violet-100/70 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-zinc-100 p-4">
        <div className="rounded-[1.35rem] border border-zinc-100 bg-zinc-50/80 px-3 py-3">
          <p className="truncate text-sm font-medium text-zinc-900">
            {userName ?? "Utilisateur"}
          </p>
          <p className="truncate text-xs text-zinc-500">{userEmail}</p>
        </div>
        <form action={logoutAction} className="mt-3">
          <Button type="submit" variant="ghost" className="w-full justify-start">
            Déconnexion
          </Button>
        </form>
      </div>
    </aside>
  );
}
