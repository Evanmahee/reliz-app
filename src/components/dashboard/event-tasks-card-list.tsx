"use client";

import { useState } from "react";
import type { InstructionBlock } from "@/lib/instructions-blocks";
import { DashboardTaskCard } from "@/components/dashboard/dashboard-task-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/i18n/i18n-provider";

function staffName(
  id: string | null | undefined,
  staffById: Map<string, { name: string | null; email: string }>,
) {
  if (!id) return null;
  const s = staffById.get(id);
  return s ? s.name?.trim() || s.email : null;
}

export function EventTasksCardList({
  eventId,
  eventName,
  blocks,
  staffMembers,
}: {
  eventId: string;
  eventName: string;
  blocks: InstructionBlock[];
  staffMembers: { id: string; name: string | null; email: string }[];
}) {
  const { t } = useT();
  const [showDone, setShowDone] = useState(false);
  const staffById = new Map(staffMembers.map((s) => [s.id, s]));

  const checkboxBlocks = blocks.filter(
    (b): b is Extract<InstructionBlock, { type: "checkbox" }> => b.type === "checkbox",
  );
  const pending = checkboxBlocks.filter((b) => !b.checked);
  const done = checkboxBlocks.filter((b) => b.checked);
  const displayTasks = showDone ? done : pending;

  const historyLabel = showDone
    ? t("events.tasksBackPending")
    : done.length > 0
      ? t("events.tasksDoneHistoryWithCount").replace("{n}", String(done.length))
      : t("events.tasksDoneHistory");

  const countLabel = showDone
    ? done.length === 1
      ? `1 ${t("events.tasksDoneCountOne")}`
      : `${done.length} ${t("events.tasksDoneCountMany")}`
    : `${pending.length} ${t("events.tasksPendingCount")}`;

  if (checkboxBlocks.length === 0) {
    return (
      <section className="mt-8 space-y-3">
        <h3 className="text-lg font-semibold text-zinc-900">
          {t("events.tasksSaved")}
        </h3>
        <p className="text-sm text-zinc-500">{t("events.tasksEmpty")}</p>
      </section>
    );
  }

  return (
    <section className="mt-8 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <h3 className="text-lg font-semibold text-zinc-900">
            {t("events.tasksSaved")}
          </h3>
          {done.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="shrink-0 px-3 py-1.5 text-xs font-medium"
              onClick={() => setShowDone((v) => !v)}
            >
              {historyLabel}
            </Button>
          ) : null}
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
          {countLabel}
        </span>
      </div>

      {showDone ? (
        <p className="text-xs text-zinc-500">{t("events.tasksDoneHint")}</p>
      ) : null}

      {displayTasks.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {showDone ? t("events.tasksNoDone") : t("events.tasksNoPending")}
        </p>
      ) : (
        <Card className="overflow-hidden px-0 py-0">
          <ul className="divide-y divide-zinc-100">
            {displayTasks.map((task) => (
              <DashboardTaskCard
                key={task.id}
                eventId={eventId}
                blockId={task.id}
                eventName={eventName}
                label={task.label}
                assigneeName={staffName(task.assignedToId, staffById)}
                unassignedLabel={t("checklists.unassigned")}
                pendingLabel={t("dashboard.taskPending")}
                doneLabel={t("dashboard.doneBadge")}
                checked={task.checked}
                hideEventName
              />
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
