"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Affiche l’erreur une fois puis retire `?erreur=` de l’URL (évite le bandeau collé au refresh HMR). */
export function ConnexionErrorBanner({ message }: { message: string }) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    router.replace("/connexion", { scroll: false });
  }, [router]);

  if (!visible || !message) return null;

  return (
    <p className="rounded-[1rem] bg-red-50 px-3 py-2 text-sm text-red-700">
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
