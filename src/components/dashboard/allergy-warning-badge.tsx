"use client";

import { useId, useState } from "react";
import { useT } from "@/i18n/i18n-provider";

/** Badge ⚠️ allergies avec détail au survol / focus / tap. */
export function AllergyWarningBadge({
  content,
  compact = false,
}: {
  content: string;
  compact?: boolean;
}) {
  const { t } = useT();
  const tipId = useId();
  const [open, setOpen] = useState(false);
  const text = content.trim();
  if (!text) return null;

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className={`inline-flex items-center gap-1 rounded-full bg-amber-100 font-semibold text-amber-950 ring-1 ring-amber-300/60 ${
          compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"
        }`}
        aria-describedby={open ? tipId : undefined}
        aria-label={t("events.allergies.badgeAria")}
        title={text}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <span aria-hidden>⚠️</span>
        <span>{t("events.allergies.badge")}</span>
      </button>
      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 max-w-[16rem] rounded-xl border border-amber-200 bg-white px-3 py-2 text-left text-xs font-medium leading-snug text-amber-950 shadow-md whitespace-pre-wrap"
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}

/** Agrège plusieurs notes d’allergies pour une même table. */
export function joinAllergyContents(contents: string[]): string {
  return Array.from(
    new Set(
      contents
        .map((c) => c.trim())
        .filter(Boolean),
    ),
  ).join("\n");
}
