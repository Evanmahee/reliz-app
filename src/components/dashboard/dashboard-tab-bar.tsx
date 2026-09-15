"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isDashboardNavActive, navItemsForRole } from "@/lib/dashboard-nav";
import { useT } from "@/i18n/i18n-provider";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export function DashboardTabBar({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const { t } = useT();
  const navItems = navItemsForRole(userRole).slice(0, 5);

  return (
    <nav
      className="md3-nav-bar fixed inset-x-0 bottom-0 z-50 lg:hidden"
      aria-label={t("nav.mainNavAria")}
    >
      <ul className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
        {navItems.map((item) => {
          const active = isDashboardNavActive(pathname, item.href);
          const label = t(item.shortLabelKey);
          return (
            <li key={item.href} className="flex min-w-0 flex-1">
              <Link
                href={item.href}
                aria-label={label}
                title={label}
                className="md3-nav-item group relative flex min-w-0 flex-1 items-center justify-center px-1 py-2 touch-manipulation"
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={`relative flex h-10 w-16 items-center justify-center rounded-full transition-[background-color] duration-200 ease-standard ${
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
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
