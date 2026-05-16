"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { archiveEventAction, deleteEventAction } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/i18n-provider";

function IconFolder({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function IconMore({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

export function EventMoreMenu({
  eventId,
  archived,
}: {
  eventId: string;
  archived: boolean;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function archive() {
    if (!confirm(t("events.archiveConfirm"))) {
      return;
    }
    setOpen(false);
    start(() => {
      void archiveEventAction(eventId);
    });
  }

  function remove() {
    if (!confirm(t("events.deleteConfirm"))) {
      return;
    }
    setOpen(false);
    start(() => {
      void deleteEventAction(eventId);
    });
  }

  return (
    <div ref={rootRef} className="relative shrink-0 self-start sm:self-auto">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={`event-more-${eventId}`}
        id={`event-more-trigger-${eventId}`}
        onClick={() => setOpen((v) => !v)}
        className="gap-2"
      >
        <IconMore className="text-zinc-700" />
        {t("events.more")}
      </Button>

      {open ? (
        <div
          id={`event-more-${eventId}`}
          role="menu"
          aria-labelledby={`event-more-trigger-${eventId}`}
          className="absolute right-0 z-50 mt-2 min-w-[13.5rem] rounded-[1.25rem] border border-zinc-200 bg-white py-1.5"
        >
          {!archived ? (
            <button
              type="button"
              role="menuitem"
              disabled={pending}
              onClick={archive}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-zinc-950 hover:bg-zinc-50"
            >
              <IconFolder className="shrink-0 text-zinc-950" />
              {t("events.archive")}
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            disabled={pending}
            onClick={remove}
            className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 ${
              !archived ? "border-t border-zinc-100" : ""
            }`}
          >
            <IconTrash className="shrink-0 text-red-600" />
            {t("events.delete")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
