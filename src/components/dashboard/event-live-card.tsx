"use client";

import Link from "next/link";
import { archiveEventFormAction } from "@/app/actions/events";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { dateLocaleTag } from "@/i18n/date-locale";
import { useT } from "@/i18n/i18n-provider";

export function EventLiveCard({
  id,
  name,
  venue,
  startsAtIso,
}: {
  id: string;
  name: string;
  venue: string;
  startsAtIso: string | null;
}) {
  const { t, locale } = useT();
  const dateLabel =
    startsAtIso && !Number.isNaN(new Date(startsAtIso).getTime())
      ? new Date(startsAtIso).toLocaleString(dateLocaleTag(locale), {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : t("events.dateTbd");

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-colors hover:border-zinc-300">
      <Link
        href={`/dashboard/evenements/${id}`}
        className="block flex-1 px-5 py-5 transition-colors hover:bg-zinc-50/50"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-900">{name}</p>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
            {t("events.cardLive")}
          </span>
        </div>
        {venue ? (
          <p className="mt-1 text-xs text-zinc-500">{venue}</p>
        ) : null}
        <p className="mt-3 text-xs text-zinc-400">{dateLabel}</p>
      </Link>
      <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-3">
        <form
          action={archiveEventFormAction}
          onSubmit={(e) => {
            if (!confirm(t("events.endConfirm"))) {
              e.preventDefault();
            }
          }}
          className="flex justify-end"
        >
          <input type="hidden" name="eventId" value={id} />
          <SubmitButton
            variant="outline"
            className="text-xs font-medium text-zinc-700"
            pendingLabel={t("events.archiving")}
          >
            {t("events.endEvent")}
          </SubmitButton>
        </form>
      </div>
    </Card>
  );
}
