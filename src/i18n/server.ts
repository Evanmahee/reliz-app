import "server-only";
import { getLocale } from "@/i18n/get-locale";
import { translate } from "@/i18n/translate";
import de from "@/i18n/messages/de";
import en from "@/i18n/messages/en";
import es from "@/i18n/messages/es";
import fr from "@/i18n/messages/fr";

const dict = { fr, en, es, de } as const;

export async function getMessages() {
  const locale = await getLocale();
  return dict[locale] as Record<string, unknown>;
}

export async function getT() {
  const locale = await getLocale();
  const messages = dict[locale] as Record<string, unknown>;
  return {
    locale,
    t: (path: string) => translate(messages, path),
  };
}
