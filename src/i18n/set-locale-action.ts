"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/i18n/config";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~400 jours

function safeRedirectPath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }
  return path;
}

export async function setLocaleAction(formData: FormData) {
  const raw = String(formData.get("locale") ?? "");
  const next: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const returnTo = safeRedirectPath(String(formData.get("returnTo") ?? "/"));

  const jar = await cookies();
  jar.set(LOCALE_COOKIE, next, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
  });

  revalidatePath("/", "layout");
  redirect(returnTo);
}

/** URL de retour interne (referer path) pour le switcher. */
export async function getLocaleSwitcherReturnTo(): Promise<string> {
  const h = await headers();
  const ref = h.get("referer");
  if (!ref) return "/dashboard";
  try {
    const u = new URL(ref);
    const path = u.pathname + u.search;
    return safeRedirectPath(path);
  } catch {
    return "/dashboard";
  }
}
