"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MdCheck, MdOutlineAdminPanelSettings, MdOutlineGroupAdd } from "react-icons/md";
import { setEventStaffAccessAction } from "@/app/actions/staff";
import { useT } from "@/i18n/i18n-provider";

export type EventTeamMember = {
  id: string;
  name: string | null;
  email: string;
  assigned: boolean;
  suspended: boolean;
};

function initials(name: string | null, email: string) {
  const src = (name || email).trim();
  const parts = src.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Onglet « Équipe » de la fiche : qui travaille sur cet événement. Un clic suffit. */
export function EventTeamPanel({
  eventId,
  members,
  adminCount,
  archived,
}: {
  eventId: string;
  members: EventTeamMember[];
  adminCount: number;
  archived: boolean;
}) {
  const { t } = useT();
  const [assigned, setAssigned] = useState<Set<string>>(
    () => new Set(members.filter((m) => m.assigned).map((m) => m.id)),
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();

  function toggle(id: string) {
    const next = !assigned.has(id);
    setAssigned((prev) => {
      const s = new Set(prev);
      if (next) s.add(id);
      else s.delete(id);
      return s;
    });
    setPendingId(id);
    start(async () => {
      try {
        await setEventStaffAccessAction(eventId, id, next);
        toast.success(next ? t("events.team.added") : t("events.team.removed"));
      } catch {
        setAssigned((prev) => {
          const s = new Set(prev);
          if (next) s.delete(id);
          else s.add(id);
          return s;
        });
        toast.error(t("events.team.error"));
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">{t("events.team.title")}</h2>
          <p className="mt-1 text-xs text-zinc-500">{t("events.team.hint")}</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
          {t("events.team.count").replace("{n}", String(assigned.size))}
        </span>
      </div>

      {members.length === 0 ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-zinc-50 p-4">
          <MdOutlineGroupAdd className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" aria-hidden />
          <div>
            <p className="text-sm font-medium text-zinc-800">{t("events.team.emptyTitle")}</p>
            <Link href="/dashboard/equipe" className="mt-1 inline-block text-sm font-medium text-brand-700 hover:underline">
              {t("events.team.emptyLink")}
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {members.map((m) => {
            const on = assigned.has(m.id);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={archived || pendingId === m.id}
                  onClick={() => toggle(m.id)}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition disabled:opacity-60 ${
                    on ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      on ? "bg-brand-500 text-white" : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {initials(m.name, m.email)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-900">{m.name || m.email}</span>
                    {m.suspended ? (
                      <span className="mt-0.5 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                        {t("equipe.suspended")}
                      </span>
                    ) : (
                      <span className="block truncate text-xs text-zinc-500">{m.email}</span>
                    )}
                  </span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      on ? "border-brand-600 bg-brand-600 text-white" : "border-zinc-300"
                    }`}
                  >
                    {on ? <MdCheck className="h-4 w-4" aria-hidden /> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {members.length > 0 ? (
        <p className="mt-4 text-xs text-zinc-500">
          {t("events.team.revokeHint")}{" "}
          <Link href="/dashboard/equipe" className="font-medium text-brand-700 hover:underline">
            {t("events.team.revokeLink")}
          </Link>
        </p>
      ) : null}

      {adminCount > 0 ? (
        <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
          <MdOutlineAdminPanelSettings className="h-4 w-4" aria-hidden />
          {t("events.team.admins").replace("{n}", String(adminCount))}
        </p>
      ) : null}
    </div>
  );
}
