export const LOCALE_COOKIE = "reliz_lang";

export const SUPPORTED_LOCALES = ["fr", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

export function isLocale(v: string | undefined | null): v is Locale {
  return v === "fr" || v === "en";
}
