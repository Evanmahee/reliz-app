/** Conversion mm → px à 96 dpi (écran / print CSS). */
export const MM_TO_PX_96 = 96 / 25.4;

export type QrLabelPresetId = "small" | "medium" | "large" | "custom";

export type QrLabelSize = {
  widthMm: number;
  heightMm: number;
};

export const QR_LABEL_PRESETS: Record<
  Exclude<QrLabelPresetId, "custom">,
  QrLabelSize & { hintKey: string }
> = {
  small: {
    widthMm: 35,
    heightMm: 35,
    hintKey: "events.qrLabel.hintSmall",
  },
  medium: {
    widthMm: 50,
    heightMm: 50,
    hintKey: "events.qrLabel.hintMedium",
  },
  large: {
    widthMm: 62,
    heightMm: 62,
    hintKey: "events.qrLabel.hintLarge",
  },
};

export function clampLabelMm(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(200, Math.max(15, Math.round(value * 10) / 10));
}

export function resolveLabelSize(
  preset: QrLabelPresetId,
  custom: QrLabelSize,
): QrLabelSize {
  if (preset === "custom") {
    return {
      widthMm: clampLabelMm(custom.widthMm, 50),
      heightMm: clampLabelMm(custom.heightMm, 50),
    };
  }
  return {
    widthMm: QR_LABEL_PRESETS[preset].widthMm,
    heightMm: QR_LABEL_PRESETS[preset].heightMm,
  };
}

export function mmToPx(mm: number, dpi = 96): number {
  return Math.round(mm * (dpi / 25.4));
}

/** Taille du QR (px) pour tenir dans l’étiquette avec zone texte. */
export function qrPixelSize(size: QrLabelSize, dpi = 96): number {
  const w = mmToPx(size.widthMm, dpi);
  const h = mmToPx(size.heightMm, dpi);
  const pad = Math.max(4, Math.round(Math.min(w, h) * 0.06));
  const textBlock = Math.round(h * 0.26);
  const available = Math.min(w - pad * 2, h - textBlock - pad * 2);
  return Math.max(48, available);
}

export function labelFontSizes(size: QrLabelSize): {
  titlePx: number;
  zonePx: number;
  badgePx: number;
} {
  const minMm = Math.min(size.widthMm, size.heightMm);
  return {
    titlePx: Math.max(9, Math.round(minMm * 0.22)),
    zonePx: Math.max(7, Math.round(minMm * 0.14)),
    badgePx: Math.max(7, Math.round(minMm * 0.12)),
  };
}
