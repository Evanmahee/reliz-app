"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DASHBOARD_NAV_ITEMS,
  isDashboardNavActive,
} from "@/lib/dashboard-nav";
import { useT } from "@/i18n/i18n-provider";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export function DashboardTabBar() {
  const pathname = usePathname();
  const { t } = useT();

  return (
    <nav
      className="md3-nav-bar fixed inset-x-0 bottom-0 z-50 lg:hidden"
      aria-label={t("nav.mainNavAria")}
    >
      <ul className="mx-auto flex h-20 max-w-lg items-stretch justify-around px-2">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const active = isDashboardNavActive(pathname, item.href);
          return (
            <li key={item.href} className="flex min-w-0 flex-1">
              <Link
                href={item.href}
                prefetch={false}
                className="md3-nav-item group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 touch-manipulation"
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={`relative flex h-8 min-w-16 items-center justify-center rounded-full px-4 transition-[background-color] duration-200 ease-standard ${
                    active
                      ? "bg-[var(--md3-secondary-container)]"
                      : "bg-transparent group-active:bg-[var(--md3-on-surface)]/8"
                  }`}
                >
                  <MaterialSymbol
                    name={item.icon}
                    filled={active}
                    size={24}
                    className={
                      active
                        ? "text-[var(--md3-on-secondary-container)]"
                        : "text-[var(--md3-on-surface-variant)]"
                    }
                  />
                </span>
                <span
                  className={`max-w-full truncate px-1 text-center text-xs leading-none tracking-wide ${
                    active
                      ? "font-semibold text-[var(--md3-on-surface)]"
                      : "font-medium text-[var(--md3-on-surface-variant)]"
                  }`}
                >
                  {t(item.shortLabelKey)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
