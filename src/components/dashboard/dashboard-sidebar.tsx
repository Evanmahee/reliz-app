"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { RelizLogo } from "@/components/brand/reliz-logo";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import {
  DASHBOARD_NAV_ITEMS,
  isDashboardNavActive,
} from "@/lib/dashboard-nav";
import { useT } from "@/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export function DashboardSidebar({
  userName,
  userEmail,
  localeReturnTo,
}: {
  userName: string | null;
  userEmail: string;
  localeReturnTo: string;
}) {
  const pathname = usePathname();
  const { t } = useT();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex h-svh w-60 flex-col overflow-y-auto border-r border-zinc-200 bg-white max-lg:hidden">
      <Link href="/dashboard" className="block px-5 py-6">
        <RelizLogo height={26} priority />
        <p className="mt-2 text-[11px] font-medium text-zinc-400">
          {t("nav.sidebarTagline")}
        </p>
      </Link>
      <nav className="flex flex-col gap-1 px-3 pb-4">
        <div className="flex items-center justify-between px-2 pb-1 pt-2">
          <p className="text-[11px] font-medium text-zinc-400">
            {t("nav.navSection")}
          </p>
          <LocaleSwitcher returnTo={localeReturnTo} className="shrink-0" />
        </div>
        {DASHBOARD_NAV_ITEMS.map((l) => {
          const active = isDashboardNavActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              prefetch={false}
              className={`flex items-center gap-3 rounded-[1.15rem] px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-violet-100/70 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <MaterialSymbol
                name={l.icon}
                filled={active}
                size={22}
                className={active ? "text-zinc-900" : "text-zinc-500"}
              />
              {t(l.labelKey)}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-zinc-100 p-4">
        <div className="rounded-[1.35rem] border border-zinc-100 bg-zinc-50/80 px-3 py-3">
          <p className="truncate text-sm font-medium text-zinc-900">
            {userName ?? t("user.defaultName")}
          </p>
          <p className="truncate text-xs text-zinc-500">{userEmail}</p>
        </div>
        <form action={logoutAction} className="mt-3">
          <Button type="submit" variant="ghost" className="w-full justify-start">
            {t("nav.logout")}
          </Button>
        </form>
      </div>
    </aside>
  );
}
