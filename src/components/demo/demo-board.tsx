"use client";

import { useCallback, useEffect, useState } from "react";
import type { IconType } from "react-icons";
import {
  MdOutlineChevronRight,
  MdOutlineClose,
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
import { DEMO_SLUG } from "@/lib/demo";
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

/**
 * Écran « équipe » de la démo : liste en direct (toutes les 4 s, écran visible),
 * chaque demande s'ouvre et peut être prise en charge puis traitée.
 */
export function DemoBoard() {
  const { t } = useT();
  const [rows, setRows] = useState<Row[]>([]);
  const [eventName, setEventName] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      // Les demandes envoyées depuis le téléphone invité de CE navigateur
      // (même stockage que l'app invité, intégrée dans la même page).
      let ids: string[] = [];
      try {
        const sent = JSON.parse(localStorage.getItem(`reliz_sent_${DEMO_SLUG}`) ?? "[]") as { id?: string }[];
        ids = Array.isArray(sent) ? sent.map((s) => String(s?.id ?? "")).filter(Boolean).slice(0, 20) : [];
      } catch {
        /* stockage indisponible : liste vide */
      }
      const res = await fetch(`/api/demo/requests?ids=${encodeURIComponent(ids.join(","))}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { eventName: string; requests: Row[] };
      setRows(data.requests);
      setEventName(data.eventName);
      setNow(Date.now());
    } catch {
      /* réseau : on réessaie au prochain tour */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- premier chargement depuis l’API
    void load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load]);

  async function act(id: string, action: "claim" | "done") {
    setBusy(true);
    // mise à jour immédiate à l'écran, puis confirmation par le serveur
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: action === "claim" ? "IN_PROGRESS" : "DONE" } : r,
      ),
    );
    try {
      await fetch(`/api/demo/requests/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    } finally {
      setBusy(false);
      if (action === "done") setOpenId(null);
      void load();
    }
  }

  const pending = rows.filter((r) => r.status !== "DONE").length;
  const ago = (iso: string) => {
    const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
    return s < 60
      ? t("demo.secondsAgo").replace("{n}", String(s))
      : t("demo.minutesAgo").replace("{n}", String(Math.round(s / 60)));
  };
  const statusView = (status: string) =>
    status === "DONE"
      ? { icon: MdOutlineDoneAll, label: t("demo.done"), cls: "bg-emerald-50 text-emerald-700" }
      : status === "IN_PROGRESS"
        ? { icon: MdOutlineDirectionsRun, label: t("demo.inProgress"), cls: "bg-brand-50 text-brand-700" }
        : { icon: MdOutlineSchedule, label: t("demo.new"), cls: "bg-amber-50 text-amber-800" };
  const open = rows.find((r) => r.id === openId) ?? null;

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
            const st = statusView(r.status);
            const StIcon = st.icon;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(r.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl bg-white p-3.5 text-left ring-1 transition active:scale-[0.99] ${
                    r.status === "DONE" ? "opacity-60 ring-brand-900/5" : "ring-brand-900/10 hover:ring-brand-500/40"
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] text-brand-900/50">
                      {t("demo.table").replace("{n}", r.tableNumber)}
                      {r.tableLocation ? ` — ${r.tableLocation}` : ""} · {ago(r.createdAt)}
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-medium text-brand-950">{r.message}</span>
                    <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${st.cls}`}>
                      <StIcon className="h-3.5 w-3.5" aria-hidden />
                      {st.label}
                    </span>
                  </span>
                  <MdOutlineChevronRight className="mt-2 h-5 w-5 shrink-0 text-brand-900/25" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-brand-950/40" onClick={() => setOpenId(null)}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full rounded-t-[2rem] bg-white p-5 pb-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-brand-900/10" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand-900/50">
                  {t("demo.table").replace("{n}", open.tableNumber)}
                  {open.tableLocation ? ` · ${open.tableLocation}` : ""}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-brand-950">{open.message}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                aria-label={t("demo.close")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-900/5 text-brand-900/60"
              >
                <MdOutlineClose className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl bg-cream p-3">
                <dt className="text-[11px] text-brand-900/50">{t("demo.sentAt")}</dt>
                <dd className="font-medium text-brand-950">{ago(open.createdAt)}</dd>
              </div>
              <div className="rounded-2xl bg-cream p-3">
                <dt className="text-[11px] text-brand-900/50">{t("demo.status")}</dt>
                <dd className="font-medium text-brand-950">{statusView(open.status).label}</dd>
              </div>
            </dl>

            {open.status !== "DONE" ? (
              <div className="mt-5 grid gap-2">
                {open.status !== "IN_PROGRESS" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void act(open.id, "claim")}
                    className="w-full rounded-2xl bg-brand-950 px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {t("demo.claim")}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void act(open.id, "done")}
                  className={`w-full rounded-2xl px-4 py-3.5 text-sm font-semibold disabled:opacity-60 ${
                    open.status === "IN_PROGRESS"
                      ? "bg-brand-950 text-white"
                      : "bg-white text-brand-950 ring-1 ring-brand-900/15"
                  }`}
                >
                  {t("demo.markDone")}
                </button>
              </div>
            ) : (
              <p className="mt-5 rounded-2xl bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-800">
                {t("demo.doneMessage")}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
