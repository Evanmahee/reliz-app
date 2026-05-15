"use client";

import { useEffect, useState } from "react";
import { markRequestDoneFormAction } from "@/app/actions/events";
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  tableNumber: string;
  type: string;
  message: string;
  status: string;
  createdAt: string;
};

function typeLabel(t: string) {
  if (t === "PRODUCT") return "Commande";
  if (t === "SERVICE") return "Service";
  if (t === "STAFF") return "Personnel";
  return t;
}

export function EventRequestsLive({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/evenements/${eventId}/demandes`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setErr("Impossible de charger les demandes.");
          return;
        }
        const data = (await res.json()) as Row[];
        if (!cancelled) {
          setErr(null);
          setRows(data);
        }
      } catch {
        if (!cancelled) setErr("Réseau indisponible.");
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <h2 className="text-lg font-semibold text-zinc-900">
            Demandes invités
          </h2>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 px-3 py-1.5 text-xs font-medium"
            onClick={() => setShowHistory((v) => !v)}
          >
            {showHistory
              ? "← Attentes"
              : `Historique${done.length > 0 ? ` (${done.length})` : ""}`}
          </Button>
        </div>
        {!showHistory ? (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            {pending.length} en attente
          </span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            {done.length} traitée{done.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {showHistory ? (
        <p className="text-xs text-zinc-500">
          Demandes marquées comme traitées, les plus récentes en premier.
        </p>
      ) : null}

      {err ? (
        <p className="text-sm text-red-600">{err}</p>
      ) : displayRows.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {showHistory
            ? "Aucune demande dans l’historique pour le moment."
            : "Aucune demande en attente."}
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
                  {new Date(r.createdAt).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                  {" · "}
                  Table {r.tableNumber}
                </p>
                <p className="text-sm font-medium text-zinc-900">
                  {typeLabel(r.type)}
                </p>
                <p className="text-sm text-zinc-600">{r.message}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.status === "DONE" ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                    Traité
                  </span>
                ) : (
                  <form action={markRequestDoneFormAction}>
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="eventId" value={eventId} />
                    <Button type="submit" variant="outline" className="text-xs">
                      Marquer traité
                    </Button>
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
