export type DashboardNavItem = {
  href: string;
  label: string;
  /** Nom Material Symbols Rounded — https://fonts.google.com/icons */
  icon: string;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "space_dashboard" },
  { href: "/dashboard/evenements", label: "Événements", icon: "event" },
  { href: "/dashboard/checklists", label: "Checklists", icon: "checklist" },
  { href: "/dashboard/historique", label: "Historique", icon: "history" },
  { href: "/dashboard/parametres", label: "Paramètres", icon: "settings" },
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
