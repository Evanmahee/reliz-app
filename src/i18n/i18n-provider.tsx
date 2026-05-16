"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/translate";
import type { MessageTree } from "@/i18n/messages/fr";

type Messages = MessageTree;

const I18nContext = createContext<{
  locale: Locale;
  messages: Messages;
} | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useT must be used within I18nProvider");
  }
  const { locale, messages } = ctx;
  const t = useCallback(
    (path: string) =>
      translate(messages as unknown as Record<string, unknown>, path),
    [messages],
  );
  return { locale, t, messages };
}
