"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Rafraîchit les données serveur de la page (nouvelles demandes invités)
 * toutes les `intervalMs`, uniquement écran visible, et dès que le réseau
 * ou l'onglet revient.
 */
export function DashboardAutoRefresh({ intervalMs = 12_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && navigator.onLine !== false) {
        router.refresh();
      }
    };
    const id = setInterval(refresh, intervalMs);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, intervalMs]);

  return null;
}
