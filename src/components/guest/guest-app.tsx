"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { IconType } from "react-icons";
import {
  MdCheck,
  MdOutlineChevronRight,
  MdOutlineClose,
  MdOutlineCloudOff,
  MdOutlineDinnerDining,
  MdOutlineDirectionsRun,
  MdOutlineDoneAll,
  MdOutlineEmergency,
  MdOutlineHealthAndSafety,
  MdOutlineLocalBar,
  MdOutlineMoreHoriz,
  MdOutlineRoomService,
  MdOutlineSchedule,
} from "react-icons/md";
import { GUEST_REQUEST, GUEST_REQUEST_STATUS, REQUEST_CATEGORY } from "@/lib/constants";
import {
  enqueueGuestRequest,
  flushGuestRequestQueue,
  newClientRequestId,
  pendingGuestRequestCount,
  postGuestRequestWithRetry,
} from "@/lib/guest-request-submit";
import type { RequestCategory } from "@/lib/request-category";
import { useT } from "@/i18n/i18n-provider";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  outOfStock: boolean;
  hidden?: boolean;
};

/** Une action proposée à l'invité (tuile). */
type Action = {
  key: "drink" | "clear" | "waiter" | "other";
  icon: IconType;
  type: string;
  category: RequestCategory;
  /** Clé i18n de la liste de suggestions ; absente = envoi direct après confirmation. */
  ideasKey?: "ideasDrink" | "ideasClear" | "ideasOther";
};

const ACTIONS: Action[] = [
  { key: "drink", icon: MdOutlineLocalBar, type: GUEST_REQUEST.SERVICE, category: REQUEST_CATEGORY.DRINK, ideasKey: "ideasDrink" },
  { key: "clear", icon: MdOutlineDinnerDining, type: GUEST_REQUEST.SERVICE, category: REQUEST_CATEGORY.CLEAR, ideasKey: "ideasClear" },
  { key: "waiter", icon: MdOutlineRoomService, type: GUEST_REQUEST.STAFF, category: REQUEST_CATEGORY.ASSISTANCE },
  { key: "other", icon: MdOutlineMoreHoriz, type: GUEST_REQUEST.SERVICE, category: REQUEST_CATEGORY.MISC, ideasKey: "ideasOther" },
];

const LABEL_KEY: Record<Action["key"], [string, string]> = {
  drink: ["guest.actDrink", "guest.actDrinkHint"],
  clear: ["guest.actClear", "guest.actClearHint"],
  waiter: ["guest.actWaiter", "guest.actWaiterHint"],
  other: ["guest.actOther", "guest.actOtherHint"],
};

/** Demande envoyée depuis ce téléphone (pour en suivre l'état). */
type SentRequest = {
  id: string;
  message: string;
  urgent?: boolean;
  /** Gardée sur le téléphone faute de réseau. */
  queued?: boolean;
  at: number;
  status?: string;
};

const SENT_MAX_AGE_MS = 6 * 60 * 60_000;

/** Fiche ouverte en bas d'écran. */
type Sheet =
  | { kind: "action"; action: Action }
  | { kind: "urgent" }
  | { kind: "product"; item: MenuItem }
  | null;

export function GuestApp({
  publicSlug,
  eventName,
  menuHidden,
  menuItems,
  initialTableNumber,
  initialTableLocation,
  isVip = false,
}: {
  publicSlug: string;
  eventName: string;
  menuHidden: boolean;
  menuItems: MenuItem[];
  initialTableNumber?: string;
  initialTableLocation?: string;
  isVip?: boolean;
}) {
  const { t, messages } = useT();
  const guestMessages = messages.guest as unknown as Record<string, unknown>;
  const ideas = (key: string) =>
    (Array.isArray(guestMessages[key]) ? guestMessages[key] : []) as string[];

  const storageKey = `reliz_table_${publicSlug}`;
  const locationKey = `reliz_table_loc_${publicSlug}`;
  const sentKey = `reliz_sent_${publicSlug}`;

  const [hydrated, setHydrated] = useState(false);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [tableDraft, setTableDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState<SentRequest[]>([]);
  const [allergiesDraft, setAllergiesDraft] = useState("");
  const [allergiesState, setAllergiesState] = useState<"idle" | "saving" | "saved">("idle");

  /* eslint-disable react-hooks/set-state-in-effect -- lecture du stockage local après hydratation */
  useEffect(() => {
    const fromUrl = initialTableNumber?.trim();
    const locFromUrl = initialTableLocation?.trim();
    if (fromUrl) {
      sessionStorage.setItem(storageKey, fromUrl);
      if (locFromUrl) sessionStorage.setItem(locationKey, locFromUrl);
      setTableNumber(fromUrl);
      setLocationDraft(locFromUrl || sessionStorage.getItem(locationKey) || "");
    } else {
      setTableNumber(sessionStorage.getItem(storageKey));
      setLocationDraft(sessionStorage.getItem(locationKey) ?? "");
    }
    try {
      const list = JSON.parse(localStorage.getItem(sentKey) ?? "[]") as SentRequest[];
      setSent(
        Array.isArray(list)
          ? list.filter((r) => Date.now() - r.at < SENT_MAX_AGE_MS)
          : [],
      );
    } catch {
      /* stockage indisponible */
    }
    setHydrated(true);
  }, [storageKey, locationKey, sentKey, initialTableNumber, initialTableLocation]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const flash = useCallback((msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  }, []);

  const rememberSent = useCallback(
    (update: (prev: SentRequest[]) => SentRequest[]) => {
      setSent((prev) => {
        const next = update(prev).slice(0, 10);
        try {
          localStorage.setItem(sentKey, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [sentKey],
  );

  // Faible connexion : renvoi automatique des demandes en attente.
  useEffect(() => {
    let cancelled = false;
    async function flush() {
      const sentCount = await flushGuestRequestQueue();
      if (cancelled) return;
      setQueuedCount(pendingGuestRequestCount(publicSlug));
      if (sentCount > 0) flash(t("guest.queuedSent"));
    }
    void flush();
    const onVisible = () => {
      if (document.visibilityState === "visible") void flush();
    };
    window.addEventListener("online", flush);
    document.addEventListener("visibilitychange", onVisible);
    const id = setInterval(() => {
      if (pendingGuestRequestCount(publicSlug) > 0) void flush();
    }, 20_000);
    return () => {
      cancelled = true;
      window.removeEventListener("online", flush);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(id);
    };
  }, [publicSlug, t, flash]);

  // Suivi : l'invité voit quand sa demande est prise en charge puis traitée.
  const openIds = sent
    .filter((r) => r.status !== GUEST_REQUEST_STATUS.DONE)
    .map((r) => r.id)
    .join(",");
  useEffect(() => {
    if (!openIds) return;
    let cancelled = false;
    async function poll() {
      if (document.visibilityState !== "visible" || navigator.onLine === false) return;
      try {
        const res = await fetch(
          `/api/guest/requests?slug=${encodeURIComponent(publicSlug)}&ids=${openIds}`,
          { cache: "no-store" },
        );
        if (!res.ok || cancelled) return;
        const rows = (await res.json()) as { id: string; status: string }[];
        const byId = new Map(rows.map((r) => [r.id, r.status]));
        rememberSent((prev) =>
          prev.map((r) =>
            byId.has(r.id) ? { ...r, status: byId.get(r.id), queued: false } : r,
          ),
        );
      } catch {
        /* réseau faible : on réessaiera */
      }
    }
    void poll();
    const id = setInterval(() => void poll(), 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [openIds, publicSlug, rememberSent]);

  function saveTable(e: React.FormEvent) {
    e.preventDefault();
    const v = tableDraft.trim();
    if (!v) {
      setError(t("guest.tableError"));
      return;
    }
    sessionStorage.setItem(storageKey, v);
    sessionStorage.setItem(locationKey, locationDraft.trim());
    setTableNumber(v);
    setTableDraft("");
    setError(null);
  }

  function clearTable() {
    sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem(locationKey);
    setTableNumber(null);
    setLocationDraft("");
  }

  function closeSheet() {
    setSheet(null);
    setDetails("");
  }

  const send = useCallback(
    (type: string, message: string, category: RequestCategory, urgent = false) => {
      if (!tableNumber) return;
      setError(null);
      setRetrying(false);
      start(async () => {
        const payload = {
          publicSlug,
          tableNumber,
          tableLocation: locationDraft.trim() || undefined,
          type,
          category,
          message,
          clientRequestId: newClientRequestId(),
        };
        const res = await postGuestRequestWithRetry(payload, () => setRetrying(true));
        setRetrying(false);
        if (!res.ok && res.error === "client") {
          setError(res.detail ?? t("guest.errors.sendFailed"));
          return;
        }
        if (!res.ok) {
          enqueueGuestRequest(payload);
          setQueuedCount(pendingGuestRequestCount(publicSlug));
        }
        rememberSent((prev) => [
          { id: payload.clientRequestId, message, urgent, queued: !res.ok, at: Date.now() },
          ...prev,
        ]);
        flash(
          !res.ok
            ? t("guest.queuedOffline")
            : urgent
              ? t("guest.urgentSent")
              : t("guest.requestSent"),
        );
        closeSheet();
        // Intégrée au site Reliz (démo) : on prévient la page, qui montre alors
        // le téléphone de l'équipe. Aucune donnée transmise, juste le signal.
        if (res.ok && window.parent !== window) {
          try {
            window.parent.postMessage({ type: "reliz:request-sent" }, "*");
          } catch {
            /* page hôte inaccessible : sans importance */
          }
        }
      });
    },
    [publicSlug, tableNumber, locationDraft, t, flash, rememberSent],
  );

  async function saveAllergies() {
    const text = allergiesDraft.trim();
    if (!text || !tableNumber) return;
    setAllergiesState("saving");
    setError(null);
    try {
      const res = await fetch("/api/guest/allergies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicSlug, tableNumber, allergies: text }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? t("guest.errors.sendFailed"));
        setAllergiesState("idle");
        return;
      }
      setAllergiesDraft("");
      setAllergiesState("saved");
      flash(t("guest.allergiesSaved"));
    } catch {
      setError(t("guest.errors.sendFailed"));
      setAllergiesState("idle");
    }
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-brand-900/50">
        {t("guest.loading")}
      </div>
    );
  }

  /* ---------- Choix de la table (QR sans numéro ou table changée) ---------- */
  if (!tableNumber) {
    return (
      <div className="space-y-5">
        <Hero eventName={eventName} label={t("guest.eventLabel")} />
        <form
          onSubmit={saveTable}
          className="space-y-4 rounded-3xl bg-white p-6 shadow-[0_1px_0_rgba(42,24,16,0.06)] ring-1 ring-brand-900/5"
        >
          <p className="text-sm text-brand-900/60">{t("guest.intro")}</p>
          <Field label={t("guest.tableLabel")}>
            <input
              inputMode="numeric"
              placeholder={t("guest.tablePlaceholder")}
              value={tableDraft}
              onChange={(e) => setTableDraft(e.target.value)}
              autoComplete="off"
              className={inputClass}
            />
          </Field>
          <Field label={t("guest.tableLocationLabel")}>
            <input
              placeholder={t("guest.tableLocationPh")}
              value={locationDraft}
              onChange={(e) => setLocationDraft(e.target.value)}
              autoComplete="off"
              className={inputClass}
            />
          </Field>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button type="submit" className={primaryClass}>
            {t("guest.continue")}
          </button>
        </form>
      </div>
    );
  }

  const visibleMenu = menuHidden ? [] : menuItems.filter((m) => !m.hidden);

  return (
    <div className="space-y-5 pb-24">
      <Hero eventName={eventName} label={t("guest.eventLabel")}>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/15">
            {t("guest.tableShort")} {tableNumber}
            {locationDraft ? <span className="text-white/60"> · {locationDraft}</span> : null}
          </span>
          {isVip ? (
            <span className="rounded-full bg-gradient-to-r from-[#e9c98f] to-[#c9a15c] px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-brand-950">
              VIP
            </span>
          ) : null}
          <button
            type="button"
            onClick={clearTable}
            className="ml-auto text-xs font-medium text-white/60 underline-offset-4 hover:text-white hover:underline"
          >
            {t("guest.changeTable")}
          </button>
        </div>
      </Hero>

      {retrying || queuedCount > 0 ? (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <MdOutlineCloudOff className="h-4 w-4 shrink-0" aria-hidden />
          {queuedCount > 0
            ? t("guest.queuedBanner").replace("{n}", String(queuedCount))
            : t("guest.retrying")}
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {error}
        </p>
      ) : null}

      {/* ---------- Actions principales ---------- */}
      <section>
        <h2 className="mb-3 px-1 text-[15px] font-semibold text-brand-950">
          {t("guest.greeting")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            const [label, hint] = LABEL_KEY[action.key];
            return (
              <button
                key={action.key}
                type="button"
                disabled={pending}
                onClick={() => setSheet({ kind: "action", action })}
                className="group flex min-h-[8.5rem] flex-col items-start justify-between rounded-3xl bg-white p-4 text-left ring-1 ring-brand-900/8 transition active:scale-[0.98] disabled:opacity-60"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-active:bg-brand-500 group-active:text-white">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-brand-950">{t(label)}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-brand-900/55">{t(hint)}</span>
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => setSheet({ kind: "urgent" })}
          className="mt-3 flex w-full items-center gap-3 rounded-3xl bg-white px-4 py-3.5 text-left ring-1 ring-red-200 transition active:scale-[0.99] disabled:opacity-60"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <MdOutlineEmergency className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-red-700">{t("guest.actUrgent")}</span>
            <span className="block text-xs text-red-900/55">{t("guest.actUrgentHint")}</span>
          </span>
          <MdOutlineChevronRight className="h-5 w-5 text-red-300" aria-hidden />
        </button>
      </section>

      {/* ---------- Suivi des demandes ---------- */}
      {sent.length > 0 ? (
        <section className="rounded-3xl bg-white p-4 ring-1 ring-brand-900/8">
          <h2 className="mb-2 px-1 text-sm font-semibold text-brand-950">{t("guest.myRequests")}</h2>
          <ul className="divide-y divide-brand-900/5">
            {sent.slice(0, 5).map((r) => (
              <RequestRow key={r.id} request={r} t={t} />
            ))}
          </ul>
        </section>
      ) : null}

      {/* ---------- Carte ---------- */}
      {visibleMenu.length > 0 ? (
        <section>
          <h2 className="mb-3 px-1 text-[15px] font-semibold text-brand-950">{t("guest.menuTitle")}</h2>
          <ul className="overflow-hidden rounded-3xl bg-white ring-1 ring-brand-900/8">
            {visibleMenu.map((item) => (
              <li key={item.id} className="border-b border-brand-900/5 last:border-0">
                <button
                  type="button"
                  disabled={item.outOfStock || pending}
                  onClick={() => setSheet({ kind: "product", item })}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left disabled:cursor-not-allowed"
                >
                  <span className="min-w-0 flex-1">
                    <span className={`block font-medium ${item.outOfStock ? "text-brand-900/40" : "text-brand-950"}`}>
                      {item.name}
                    </span>
                    {item.description ? (
                      <span className="mt-0.5 block text-sm text-brand-900/55">{item.description}</span>
                    ) : null}
                  </span>
                  {item.outOfStock ? (
                    <span className="shrink-0 rounded-full bg-brand-900/5 px-2.5 py-1 text-[11px] font-medium text-brand-900/50">
                      {t("guest.outOfStock")}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-brand-950 px-3 py-1.5 text-xs font-medium text-white">
                      {t("guest.order")}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ---------- Allergies ---------- */}
      <section className="rounded-3xl bg-white p-4 ring-1 ring-brand-900/8">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <MdOutlineHealthAndSafety className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <label htmlFor="guest-allergies" className="block text-sm font-semibold text-brand-950">
              {t("guest.allergiesLabel")}
            </label>
            <p className="mt-0.5 text-xs text-brand-900/55">{t("guest.allergiesHint")}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            id="guest-allergies"
            value={allergiesDraft}
            onChange={(e) => {
              setAllergiesDraft(e.target.value);
              if (allergiesState === "saved") setAllergiesState("idle");
            }}
            placeholder={t("guest.allergiesPh")}
            autoComplete="off"
            maxLength={500}
            className={`${inputClass} flex-1`}
          />
          <button
            type="button"
            onClick={() => void saveAllergies()}
            disabled={!allergiesDraft.trim() || allergiesState === "saving"}
            className="shrink-0 rounded-2xl bg-brand-950 px-4 text-sm font-medium text-white transition disabled:bg-brand-900/15 disabled:text-brand-900/40"
          >
            {t("guest.allergiesSave")}
          </button>
        </div>
        {allergiesState === "saved" ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <MdCheck className="h-4 w-4" aria-hidden />
            {t("guest.allergiesSaved")}
          </p>
        ) : null}
      </section>

      {/* ---------- Fiche en bas d'écran ---------- */}
      {sheet ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-brand-950/40 backdrop-blur-[2px] sm:items-center"
          onClick={closeSheet}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-t-[2rem] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[2rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-brand-900/10 sm:hidden" />
            <SheetBody
              sheet={sheet}
              details={details}
              setDetails={setDetails}
              ideas={ideas}
              pending={pending}
              t={t}
              tableNumber={tableNumber}
              onClose={closeSheet}
              onSend={(type, message, category, urgent) => send(type, message, category, urgent)}
            />
          </div>
        </div>
      ) : null}

      {feedback ? (
        <p
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] mx-auto flex max-w-lg items-center justify-center gap-2 rounded-2xl bg-brand-950 px-4 py-3.5 text-sm font-medium text-white shadow-xl"
        >
          <MdCheck className="h-5 w-5 text-emerald-400" aria-hidden />
          {feedback}
        </p>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------- */

const inputClass =
  "w-full rounded-2xl border-0 bg-cream px-4 py-3 text-[15px] text-brand-950 ring-1 ring-brand-900/10 placeholder:text-brand-900/35 focus:outline-none focus:ring-2 focus:ring-brand-500";

const primaryClass =
  "w-full rounded-2xl bg-brand-950 px-4 py-3.5 text-[15px] font-semibold text-white transition active:scale-[0.99] disabled:bg-brand-900/15 disabled:text-brand-900/40";

function Hero({
  eventName,
  label,
  children,
}: {
  eventName: string;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <header
      className="relative overflow-hidden rounded-[2rem] px-6 pb-6 pt-7 text-white"
      style={{
        background:
          "radial-gradient(ellipse 90% 80% at 15% 0%, #c45c26 0%, #6b2f14 38%, #2a1810 72%, #120c0a 100%)",
      }}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/55">{label}</p>
      <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight">{eventName}</h1>
      {children}
    </header>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-brand-900/60">{label}</span>
      {children}
    </label>
  );
}

type TFn = (key: string) => string;

function RequestRow({ request, t }: { request: SentRequest; t: TFn }) {
  const status = request.status;
  const view =
    status === GUEST_REQUEST_STATUS.DONE
      ? { icon: MdOutlineDoneAll, label: t("guest.stDone"), cls: "text-emerald-700 bg-emerald-50" }
      : status === GUEST_REQUEST_STATUS.IN_PROGRESS || status === GUEST_REQUEST_STATUS.ESCALATED
        ? { icon: MdOutlineDirectionsRun, label: t("guest.stProgress"), cls: "text-brand-700 bg-brand-50" }
        : status
          ? { icon: MdOutlineSchedule, label: request.urgent ? t("guest.stUrgent") : t("guest.stSent"), cls: "text-brand-900/60 bg-brand-900/5" }
          : request.queued
            ? { icon: MdOutlineCloudOff, label: t("guest.stQueued"), cls: "text-amber-800 bg-amber-50" }
            : { icon: MdOutlineSchedule, label: request.urgent ? t("guest.stUrgent") : t("guest.stSent"), cls: "text-brand-900/60 bg-brand-900/5" };
  const Icon = view.icon;
  return (
    <li className="flex items-center gap-3 px-1 py-2.5">
      <span className="min-w-0 flex-1 truncate text-sm text-brand-950">{request.message}</span>
      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${view.cls}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {view.label}
      </span>
    </li>
  );
}

function SheetBody({
  sheet,
  details,
  setDetails,
  ideas,
  pending,
  t,
  tableNumber,
  onClose,
  onSend,
}: {
  sheet: NonNullable<Sheet>;
  details: string;
  setDetails: (v: string) => void;
  ideas: (key: string) => string[];
  pending: boolean;
  t: TFn;
  tableNumber: string;
  onClose: () => void;
  onSend: (type: string, message: string, category: RequestCategory, urgent?: boolean) => void;
}) {
  // Pendant l'envoi : petite roue + « Envoi… » (le visiteur voit que ça part).
  const busy = (label: string) =>
    pending ? (
      <span className="inline-flex items-center justify-center gap-2">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
        {t("guest.sending")}
      </span>
    ) : (
      label
    );
  const header = (title: string, Icon?: IconType, danger = false) => (
    <div className="mb-4 flex items-center gap-3">
      {Icon ? (
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${danger ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-600"}`}>
          <Icon className="h-6 w-6" aria-hidden />
        </span>
      ) : null}
      <h3 className="flex-1 text-lg font-semibold text-brand-950">{title}</h3>
      <button
        type="button"
        onClick={onClose}
        aria-label={t("guest.cancel")}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900/5 text-brand-900/60"
      >
        <MdOutlineClose className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );

  if (sheet.kind === "urgent") {
    return (
      <>
        {header(t("guest.actUrgent"), MdOutlineEmergency, true)}
        <p className="text-sm text-brand-900/60">{t("guest.actUrgentHint")}</p>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={t("guest.sheetDetails")}
          rows={2}
          maxLength={300}
          className={`${inputClass} mt-4 resize-none`}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            onSend(
              GUEST_REQUEST.STAFF,
              details.trim() || t("guest.staffMessage").replace("{table}", tableNumber),
              REQUEST_CATEGORY.URGENT,
              true,
            )
          }
          className="mt-4 w-full rounded-2xl bg-red-600 px-4 py-3.5 text-[15px] font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
        >
          {busy(t("guest.urgentConfirm"))}
        </button>
      </>
    );
  }

  if (sheet.kind === "product") {
    const { item } = sheet;
    return (
      <>
        {header(item.name)}
        {item.description ? <p className="-mt-2 mb-3 text-sm text-brand-900/55">{item.description}</p> : null}
        <input
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={t("guest.precisionPh")}
          maxLength={200}
          className={inputClass}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            onSend(
              GUEST_REQUEST.PRODUCT,
              details.trim() ? `${item.name} — ${details.trim()}` : item.name,
              REQUEST_CATEGORY.OTHER,
            )
          }
          className={`${primaryClass} mt-4`}
        >
          {busy(t("guest.sheetSend"))}
        </button>
      </>
    );
  }

  const { action } = sheet;
  const [labelKey] = LABEL_KEY[action.key];

  // Serveur : pas de détail obligatoire, un seul geste.
  if (!action.ideasKey) {
    return (
      <>
        {header(t(labelKey), action.icon)}
        <p className="text-sm text-brand-900/60">{t("guest.actWaiterHint")}</p>
        <input
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={t("guest.sheetDetails")}
          maxLength={300}
          className={`${inputClass} mt-4`}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            onSend(
              action.type,
              details.trim() || t("guest.staffMessage").replace("{table}", tableNumber),
              action.category,
            )
          }
          className={`${primaryClass} mt-4`}
        >
          {busy(t("guest.waiterConfirm"))}
        </button>
      </>
    );
  }

  const list = ideas(action.ideasKey);
  return (
    <>
      {header(t(labelKey), action.icon)}
      <div className="flex flex-wrap gap-2">
        {list.map((idea) => {
          const active = details
            .split(",")
            .map((s) => s.trim())
            .includes(idea);
          return (
            <button
              key={idea}
              type="button"
              onClick={() => {
                const parts = details.split(",").map((s) => s.trim()).filter(Boolean);
                setDetails(
                  (active ? parts.filter((p) => p !== idea) : [...parts, idea]).join(", "),
                );
              }}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-950 text-white"
                  : "bg-cream text-brand-950 ring-1 ring-brand-900/10"
              }`}
            >
              {idea}
            </button>
          );
        })}
      </div>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder={t("guest.sheetDetails")}
        rows={2}
        maxLength={500}
        className={`${inputClass} mt-4 resize-none`}
      />
      <button
        type="button"
        disabled={pending || !details.trim()}
        onClick={() => onSend(action.type, details.trim(), action.category)}
        className={`${primaryClass} mt-4`}
      >
        {busy(t("guest.sheetSend"))}
      </button>
    </>
  );
}
