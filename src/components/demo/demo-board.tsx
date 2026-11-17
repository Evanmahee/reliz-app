"use client";

import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import {
  MdOutlineDinnerDining,
  MdOutlineDirectionsRun,
  MdOutlineDoneAll,
  MdOutlineEmergency,
  MdOutlineLocalBar,
  MdOutlineMoreHoriz,
  MdOutlineRestaurantMenu,
  MdOutlineRoomService,
  MdOutlineSchedule,
} from "react-icons/md";
import { DEMO_WAITER } from "@/lib/demo";
import { useT } from "@/i18n/i18n-provider";

type Row = {
  id: string;
  tableNumber: string;
  tableLocation: string;
  category: string;
  message: string;
  status: string;
  createdAt: string;
};

const ICON: Record<string, IconType> = {
  DRINK: MdOutlineLocalBar,
  CLEAR: MdOutlineDinnerDining,
  ASSISTANCE: MdOutlineRoomService,
  URGENT: MdOutlineEmergency,
  MISC: MdOutlineMoreHoriz,
  OTHER: MdOutlineRestaurantMenu,
};

/** Écran « équipe » de la démo : se met à jour toutes les 4 s quand il est visible. */
export function DemoBoard() {
  const { t } = useT();
  const [rows, setRows] = useState<Row[]>([]);
  const [eventName, setEventName] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let stop = false;
    async function load() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/demo/requests", { cache: "no-store" });
        if (!res.ok || stop) return;
        const data = (await res.json()) as { eventName: string; requests: Row[] };
        setRows(data.requests);
        setEventName(data.eventName);
        setNow(Date.now());
      } catch {
        /* réseau : on réessaie au prochain tour */
      }
    }
    void load();
    const id = setInterval(load, 4000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  const pending = rows.filter((r) => r.status !== "DONE").length;
  const ago = (iso: string) => {
    const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
    return s < 60
      ? t("demo.secondsAgo").replace("{n}", String(s))
      : t("demo.minutesAgo").replace("{n}", String(Math.round(s / 60)));
  };

  return (
    <div className="min-h-screen bg-cream px-4 pb-8 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-brand-950">{t("demo.title")}</h1>
        <span className="rounded-full bg-brand-950 px-3 py-1 text-xs font-medium text-white">
          {t("demo.pending").replace("{n}", String(pending))}
        </span>
      </div>
      <p className="mt-1 flex items-center gap-2 text-xs text-brand-900/60">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        {t("demo.live")}
        {eventName ? ` · ${eventName}` : ""}
      </p>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-white p-6 text-center ring-1 ring-brand-900/8">
          <p className="text-sm font-medium text-brand-950">{t("demo.emptyTitle")}</p>
          <p className="mt-1 text-xs text-brand-900/55">{t("demo.emptyHint")}</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {rows.map((r) => {
            const Icon = ICON[r.category] ?? MdOutlineRestaurantMenu;
            const done = r.status === "DONE";
            const progress = r.status === "IN_PROGRESS";
            return (
              <li
                key={r.id}
                className={`rounded-2xl bg-white p-3.5 ring-1 transition ${
                  done ? "opacity-60 ring-brand-900/5" : "ring-brand-900/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-brand-900/50">
                      {t("demo.table").replace("{n}", r.tableNumber)}
                      {r.tableLocation ? ` — ${r.tableLocation}` : ""} · {ago(r.createdAt)}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-medium text-brand-950">{r.message}</p>
                    <p
                      className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        done
                          ? "bg-emerald-50 text-emerald-700"
                          : progress
                            ? "bg-brand-50 text-brand-700"
                            : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {done ? (
                        <MdOutlineDoneAll className="h-3.5 w-3.5" aria-hidden />
                      ) : progress ? (
                        <MdOutlineDirectionsRun className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <MdOutlineSchedule className="h-3.5 w-3.5" aria-hidden />
                      )}
                      {done
                        ? t("demo.done")
                        : progress
                          ? t("demo.claimed").replace("{name}", DEMO_WAITER)
                          : t("demo.new")}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
