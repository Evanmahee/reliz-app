import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppToaster } from "@/components/ui/app-toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reliz — Événements & service invités",
  description:
    "Gestion d’événements pour traiteurs : carte, consignes, QR invités et demandes en direct.",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#f4f4f5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
