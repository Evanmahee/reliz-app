"use client";

import { setLocaleAction } from "@/i18n/set-locale-action";
import { useT } from "@/i18n/i18n-provider";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/config";

export function LocaleSwitcher({
  returnTo,
  className = "",
  variant = "buttons",
}: {
  returnTo: string;
  className?: string;
  /** `select` = menu déroulant (mobile) */
  variant?: "buttons" | "select";
}) {
  const { locale, t } = useT();

  if (variant === "select") {
    return (
      <form
        action={setLocaleAction}
        className={className}
        aria-label={t("locale.switch")}
      >
        <input type="hidden" name="returnTo" value={returnTo} />
        <select
          name="locale"
          defaultValue={locale}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="h-9 appearance-none rounded-[1.15rem] border border-zinc-200 bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2371717a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.65rem center",
          }}
        >
          {SUPPORTED_LOCALES.map((code: Locale) => (
            <option key={code} value={code}>
              {t(`locale.${code}`)}
            </option>
          ))}
        </select>
      </form>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="group"
      aria-label={t("locale.switch")}
    >
      <form action={setLocaleAction} className="inline-flex gap-1">
        <input type="hidden" name="returnTo" value={returnTo} />
        {SUPPORTED_LOCALES.map((code: Locale) => (
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
