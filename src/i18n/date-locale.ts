import type { Locale } from "@/i18n/config";

/** Tag BCP 47 pour `toLocaleString` / `toLocaleDateString`. */
export function dateLocaleTag(locale: Locale): string {
  return locale === "en" ? "en-GB" : "fr-FR";
}
