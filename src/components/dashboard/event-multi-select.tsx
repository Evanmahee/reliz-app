"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MdCheck, MdOutlineExpandMore, MdOutlineSearch } from "react-icons/md";
import { useT } from "@/i18n/i18n-provider";
import { dateLocaleTag } from "@/i18n/date-locale";

export type EventOption = {
  id: string;
  name: string;
  venue: string;
  /** ISO, ou null si pas encore daté */
  startsAt: string | null;
};

/**
 * Menu déroulant à choix multiple pour les événements : nom, date et lieu,
 * recherche dès qu'il y en a beaucoup. Envoie des champs cachés `name`.
 */
export function EventMultiSelect({
  events,
  name = "eventIds",
  defaultSelected = [],
}: {
  events: EventOption[];
  name?: string;
  defaultSelected?: string[];
}) {
  const { t, locale } = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultSelected));
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const fmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(dateLocaleTag(locale), {
          weekday: "short",
          day: "numeric",
          month: "long",
        })
      : t("equipe.eventNoDate");

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const q = query.trim().toLowerCase();
  const visible = q
    ? events.filter((e) => `${e.name} ${e.venue}`.toLowerCase().includes(q))
    : events;
  const chosen = events.filter((e) => selected.has(e.id));
  const summary =
    chosen.length === 0
      ? t("equipe.eventPick")
      : chosen.length === 1
        ? chosen[0].name
        : t("equipe.eventPicked").replace("{n}", String(chosen.length));

  return (
    <div ref={rootRef} className="relative">
      {[...selected].map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 text-left text-sm transition ${
          open ? "border-brand-500 ring-1 ring-brand-500" : "border-zinc-200 hover:border-zinc-300"
        }`}
      >
        <span className={chosen.length ? "font-medium text-zinc-900" : "text-zinc-400"}>{summary}</span>
        <MdOutlineExpandMore
          className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute inset-x-0 z-20 mt-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
          {events.length > 6 ? (
            <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
              <MdOutlineSearch className="h-4 w-4 text-zinc-400" aria-hidden />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("equipe.eventSearch")}
                className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-zinc-400"
              />
            </div>
          ) : null}
          <ul id={listId} role="listbox" aria-multiselectable="true" className="max-h-64 overflow-y-auto p-1.5">
            {visible.map((ev) => {
              const on = selected.has(ev.id);
              return (
                <li key={ev.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => toggle(ev.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      on ? "bg-brand-50" : "hover:bg-zinc-50"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        on ? "border-brand-600 bg-brand-600 text-white" : "border-zinc-300 bg-white"
                      }`}
                    >
                      {on ? <MdCheck className="h-4 w-4" aria-hidden /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-900">{ev.name}</span>
                      <span className="block truncate text-xs text-zinc-500">
                        {fmt(ev.startsAt)}
                        {ev.venue ? ` · ${ev.venue}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {visible.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-zinc-500">{t("equipe.eventNone")}</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {chosen.length > 1 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chosen.map((ev) => (
            <span key={ev.id} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800">
              {ev.name}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
