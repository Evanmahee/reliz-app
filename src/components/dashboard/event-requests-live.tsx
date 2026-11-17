"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { markRequestDoneAction } from "@/app/actions/events";
import {
  AllergyWarningBadge,
  joinAllergyContents,
} from "@/components/dashboard/allergy-warning-badge";
import { RequestClaimControls } from "@/components/dashboard/request-claim-controls";
import { Button } from "@/components/ui/button";
import { GUEST_REQUEST_STATUS, REQUEST_CATEGORY, USER_ROLE } from "@/lib/constants";
import {
  normalizeRequestCategory,
  REQUEST_CATEGORY_STYLES,
} from "@/lib/request-category";
import { dateLocaleTag } from "@/i18n/date-locale";
import { useT } from "@/i18n/i18n-provider";

type ClaimedBy = {
  id: string;
  name: string | null;
} | null;

type Row = {
  id: string;
  tableNumber: string;
  tableLocation?: string | null;
  type: string;
  category?: string | null;
  message: string;
  status: string;
  createdAt: string;
  claimedById: string | null;
  claimedBy: ClaimedBy;
  isVip?: boolean;
};

export function EventRequestsLive({
  eventId,
  currentUserId,
  currentUserRole,
}: {
  eventId: string;
  currentUserId: string;
  currentUserRole: string;
}) {
  const { t, locale } = useT();
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  /** Demandes marquées traitées ici : masquées tout de suite (sans attendre le serveur). */
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set());
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [knownZones, setKnownZones] = useState<string[]>([]);
  const [allergiesByTable, setAllergiesByTable] = useState<
    Record<string, string>
  >({});

  function typeLabel(typ: string) {
    if (typ === "PRODUCT") return t("dashboard.order");
    if (typ === "SERVICE") return t("dashboard.service");
    if (typ === "STAFF") return t("dashboard.staff");
    return typ;
  }

  /** Tables et allergies changent peu : rechargées toutes les 30 s seulement. */
  const lastAuxLoadRef = useRef(0);
  const inflightRef = useRef(false);

  const load = useCallback(async (): Promise<boolean> => {
    if (inflightRef.current) return true;
    inflightRef.current = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const opts = { cache: "no-store" as const, signal: controller.signal };
    const withAux = Date.now() - lastAuxLoadRef.current > 30_000;
    try {
      const [reqRes, tablesRes, allergiesRes] = await Promise.all([
        fetch(`/api/evenements/${eventId}/demandes`, opts),
        withAux ? fetch(`/api/events/${eventId}/tables`, opts) : null,
        withAux ? fetch(`/api/events/${eventId}/allergies`, opts) : null,
      ]);
      if (!reqRes.ok) {
        setErr(tRef.current("events.requests.loadError"));
        return false;
      }
      const data = (await reqRes.json()) as Row[];
      setErr(null);
      setRows(data);

      if (tablesRes?.ok) {
        const tables = (await tablesRes.json()) as {
          zone?: string;
        }[];
        const fromTables = tables
          .map((tb) => (tb.zone ?? "").trim())
          .filter(Boolean);
        setKnownZones(
          Array.from(new Set(fromTables)).sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: "base" }),
          ),
        );
      }

      if (allergiesRes?.ok) {
        const allergies = (await allergiesRes.json()) as {
          tableNumber: string;
          content: string;
        }[];
        const map: Record<string, string[]> = {};
        for (const a of allergies) {
          (map[a.tableNumber] ??= []).push(a.content);
        }
        const joined: Record<string, string> = {};
        for (const [num, contents] of Object.entries(map)) {
          joined[num] = joinAllergyContents(contents);
        }
        setAllergiesByTable(joined);
      }
      if (withAux && tablesRes?.ok && allergiesRes?.ok) {
        lastAuxLoadRef.current = Date.now();
      }
      return true;
    } catch {
      // Réseau faible : on garde les dernières demandes affichées.
      setErr(tRef.current("events.requests.networkError"));
      return false;
    } finally {
      clearTimeout(timer);
      inflightRef.current = false;
    }
  }, [eventId]);

  /**
   * Rafraîchissement économe : toutes les 8 s, espacé jusqu'à 30 s après des
   * échecs, en pause quand l'écran est masqué, immédiat au retour du réseau.
   */
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;

    async function tick() {
      if (cancelled) return;
      clearTimeout(timer);
      if (document.visibilityState === "hidden") return;
      const ok = await load();
      if (cancelled) return;
      failures = ok ? 0 : Math.min(failures + 1, 3);
      const delay = [8000, 15000, 25000, 30000][failures]!;
      timer = setTimeout(() => void tick(), delay);
    }
    const wake = () => {
      if (document.visibilityState === "visible") void tick();
    };

    void tick();
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [load]);

  async function markDone(requestId: string) {
    setDoneIds((prev) => new Set(prev).add(requestId));
    try {
      await markRequestDoneAction(requestId, eventId);
      toast.success(t("events.requests.toastDone"));
      void load();
    } catch (e) {
      console.error(e);
      setDoneIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
      toast.error(t("events.requests.loadError"));
    }
  }

  const active = rows
    .filter((r) => !doneIds.has(r.id))
    .filter(
      (r) =>
        r.status === GUEST_REQUEST_STATUS.PENDING ||
        r.status === GUEST_REQUEST_STATUS.IN_PROGRESS ||
        r.status === GUEST_REQUEST_STATUS.ESCALATED,
    )
    .slice()
    .sort((a, b) => {
      const ea = a.status === GUEST_REQUEST_STATUS.ESCALATED ? 0 : 1;
      const eb = b.status === GUEST_REQUEST_STATUS.ESCALATED ? 0 : 1;
      if (ea !== eb) return ea - eb;
      const ca =
        normalizeRequestCategory(a.category) === REQUEST_CATEGORY.URGENT
          ? 0
          : 1;
      const cb =
        normalizeRequestCategory(b.category) === REQUEST_CATEGORY.URGENT
          ? 0
          : 1;
      if (ca !== cb) return ca - cb;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  const done = rows.filter((r) => r.status === GUEST_REQUEST_STATUS.DONE);
  const baseDisplay = showHistory ? done : active;
  const displayRows =
    zoneFilter === "all"
      ? baseDisplay
      : zoneFilter === "__none__"
        ? baseDisplay.filter((r) => !(r.tableLocation ?? "").trim())
        : baseDisplay.filter(
            (r) => (r.tableLocation ?? "").trim() === zoneFilter,
          );

  const groupedByZone =
    knownZones.length > 0 && zoneFilter === "all" && !showHistory
      ? knownZones
          .map((zone) => ({
            zone,
            rows: displayRows.filter(
              (r) => (r.tableLocation ?? "").trim() === zone,
            ),
          }))
          .filter((g) => g.rows.length > 0)
      : null;
  const unzonedRows =
    groupedByZone && knownZones.length > 0
      ? displayRows.filter((r) => !(r.tableLocation ?? "").trim())
      : [];
  const canManageOthers =
    currentUserRole === USER_ROLE.OWNER ||
    currentUserRole === USER_ROLE.MAITRE_HOTEL;

  const historyLabel = showHistory
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

  function tableLine(r: Row) {
    const zone = (r.tableLocation ?? "").trim();
    if (zone) {
      return `${t("dashboard.table")} ${r.tableNumber} — ${zone}`;
    }
    return `${t("dashboard.table")} ${r.tableNumber}`;
  }

  function allergiesForRows(list: Row[]) {
    return joinAllergyContents(
      list
        .map((r) => allergiesByTable[r.tableNumber] ?? "")
        .filter(Boolean),
    );
  }

  function renderRequest(r: Row) {
    const isEscalated = r.status === GUEST_REQUEST_STATUS.ESCALATED;
    const lockedByOther =
      Boolean(r.claimedById) &&
      r.claimedById !== currentUserId &&
      !isEscalated;
    const cat = normalizeRequestCategory(r.category);
    const catStyles = REQUEST_CATEGORY_STYLES[cat];
    const allergyText = allergiesByTable[r.tableNumber] ?? "";
    return (
      <li
        key={r.id}
        className={`flex flex-col gap-2 border-l-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
          isEscalated
            ? "border-l-red-600 bg-red-50/80"
            : `${catStyles.border} ${
                lockedByOther ? "bg-zinc-100/80 opacity-70" : ""
              }`
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span>
              {new Date(r.createdAt).toLocaleString(dateLocaleTag(locale), {
                dateStyle: "short",
                timeStyle: "short",
              })}
              {" · "}
              {tableLine(r)}
            </span>
            {r.isVip ? (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                VIP
              </span>
            ) : null}
            {allergyText ? (
              <AllergyWarningBadge content={allergyText} compact />
            ) : null}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-zinc-900">
              {typeLabel(r.type)}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${catStyles.badge}`}
            >
              {t(`guest.categories.${cat.toLowerCase()}`)}
            </span>
          </div>
          <p className="text-sm text-zinc-600">{r.message}</p>
          {!showHistory ? (
            <div className="mt-2">
              <RequestClaimControls
                requestId={r.id}
                status={r.status}
                claimedById={r.claimedById}
                claimedBy={r.claimedBy}
                currentUserId={currentUserId}
                canManageOthers={canManageOthers}
                onChanged={() => void load()}
              />
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {r.status === GUEST_REQUEST_STATUS.DONE ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              {t("dashboard.doneBadge")}
            </span>
          ) : lockedByOther ? (
            <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600">
              {t("events.requests.locked")}
            </span>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="text-xs"
              onClick={() => void markDone(r.id)}
            >
              {t("events.requests.markDone")}
            </Button>
          )}
        </div>
      </li>
    );
  }

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
            {active.length} {t("events.requests.pending")}
          </span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            {doneCountLabel}
          </span>
        )}
      </div>

      {knownZones.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setZoneFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              zoneFilter === "all"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {t("events.requests.zoneAll")}
          </button>
          {knownZones.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoneFilter(z)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                zoneFilter === z
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      ) : null}

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
      ) : groupedByZone ? (
        <div className="space-y-4">
          {groupedByZone.map((g) => {
            const zoneAllergies = allergiesForRows(g.rows);
            return (
            <div key={g.zone} className="space-y-2">
              <h3 className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <span>{g.zone}</span>
                {zoneAllergies ? (
                  <AllergyWarningBadge content={zoneAllergies} compact />
                ) : null}
              </h3>
              <ul className="divide-y divide-zinc-100 rounded-[1.35rem] border border-zinc-100 bg-zinc-50/40">
                {g.rows.map(renderRequest)}
              </ul>
            </div>
            );
          })}
          {unzonedRows.length > 0 ? (
            <div className="space-y-2">
              <h3 className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <span>{t("events.requests.zoneNone")}</span>
                {allergiesForRows(unzonedRows) ? (
                  <AllergyWarningBadge
                    content={allergiesForRows(unzonedRows)}
                    compact
                  />
                ) : null}
              </h3>
              <ul className="divide-y divide-zinc-100 rounded-[1.35rem] border border-zinc-100 bg-zinc-50/40">
                {unzonedRows.map(renderRequest)}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-[1.35rem] border border-zinc-100 bg-zinc-50/40">
          {displayRows.map(renderRequest)}
        </ul>
      )}
    </div>
  );
}
