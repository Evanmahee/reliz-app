"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DASHBOARD_NAV_ITEMS,
  isDashboardNavActive,
} from "@/lib/dashboard-nav";

const iconClass = "h-6 w-6 shrink-0";

function IconDashboard({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M5 3h4v8H5V3zm10 0h4v5h-4V3zM5 14h4v7H5v-7zm10 4h4v3h-4v-3z" />
      </svg>
    );
  }
  return (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function IconEvents({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10z" />
      </svg>
    );
  }
  return (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconHistory({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
      </svg>
    );
  }
  return (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconSettings({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19.14 12.94a7.49 7.49 0 0 0 .05-.94 7.49 7.49 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.49.42l-.36 2.54a7.28 7.28 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 7.48a.5.5 0 0 0 .12.64l2.03 1.58a7.49 7.49 0 0 0-.05.94c0 .32.02.63.05.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.39 1.05.71 1.63.94l.36 2.54A.5.5 0 0 0 10 22h4a.5.5 0 0 0 .49-.42l.36-2.54c.58-.23 1.13-.55 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
      </svg>
    );
  }
  return (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function NavIcon({ href, active }: { href: string; active: boolean }) {
  if (href === "/dashboard") return <IconDashboard active={active} />;
  if (href === "/dashboard/evenements") return <IconEvents active={active} />;
  if (href === "/dashboard/historique") return <IconHistory active={active} />;
  return <IconSettings active={active} />;
}

/** Libellés courts pour la barre MD3 sur petits écrans */
function shortLabel(label: string) {
  if (label === "Événements") return "Événements";
  if (label === "Paramètres") return "Réglages";
  return label;
}

export function DashboardTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="md3-nav-bar fixed inset-x-0 bottom-0 z-50 lg:hidden"
      aria-label="Navigation principale"
    >
      <ul className="mx-auto flex h-20 max-w-lg items-stretch justify-around px-2">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const active = isDashboardNavActive(pathname, item.href);
          return (
            <li key={item.href} className="flex min-w-0 flex-1">
              <Link
                href={item.href}
                prefetch
                className="md3-nav-item group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 touch-manipulation"
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={`relative flex h-8 min-w-16 items-center justify-center rounded-full px-4 transition-[background-color,transform] duration-200 ease-standard ${
                    active
                      ? "bg-[var(--md3-secondary-container)]"
                      : "bg-transparent group-active:bg-[var(--md3-on-surface)]/8"
                  }`}
                >
                  <span
                    className={
                      active
                        ? "text-[var(--md3-on-secondary-container)]"
                        : "text-[var(--md3-on-surface-variant)]"
                    }
                  >
                    <NavIcon href={item.href} active={active} />
                  </span>
                </span>
                <span
                  className={`max-w-full truncate px-1 text-center text-xs leading-none tracking-wide ${
                    active
                      ? "font-semibold text-[var(--md3-on-surface)]"
                      : "font-medium text-[var(--md3-on-surface-variant)]"
                  }`}
                >
                  {shortLabel(item.label)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
