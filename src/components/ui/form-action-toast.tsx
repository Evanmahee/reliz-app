"use client";

import { toast } from "sonner";
import { isNextRedirectError } from "@/lib/is-next-redirect-error";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/i18n/config";
import { translate } from "@/i18n/translate";
import de from "@/i18n/messages/de";
import en from "@/i18n/messages/en";
import es from "@/i18n/messages/es";
import fr from "@/i18n/messages/fr";

const messagesByLocale = { fr, en, es, de } as const;

function commonErrorMessage(): string {
  let locale: Locale = DEFAULT_LOCALE;
  if (typeof document !== "undefined") {
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${LOCALE_COOKIE}=`))
      ?.split("=")[1];
    if (isLocale(raw)) locale = raw;
  }
  return translate(
    messagesByLocale[locale] as unknown as Record<string, unknown>,
    "common.error",
  );
}

/** Entoure une Server Action sur formulaire : toast succès / erreur (ignore les redirect Next). */
export function wrapFormActionWithToast(
  action: (formData: FormData) => Promise<void>,
  opts: { success: string; error?: string },
): (formData: FormData) => Promise<void> {
  return async (formData: FormData) => {
    try {
      await action(formData);
      toast.success(opts.success);
    } catch (err) {
      if (isNextRedirectError(err)) throw err;
      console.error(err);
      toast.error(opts.error ?? commonErrorMessage());
    }
  };
}
