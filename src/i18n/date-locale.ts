import type { Locale } from "@/i18n/config";

/** Tag BCP 47 pour `toLocaleString` / `toLocaleDateString`. */
export function dateLocaleTag(locale: Locale): string {
  if (locale === "en") return "en-GB";
  if (locale === "es") return "es-ES";
  if (locale === "de") return "de-DE";
  return "fr-FR";
}
