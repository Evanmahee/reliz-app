import Link from "next/link";
import { AllergyWarningBadge } from "@/components/dashboard/allergy-warning-badge";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { GUEST_REQUEST, GUEST_REQUEST_STATUS } from "@/lib/constants";
import {
  normalizeRequestCategory,
  REQUEST_CATEGORY_STYLES,
} from "@/lib/request-category";
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
  allergyContent,
  type,
  typeLabel,
  category,
  categoryLabel,
  message,
  status,
  claimedByName,
  claimedByOther,
  urgencyLabels,
  pendingLabel,
  doneLabel,
  claimedByLabel,
  lockedLabel,
  escalatedLabel,
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
  allergyContent?: string;
  type: string;
  typeLabel: string;
  category?: string | null;
  categoryLabel?: string;
  message: string;
  status: string;
  claimedByName?: string | null;
  claimedByOther?: boolean;
  urgencyLabels: Record<RequestUrgency, string>;
  pendingLabel: string;
  doneLabel: string;
  claimedByLabel?: string;
  lockedLabel?: string;
  escalatedLabel?: string;
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
  const cat = normalizeRequestCategory(category);
  const catStyles = REQUEST_CATEGORY_STYLES[cat];
  const isEscalated = status === GUEST_REQUEST_STATUS.ESCALATED;
  const isActive =
    status === GUEST_REQUEST_STATUS.PENDING ||
    status === GUEST_REQUEST_STATUS.IN_PROGRESS ||
    isEscalated;
  const isDone = status === GUEST_REQUEST_STATUS.DONE;

  return (
    <li>
      <Link
        href={href}
        className={`flex gap-3 border-l-4 px-4 py-4 transition-colors hover:bg-zinc-50 sm:gap-4 ${
          isEscalated ? "border-l-red-600 bg-red-50/90" : catStyles.border
        } ${
          claimedByOther && !isEscalated
            ? "bg-zinc-100/80 opacity-70"
            : isActive
              ? isEscalated
                ? ""
                : "bg-white"
              : "bg-zinc-50/50"
        }`}
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            isEscalated ? "bg-red-100" : styles.bg
          }`}
        >
          <MaterialSymbol
            name={isEscalated ? "priority_high" : styles.icon}
            filled
            size={22}
            className={isEscalated ? "text-red-800" : styles.text}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-lg font-bold tabular-nums tracking-tight text-zinc-900">
              {tableLocation
                ? `${tablePrefix} ${tableNumber} — ${tableLocation}`
                : `${tablePrefix} ${tableNumber}`}
            </span>
            {allergyContent ? (
              <AllergyWarningBadge content={allergyContent} compact />
            ) : null}
            {categoryLabel ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${catStyles.badge}`}
              >
                {categoryLabel}
              </span>
            ) : null}
            {isEscalated && escalatedLabel ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">
                {escalatedLabel}
              </span>
            ) : isActive ? (
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
            {claimedByName && claimedByLabel ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  isEscalated
                    ? "bg-red-50 text-red-800"
                    : claimedByOther
                      ? "bg-zinc-200 text-zinc-600"
                      : "bg-violet-50 text-violet-900"
                }`}
              >
                {claimedByLabel.replace("{name}", claimedByName)}
              </span>
            ) : null}
          </div>

          <p
            className={`mt-1 text-sm font-semibold ${
              isEscalated ? "text-red-900" : styles.text
            }`}
          >
            {typeLabel}
          </p>
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

        {claimedByOther && lockedLabel ? (
          <span className="hidden shrink-0 self-start rounded-full bg-zinc-200 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 sm:inline">
            {lockedLabel}
          </span>
        ) : isActive && !isDone ? (
          <span
            className={`hidden shrink-0 self-start rounded-full px-2.5 py-0.5 text-[11px] font-medium sm:inline ${
              isEscalated
                ? "bg-red-100 text-red-800"
                : "bg-amber-50 text-amber-900"
            }`}
          >
            {isEscalated && escalatedLabel ? escalatedLabel : pendingLabel}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
