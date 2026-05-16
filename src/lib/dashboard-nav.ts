export type DashboardNavItem = {
  href: string;
  /** Clé i18n pour le libellé (ex. nav.dashboard) */
  labelKey: string;
  /** Libellé court (barre du bas) */
  shortLabelKey: string;
  /** Nom Material Symbols Rounded — https://fonts.google.com/icons */
  icon: string;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    href: "/dashboard",
    labelKey: "nav.dashboard",
    shortLabelKey: "nav.dashboard",
    icon: "space_dashboard",
  },
  {
    href: "/dashboard/evenements",
    labelKey: "nav.events",
    shortLabelKey: "nav.events",
    icon: "event",
  },
  {
    href: "/dashboard/checklists",
    labelKey: "nav.checklists",
    shortLabelKey: "nav.shortChecklists",
    icon: "checklist",
  },
  {
    href: "/dashboard/historique",
    labelKey: "nav.history",
    shortLabelKey: "nav.history",
    icon: "history",
  },
  {
    href: "/dashboard/parametres",
    labelKey: "nav.settings",
    shortLabelKey: "nav.shortSettings",
    icon: "settings",
  },
];

export function isDashboardNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  if (href === "/dashboard/evenements") {
    return (
      pathname === "/dashboard/evenements" ||
      pathname.startsWith("/dashboard/evenements/")
    );
  }
  if (href === "/dashboard/checklists") {
    return (
      pathname === "/dashboard/checklists" ||
      pathname.startsWith("/dashboard/checklists/")
    );
  }
  return pathname === href;
}
