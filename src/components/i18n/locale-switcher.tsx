"use client";

import { setLocaleAction } from "@/i18n/set-locale-action";
import { useT } from "@/i18n/i18n-provider";
import type { Locale } from "@/i18n/config";

export function LocaleSwitcher({
  returnTo,
  className = "",
}: {
  returnTo: string;
  className?: string;
}) {
  const { locale, t } = useT();
  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="group"
      aria-label={t("locale.switch")}
    >
      <form action={setLocaleAction} className="inline-flex gap-1">
        <input type="hidden" name="returnTo" value={returnTo} />
        {(["fr", "en"] as const).map((code: Locale) => (
          <button
            key={code}
            type="submit"
            name="locale"
            value={code}
            className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
              locale === code
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {t(`locale.${code}`)}
          </button>
        ))}
      </form>
    </div>
  );
}
