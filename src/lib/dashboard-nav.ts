export type DashboardNavItem = {
  href: string;
  /** Clé i18n pour le libellé (ex. nav.dashboard) */
  labelKey: string;
  /** Libellé court (barre du bas) */
  shortLabelKey: string;
  /** Nom Material Symbols Rounded — https://fonts.google.com/icons */
  icon: string;
  /** Visible uniquement pour le traiteur (OWNER) */
  ownerOnly?: boolean;
  /** Visible pour STAFF et MAITRE_HOTEL */
  staffOnly?: boolean;
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
    href: "/dashboard/taches",
    labelKey: "nav.tasks",
    shortLabelKey: "nav.tasks",
    icon: "assignment",
    staffOnly: true,
  },
  {
    href: "/dashboard/equipe",
    labelKey: "nav.team",
    shortLabelKey: "nav.team",
    icon: "groups",
    ownerOnly: true,
  },
  {
    href: "/dashboard/checklists",
    labelKey: "nav.tasks",
    shortLabelKey: "nav.tasks",
    icon: "assignment",
    ownerOnly: true,
  },
  {
    href: "/dashboard/historique",
    labelKey: "nav.history",
    shortLabelKey: "nav.history",
    icon: "history",
    ownerOnly: true,
  },
];

export function navItemsForRole(role: string) {
  const isOwner = role === "OWNER";
  const isStaffLike = role === "STAFF" || role === "MAITRE_HOTEL";
  return DASHBOARD_NAV_ITEMS.filter((item) => {
    if (item.ownerOnly && !isOwner) return false;
    if (item.staffOnly && !isStaffLike) return false;
    return true;
  });
}

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
  if (href === "/dashboard/taches") {
    return pathname === "/dashboard/taches";
  }
  if (href === "/dashboard/equipe") {
    return pathname === "/dashboard/equipe";
  }
  return pathname === href;
}
