"use client";

import QRCode from "react-qr-code";

export function EventQrCard({
  url,
  downloadHref,
}: {
  url: string;
  downloadHref: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[1.75rem] border border-zinc-100 bg-white px-5 py-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="rounded-[1.25rem] border border-zinc-100 bg-white p-3">
        <QRCode value={url} size={160} fgColor="#0a0a0a" bgColor="#ffffff" />
      </div>
      <div className="max-w-sm flex-1 space-y-2 text-center sm:text-left">
        <p className="text-xs font-medium text-zinc-400">Lien invité</p>
        <p className="break-all text-sm text-zinc-600">{url}</p>
        <a
          href={downloadHref}
          download
          className="inline-flex items-center justify-center rounded-[1.25rem] bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Télécharger le QR (PNG)
        </a>
      </div>
    </div>
  );
}
