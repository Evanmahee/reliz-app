"use client";

import { useEffect, useState } from "react";

/**
 * Affiche l’erreur puis retire `?erreur=` de l’URL (évite le bandeau collé au refresh).
 * On réécrit seulement l’URL du navigateur : un router.replace() rechargeait la
 * page serveur sans le paramètre, et le message disparaissait avant d’être lu.
 */
export function ConnexionErrorBanner({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    window.history.replaceState(window.history.state, "", "/connexion");
  }, []);

  if (!visible || !message) return null;

  return (
    <p
      role="alert"
      className="rounded-[1rem] bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {message}
      <button
        type="button"
        className="ml-2 text-xs font-medium underline"
        onClick={() => setVisible(false)}
      >
        OK
      </button>
    </p>
  );
}
