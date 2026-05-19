import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { GUEST_REQUEST } from "@/lib/constants";
import {
  getRequestUrgency,
  urgencyWaitMinutes,
  type RequestUrgency,
} from "@/lib/request-urgency";

const TYPE_STYLES: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  [GUEST_REQUEST.PRODUCT]: {
    bg: "bg-violet-100",
    text: "text-violet-900",
    icon: "restaurant",
  },
  [GUEST_REQUEST.SERVICE]: {
    bg: "bg-sky-100",
    text: "text-sky-900",
    icon: "room_service",
  },
  [GUEST_REQUEST.STAFF]: {
    bg: "bg-rose-100",
    text: "text-rose-900",
    icon: "groups",
  },
};

const URGENCY_BADGE: Record<RequestUrgency, string> = {
  fresh: "bg-zinc-100 text-zinc-600",
  waiting: "bg-amber-100 text-amber-900",
  urgent: "bg-red-100 text-red-900",
};

export function DashboardRequestCard({
  href,
  createdAt,
  eventName,
  venue,
  tableNumber,
  tableLocation,
  type,
  typeLabel,
  message,
  status,
  urgencyLabels,
  pendingLabel,
  doneLabel,
  tablePrefix,
  venuePrefix,
  minLabel,
}: {
  href: string;
  createdAt: Date;
  eventName: string;
  venue: string;
  tableNumber: string;
  tableLocation: string;
  type: string;
  typeLabel: string;
  message: string;
  status: string;
  urgencyLabels: Record<RequestUrgency, string>;
  pendingLabel: string;
  doneLabel: string;
  tablePrefix: string;
  venuePrefix: string;
  minLabel: string;
}) {
  const urgency = getRequestUrgency(createdAt);
  const waitMin = urgencyWaitMinutes(createdAt);
  const styles = TYPE_STYLES[type] ?? {
    bg: "bg-zinc-100",
    text: "text-zinc-800",
    icon: "notifications",
  };
  const isPending = status === "PENDING";

  return (
    <li>
      <Link
        href={href}
        className={`flex gap-3 px-4 py-4 transition-colors hover:bg-zinc-50 sm:gap-4 ${isPending ? "bg-white" : "bg-zinc-50/50"}`}
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${styles.bg}`}
        >
          <MaterialSymbol
            name={styles.icon}
            filled
            size={22}
            className={styles.text}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-lg font-bold tabular-nums tracking-tight text-zinc-900">
              {tablePrefix} {tableNumber}
            </span>
            {tableLocation ? (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                {tableLocation}
              </span>
            ) : null}
            {isPending ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${URGENCY_BADGE[urgency]}`}
              >
                {urgencyLabels[urgency]}
                {waitMin > 0 ? ` · ${waitMin} ${minLabel}` : ""}
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                {doneLabel}
              </span>
            )}
          </div>

          <p className={`mt-1 text-sm font-semibold ${styles.text}`}>{typeLabel}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-zinc-700">{message}</p>

          <p className="mt-2 text-xs text-zinc-400">
            <span className="font-medium text-zinc-500">{eventName}</span>
            {venue ? (
              <>
                <span className="text-zinc-300"> · </span>
                <span>
                  {venuePrefix} {venue}
                </span>
              </>
            ) : null}
          </p>
        </div>

        {isPending ? (
          <span className="hidden shrink-0 self-start rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-900 sm:inline">
            {pendingLabel}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
