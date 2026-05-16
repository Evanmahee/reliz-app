"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <p className="text-sm font-semibold text-zinc-900">
        Impossible d&apos;afficher cette page
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        Une erreur technique est survenue. Réessaie ou reviens au tableau de bord.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          Réessayer
        </Button>
        <Link href="/dashboard">
          <Button variant="outline" type="button">
            Tableau de bord
          </Button>
        </Link>
      </div>
    </div>
  );
}
