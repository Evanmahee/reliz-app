import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppToaster } from "@/components/ui/app-toaster";
import { I18nProvider } from "@/i18n/i18n-provider";
import { getLocale } from "@/i18n/get-locale";
import { getT } from "@/i18n/server";
import de from "@/i18n/messages/de";
import en from "@/i18n/messages/en";
import es from "@/i18n/messages/es";
import fr from "@/i18n/messages/fr";
import type { Locale } from "@/i18n/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#f4f4f5",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messagesByLocale = { fr, en, es, de } as const;
  const messages = messagesByLocale[locale];
  const htmlLang: Record<Locale, string> = {
    fr: "fr",
    en: "en",
    es: "es",
    de: "de",
  };
  const htmlLangAttr = htmlLang[locale];

  return (
    <html
      lang={htmlLangAttr}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
        <AppToaster />
      </body>
    </html>
  );
}
