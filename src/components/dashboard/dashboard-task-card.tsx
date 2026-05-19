"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toggleInstructionCheckboxAction } from "@/app/actions/events";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useT } from "@/i18n/i18n-provider";

export function DashboardTaskCard({
  eventId,
  blockId,
  eventName,
  label,
  assigneeName,
  unassignedLabel,
  pendingLabel,
  doneLabel,
  checked = false,
  hideEventName = false,
}: {
  eventId: string;
  blockId: string;
  eventName: string;
  label: string;
  assigneeName: string | null;
  unassignedLabel: string;
  pendingLabel: string;
  doneLabel?: string;
  checked?: boolean;
  /** Sur la fiche événement, masquer le nom d’événement en doublon. */
  hideEventName?: boolean;
}) {
  const { t } = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const title = label.trim() || t("instructionEditor.untitled");
  const href = `/dashboard/evenements/${eventId}`;
  const resolvedDoneLabel = doneLabel ?? t("dashboard.doneBadge");

  function onToggle(nextChecked: boolean) {
    startTransition(async () => {
      await toggleInstructionCheckboxAction(eventId, blockId, nextChecked);
      router.refresh();
    });
  }

  const content = (
    <>
      <p
        className={`text-base font-bold leading-snug text-zinc-900 ${checked ? "text-zinc-500 line-through" : ""}`}
      >
        {title}
      </p>
      <p className={`mt-0.5 text-sm ${checked ? "text-zinc-400" : "text-zinc-600"}`}>
        {assigneeName ?? unassignedLabel}
      </p>
      {!hideEventName ? (
        <p className="mt-1 text-xs text-zinc-400">{eventName}</p>
      ) : null}
    </>
  );

  return (
    <li>
      <div
        className={`flex items-center gap-3 px-4 py-4 transition-colors sm:gap-4 ${checked ? "bg-zinc-50/80" : "bg-white hover:bg-zinc-50"}`}
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${checked ? "bg-zinc-100" : "bg-violet-100"}`}
        >
          <MaterialSymbol
            name="assignment"
            filled
            size={22}
            className={checked ? "text-zinc-500" : "text-violet-900"}
          />
        </div>

        <input
          type="checkbox"
          checked={checked}
          disabled={pending}
          onChange={(e) => onToggle(e.target.checked)}
          className="size-4 shrink-0 rounded border-zinc-300 accent-zinc-900 disabled:opacity-50"
          aria-label={t("instructionEditor.checkboxAria")}
        />

        {hideEventName ? (
          <div className="min-w-0 flex-1">{content}</div>
        ) : (
          <Link href={href} className="min-w-0 flex-1">
            {content}
          </Link>
        )}

        <span
          className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium sm:inline ${
            checked
              ? "bg-emerald-50 text-emerald-800"
              : "bg-violet-50 text-violet-900"
          }`}
        >
          {checked ? resolvedDoneLabel : pendingLabel}
        </span>
      </div>
    </li>
  );
}
