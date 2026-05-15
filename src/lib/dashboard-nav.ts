export type DashboardNavItem = {
  href: string;
  label: string;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/evenements", label: "Événements" },
  { href: "/dashboard/historique", label: "Historique" },
  { href: "/dashboard/parametres", label: "Paramètres" },
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
  return pathname === href;
}
