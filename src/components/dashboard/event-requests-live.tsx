"use client";

import { useEffect, useRef, useState } from "react";
import { markRequestDoneFormAction } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { wrapFormActionWithToast } from "@/components/ui/form-action-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import { dateLocaleTag } from "@/i18n/date-locale";
import { useT } from "@/i18n/i18n-provider";

type Row = {
  id: string;
  tableNumber: string;
  type: string;
  message: string;
  status: string;
  createdAt: string;
};

export function EventRequestsLive({ eventId }: { eventId: string }) {
  const { t, locale } = useT();
  const tRef = useRef(t);
  tRef.current = t;
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  function typeLabel(typ: string) {
    if (typ === "PRODUCT") return t("dashboard.order");
    if (typ === "SERVICE") return t("dashboard.service");
    if (typ === "STAFF") return t("dashboard.staff");
    return typ;
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/evenements/${eventId}/demandes`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setErr(tRef.current("events.requests.loadError"));
          return;
        }
        const data = (await res.json()) as Row[];
        if (!cancelled) {
          setErr(null);
          setRows(data);
        }
      } catch {
        if (!cancelled) setErr(tRef.current("events.requests.networkError"));
      }
    }
    load();
    const id = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [eventId]);

  const pending = rows.filter((r) => r.status === "PENDING");
  const done = rows.filter((r) => r.status === "DONE");
  const displayRows = showHistory ? done : pending;

  const historyLabel =
    showHistory
      ? t("events.requests.backPending")
      : done.length > 0
        ? t("events.requests.historyWithCount").replace(
            "{n}",
            String(done.length),
          )
        : t("events.requests.history");

  const doneCountLabel =
    done.length === 1
      ? `1 ${t("events.requests.treated")}`
      : `${done.length} ${t("events.requests.treatedPlural")}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <h2 className="text-lg font-semibold text-zinc-900">
            {t("events.requests.title")}
          </h2>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 px-3 py-1.5 text-xs font-medium"
            onClick={() => setShowHistory((v) => !v)}
          >
            {historyLabel}
          </Button>
        </div>
        {!showHistory ? (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            {pending.length} {t("events.requests.pending")}
          </span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            {doneCountLabel}
          </span>
        )}
      </div>

      {showHistory ? (
        <p className="text-xs text-zinc-500">{t("events.requests.historyHint")}</p>
      ) : null}

      {err ? (
        <p className="text-sm text-red-600">{err}</p>
      ) : displayRows.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {showHistory
            ? t("events.requests.noHistory")
            : t("events.requests.noPending")}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-[1.35rem] border border-zinc-100 bg-zinc-50/40">
          {displayRows.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-400">
                  {new Date(r.createdAt).toLocaleString(dateLocaleTag(locale), {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                  {" · "}
                  {t("dashboard.table")} {r.tableNumber}
                </p>
                <p className="text-sm font-medium text-zinc-900">
                  {typeLabel(r.type)}
                </p>
                <p className="text-sm text-zinc-600">{r.message}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.status === "DONE" ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                    {t("dashboard.doneBadge")}
                  </span>
                ) : (
                  <form
                    action={wrapFormActionWithToast(markRequestDoneFormAction, {
                      success: t("events.requests.toastDone"),
                    })}
                  >
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="eventId" value={eventId} />
                    <SubmitButton variant="outline" className="text-xs" pendingLabel="…">
                      {t("events.requests.markDone")}
                    </SubmitButton>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
