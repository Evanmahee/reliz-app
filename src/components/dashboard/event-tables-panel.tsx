"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AllergyWarningBadge } from "@/components/dashboard/allergy-warning-badge";
import { useT } from "@/i18n/i18n-provider";

export type EventTableRow = {
  id: string;
  number: string;
  zone: string;
  isVip: boolean;
};

type AllergyRow = {
  id: string;
  tableNumber: string;
  content: string;
};

export function EventTablesPanel({
  eventId,
  archived,
  onTablesChange,
}: {
  eventId: string;
  archived: boolean;
  onTablesChange?: (tables: EventTableRow[]) => void;
}) {
  const { t } = useT();
  const [tables, setTables] = useState<EventTableRow[]>([]);
  const [allergiesByTable, setAllergiesByTable] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [number, setNumber] = useState("");
  const [zone, setZone] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [bulkTo, setBulkTo] = useState("");
  const [bulkZone, setBulkZone] = useState("");
  const [bulkVip, setBulkVip] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNumber, setEditNumber] = useState("");
  const [editZone, setEditZone] = useState("");
  const [editVip, setEditVip] = useState(false);
  const [allergyOpenFor, setAllergyOpenFor] = useState<string | null>(null);
  const [allergyDraft, setAllergyDraft] = useState("");

  const loadAllergies = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/allergies`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as AllergyRow[];
    const map: Record<string, string> = {};
    for (const row of data) {
      const prev = map[row.tableNumber];
      map[row.tableNumber] = prev
        ? `${prev}\n${row.content}`
        : row.content;
    }
    setAllergiesByTable(map);
  }, [eventId]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/tables`, {
        cache: "no-store",
      });
      if (!res.ok) {
        toast.error(t("events.tables.loadError"));
        return;
      }
      const data = (await res.json()) as EventTableRow[];
      setTables(data);
      onTablesChange?.(data);
      await loadAllergies();
    } catch {
      toast.error(t("events.tables.loadError"));
    } finally {
      setLoading(false);
    }
  }, [eventId, onTablesChange, t, loadAllergies]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addOne(e: React.FormEvent) {
    e.preventDefault();
    const n = number.trim();
    if (!n || busy || archived) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: n, zone: zone.trim(), isVip }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast.error(err?.error ?? t("events.tables.saveError"));
        return;
      }
      setNumber("");
      setZone("");
      setIsVip(false);
      toast.success(t("events.tables.toastAdded"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function addBulk(e: React.FormEvent) {
    e.preventDefault();
    const to = Number(bulkTo);
    if (!Number.isFinite(to) || to < 1 || busy || archived) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulkFrom: 1,
          bulkTo: Math.floor(to),
          zone: bulkZone.trim(),
          isVip: bulkVip,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast.error(err?.error ?? t("events.tables.saveError"));
        return;
      }
      const data = (await res.json()) as { created: number };
      setBulkTo("");
      toast.success(
        t("events.tables.toastBulk").replace("{n}", String(data.created)),
      );
      await load();
    } finally {
      setBusy(false);
    }
  }

  function startEdit(row: EventTableRow) {
    setEditingId(row.id);
    setEditNumber(row.number);
    setEditZone(row.zone);
    setEditVip(row.isVip);
    setAllergyOpenFor(null);
  }

  async function saveEdit(tableId: string) {
    if (busy || archived) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}/tables/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: editNumber.trim(),
          zone: editZone.trim(),
          isVip: editVip,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast.error(err?.error ?? t("events.tables.saveError"));
        return;
      }
      setEditingId(null);
      toast.success(t("events.tables.toastUpdated"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(tableId: string) {
    if (busy || archived) return;
    if (!window.confirm(t("events.tables.deleteConfirm"))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}/tables/${tableId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error(t("events.tables.saveError"));
        return;
      }
      toast.success(t("events.tables.toastDeleted"));
      await load();
    } finally {
      setBusy(false);
    }
  }

  function openAllergies(tableNumber: string) {
    setEditingId(null);
    setAllergyOpenFor(tableNumber);
    setAllergyDraft(allergiesByTable[tableNumber] ?? "");
  }

  async function saveAllergies(tableNumber: string) {
    if (busy || archived) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}/allergies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber,
          content: allergyDraft.trim(),
        }),
      });
      if (!res.ok) {
        toast.error(t("events.allergies.saveError"));
        return;
      }
      toast.success(t("events.allergies.toastSaved"));
      setAllergyOpenFor(null);
      await loadAllergies();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-zinc-500">{t("events.tables.loading")}</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">
          {t("events.tables.title")}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">{t("events.tables.hint")}</p>
      </div>

      {!archived ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <form
            onSubmit={addOne}
            className="space-y-3 rounded-[1.35rem] border border-zinc-100 bg-zinc-50/50 p-4"
          >
            <p className="text-xs font-medium text-zinc-500">
              {t("events.tables.addOne")}
            </p>
            <Input
              placeholder={t("events.tables.numberPh")}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
            />
            <Input
              placeholder={t("events.tables.zonePh")}
              value={zone}
              onChange={(e) => setZone(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={isVip}
                onChange={(e) => setIsVip(e.target.checked)}
                className="rounded border-zinc-300"
              />
              {t("events.tables.vip")}
            </label>
            <Button type="submit" disabled={busy} className="w-full sm:w-auto">
              {t("events.tables.add")}
            </Button>
          </form>

          <form
            onSubmit={addBulk}
            className="space-y-3 rounded-[1.35rem] border border-zinc-100 bg-zinc-50/50 p-4"
          >
            <p className="text-xs font-medium text-zinc-500">
              {t("events.tables.bulkTitle")}
            </p>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm text-zinc-600">
                {t("events.tables.bulkFrom")}
              </span>
              <Input
                type="number"
                min={1}
                max={500}
                placeholder="N"
                value={bulkTo}
                onChange={(e) => setBulkTo(e.target.value)}
                required
                className="max-w-[8rem]"
              />
            </div>
            <Input
              placeholder={t("events.tables.zonePh")}
              value={bulkZone}
              onChange={(e) => setBulkZone(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={bulkVip}
                onChange={(e) => setBulkVip(e.target.checked)}
                className="rounded border-zinc-300"
              />
              {t("events.tables.vip")}
            </label>
            <Button type="submit" disabled={busy} className="w-full sm:w-auto">
              {t("events.tables.bulkAdd")}
            </Button>
          </form>
        </div>
      ) : null}

      {tables.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("events.tables.empty")}</p>
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-[1.35rem] border border-zinc-100">
          {tables.map((row) => {
            const allergyText = allergiesByTable[row.number] ?? "";
            return (
              <li key={row.id} className="bg-white px-4 py-3">
                {editingId === row.id ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <Input
                      value={editNumber}
                      onChange={(e) => setEditNumber(e.target.value)}
                      className="sm:max-w-[7rem]"
                    />
                    <Input
                      value={editZone}
                      onChange={(e) => setEditZone(e.target.value)}
                      placeholder={t("events.tables.zonePh")}
                      className="sm:max-w-[12rem]"
                    />
                    <label className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={editVip}
                        onChange={(e) => setEditVip(e.target.checked)}
                        className="rounded border-zinc-300"
                      />
                      {t("events.tables.vip")}
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        className="px-3 py-1.5 text-xs"
                        disabled={busy}
                        onClick={() => void saveEdit(row.id)}
                      >
                        {t("events.tables.save")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => setEditingId(null)}
                      >
                        {t("events.tables.cancel")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900">
                        {t("events.tables.tableLabel")} {row.number}
                      </span>
                      {row.zone ? (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                          {row.zone}
                        </span>
                      ) : null}
                      {row.isVip ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                          VIP
                        </span>
                      ) : null}
                      {allergyText ? (
                        <AllergyWarningBadge content={allergyText} compact />
                      ) : null}
                    </div>
                    {!archived ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="px-3 py-1.5 text-xs"
                          onClick={() => openAllergies(row.number)}
                        >
                          {t("events.allergies.button")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="px-3 py-1.5 text-xs"
                          onClick={() => startEdit(row)}
                        >
                          {t("events.tables.edit")}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="px-3 py-1.5 text-xs text-red-700"
                          disabled={busy}
                          onClick={() => void remove(row.id)}
                        >
                          {t("events.tables.delete")}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )}

                {allergyOpenFor === row.number ? (
                  <div className="mt-3 space-y-2 rounded-[1.15rem] border border-amber-100 bg-amber-50/40 p-3">
                    <label className="block text-xs font-medium text-amber-950">
                      {t("events.allergies.fieldLabel")}
                    </label>
                    <Textarea
                      className="min-h-[88px] border-amber-200 bg-white"
                      value={allergyDraft}
                      onChange={(e) => setAllergyDraft(e.target.value)}
                      placeholder={t("events.allergies.fieldPh")}
                    />
                    <p className="text-[11px] text-amber-900/70">
                      {t("events.allergies.fieldHint")}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        className="px-3 py-1.5 text-xs"
                        disabled={busy}
                        onClick={() => void saveAllergies(row.number)}
                      >
                        {t("events.tables.save")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => setAllergyOpenFor(null)}
                      >
                        {t("events.tables.cancel")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
