"use client";

import { useMemo, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import ReactQrCode from "react-qr-code";
import JSZip from "jszip";
import { useT } from "@/i18n/i18n-provider";
import { buildTableGuestUrl } from "@/lib/table-guest-url";
import {
  labelFontSizes,
  mmToPx,
  QR_LABEL_PRESETS,
  qrPixelSize,
  resolveLabelSize,
  type QrLabelPresetId,
  type QrLabelSize,
} from "@/lib/qr-label-size";
import type { EventTableRow } from "@/components/dashboard/event-tables-panel";

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
  return img;
}

async function renderLabelPng(opts: {
  url: string;
  tableLabel: string;
  zone: string;
  isVip: boolean;
  size: QrLabelSize;
  vipLabel: string;
}): Promise<Blob> {
  const dpi = 96;
  const w = mmToPx(opts.size.widthMm, dpi);
  const h = mmToPx(opts.size.heightMm, dpi);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  const fonts = labelFontSizes(opts.size);
  const pad = Math.max(4, Math.round(Math.min(w, h) * 0.06));
  const qrSize = qrPixelSize(opts.size, dpi);
  const dataUrl = await QRCode.toDataURL(opts.url, {
    width: qrSize,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0a0a0a", light: "#ffffff" },
  });
  const qrImg = await loadImage(dataUrl);
  const qx = Math.round((w - qrSize) / 2);
  const qy = pad;
  ctx.drawImage(qrImg, qx, qy, qrSize, qrSize);

  let ty = qy + qrSize + Math.round(pad * 0.6);
  ctx.fillStyle = "#18181b";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `600 ${fonts.titlePx}px system-ui, sans-serif`;
  ctx.fillText(opts.tableLabel, w / 2, ty, w - pad * 2);
  ty += fonts.titlePx + 2;

  if (opts.zone) {
    ctx.fillStyle = "#71717a";
    ctx.font = `500 ${fonts.zonePx}px system-ui, sans-serif`;
    ctx.fillText(opts.zone, w / 2, ty, w - pad * 2);
    ty += fonts.zonePx + 3;
  }

  if (opts.isVip) {
    ctx.font = `700 ${fonts.badgePx}px system-ui, sans-serif`;
    const textW = ctx.measureText(opts.vipLabel).width;
    const badgeW = Math.max(fonts.badgePx * 3.2, textW + fonts.badgePx);
    const badgeH = fonts.badgePx + 6;
    const bx = (w - badgeW) / 2;
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(bx, ty, badgeW, badgeH);
    ctx.fillStyle = "#78350f";
    ctx.textBaseline = "middle";
    ctx.fillText(opts.vipLabel, w / 2, ty + badgeH / 2);
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("blob");
  return blob;
}

export function EventQrCard({
  url,
  downloadHref,
  eventId,
  publicSlug,
  tables = [],
}: {
  url: string;
  downloadHref: string;
  eventId: string;
  publicSlug: string;
  tables?: EventTableRow[];
}) {
  const { t } = useT();
  const [preset, setPreset] = useState<QrLabelPresetId>("medium");
  const [custom, setCustom] = useState<QrLabelSize>({
    widthMm: 50,
    heightMm: 50,
  });
  const [zipBusy, setZipBusy] = useState(false);

  const size = useMemo(
    () => resolveLabelSize(preset, custom),
    [preset, custom],
  );
  const fonts = useMemo(() => labelFontSizes(size), [size]);
  const qrSize = useMemo(() => qrPixelSize(size, 96), [size]);

  const appBase = (() => {
    try {
      return new URL(url).origin;
    } catch {
      return url.replace(/\/e\/.*$/, "");
    }
  })();

  async function downloadZip() {
    if (zipBusy || tables.length === 0) return;
    setZipBusy(true);
    try {
      const zip = new JSZip();
      for (const table of tables) {
        const guestUrl = buildTableGuestUrl(
          appBase,
          publicSlug,
          table.number,
          table.zone,
        );
        const blob = await renderLabelPng({
          url: guestUrl,
          tableLabel: `${t("events.tables.tableLabel")} ${table.number}`,
          zone: table.zone,
          isVip: table.isVip,
          size,
          vipLabel: "VIP",
        });
        const safeName = table.number.replace(/[/\\?%*:|"<>]/g, "-");
        zip.file(`table-${safeName}.png`, blob);
      }
      const out = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(out);
      a.download = `qr-tables-${publicSlug}-${size.widthMm}x${size.heightMm}mm.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.location.href = `/api/events/${eventId}/tables/qr-zip?widthMm=${size.widthMm}&heightMm=${size.heightMm}`;
    } finally {
      setZipBusy(false);
    }
  }

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[1.75rem] border border-zinc-100 bg-white px-5 py-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="rounded-[1.25rem] border border-zinc-100 bg-white p-3">
          <ReactQrCode
            value={url}
            size={160}
            fgColor="#0a0a0a"
            bgColor="#ffffff"
          />
        </div>
        <div className="max-w-sm flex-1 space-y-2 text-center sm:text-left">
          <p className="text-xs font-medium text-zinc-400">
            {t("events.qrGuestLink")}
          </p>
          <p className="break-all text-sm text-zinc-600">{url}</p>
          <p className="text-xs text-zinc-500">{t("events.qrFallbackHint")}</p>
          <a
            href={downloadHref}
            download
            className="inline-flex items-center justify-center rounded-[1.25rem] bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {t("events.qrDownloadPng")}
          </a>
        </div>
      </div>
    );
  }

  const presetOptions: { id: QrLabelPresetId; label: string }[] = [
    { id: "small", label: t("events.qrLabel.small") },
    { id: "medium", label: t("events.qrLabel.medium") },
    { id: "large", label: t("events.qrLabel.large") },
    { id: "custom", label: t("events.qrLabel.custom") },
  ];

  const hint =
    preset === "custom"
      ? t("events.qrLabel.hintCustom")
      : t(QR_LABEL_PRESETS[preset].hintKey);

  return (
    <div className="qr-label-print-root space-y-4">
      <div className="qr-label-print-controls space-y-3 print:hidden">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">
              {t("events.qrTablesHint").replace("{n}", String(tables.length))}
            </p>
            <label className="block text-xs font-medium text-zinc-500">
              {t("events.qrLabel.format")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presetOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPreset(opt.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    preset === opt.id
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-zinc-400">{hint}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              {t("events.qrPrint")}
            </button>
            <button
              type="button"
              disabled={zipBusy}
              onClick={() => void downloadZip()}
              className="inline-flex items-center justify-center rounded-[1.25rem] bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {zipBusy
                ? t("events.qrLabel.zipping")
                : t("events.qrDownloadAll")}
            </button>
          </div>
        </div>

        {preset === "custom" ? (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-zinc-600">
              <span>{t("events.qrLabel.width")}</span>
              <input
                type="number"
                min={15}
                max={200}
                step={0.5}
                value={custom.widthMm}
                onChange={(e) =>
                  setCustom((c) => ({
                    ...c,
                    widthMm: Number(e.target.value) || c.widthMm,
                  }))
                }
                className="w-20 rounded-xl border border-zinc-200 px-2 py-1.5 text-sm"
              />
              <span>mm</span>
            </label>
            <span className="text-zinc-300">×</span>
            <label className="flex items-center gap-2 text-xs text-zinc-600">
              <span>{t("events.qrLabel.height")}</span>
              <input
                type="number"
                min={15}
                max={200}
                step={0.5}
                value={custom.heightMm}
                onChange={(e) =>
                  setCustom((c) => ({
                    ...c,
                    heightMm: Number(e.target.value) || c.heightMm,
                  }))
                }
                className="w-20 rounded-xl border border-zinc-200 px-2 py-1.5 text-sm"
              />
              <span>mm</span>
            </label>
          </div>
        ) : null}
      </div>

      <div
        className="qr-label-grid flex flex-wrap gap-3"
        style={
          {
            ["--label-w"]: `${size.widthMm}mm`,
            ["--label-h"]: `${size.heightMm}mm`,
          } as CSSProperties
        }
      >
        {tables.map((table) => {
          const guestUrl = buildTableGuestUrl(
            appBase,
            publicSlug,
            table.number,
            table.zone,
          );
          return (
            <div
              key={table.id}
              className="qr-label-card flex flex-col items-center justify-between border border-zinc-200 bg-white"
              style={{
                width: `${size.widthMm}mm`,
                height: `${size.heightMm}mm`,
                padding: `${Math.max(1.2, size.widthMm * 0.05)}mm`,
                boxSizing: "border-box",
              }}
            >
              <div className="flex flex-1 items-center justify-center">
                <ReactQrCode
                  value={guestUrl}
                  size={qrSize}
                  fgColor="#0a0a0a"
                  bgColor="#ffffff"
                  style={{
                    width: qrSize,
                    height: qrSize,
                    maxWidth: "100%",
                  }}
                />
              </div>
              <div className="w-full shrink-0 text-center">
                <p
                  className="font-semibold leading-tight text-zinc-900"
                  style={{ fontSize: fonts.titlePx }}
                >
                  {t("events.tables.tableLabel")} {table.number}
                </p>
                {table.zone ? (
                  <p
                    className="mt-0.5 font-medium leading-tight text-zinc-500"
                    style={{ fontSize: fonts.zonePx }}
                  >
                    {table.zone}
                  </p>
                ) : null}
                {table.isVip ? (
                  <span
                    className="mt-1 inline-block rounded-full bg-amber-100 px-1.5 font-semibold text-amber-900"
                    style={{
                      fontSize: fonts.badgePx,
                      lineHeight: 1.4,
                    }}
                  >
                    VIP
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
