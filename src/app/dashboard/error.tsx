"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/i18n-provider";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useT();

  useEffect(() => {
    console.error("[dashboard error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <p className="text-sm font-semibold text-zinc-900">{t("dashboardError.title")}</p>
      <p className="mt-2 text-sm text-zinc-500">{t("dashboardError.subtitle")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          {t("dashboardError.retry")}
        </Button>
        <Link href="/dashboard">
          <Button variant="outline" type="button">
            {t("dashboardError.home")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
