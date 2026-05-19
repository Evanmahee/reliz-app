"use client";

import { useMemo } from "react";
import {
  createStaffTaskAction,
  deleteStaffTaskAction,
  toggleStaffTaskDoneAction,
} from "@/app/actions/staff";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { wrapFormActionWithToast } from "@/components/ui/form-action-toast";
import { useT } from "@/i18n/i18n-provider";

type StaffMember = { id: string; name: string | null; email: string };
type Task = {
  id: string;
  title: string;
  note: string;
  status: string;
  assignedTo: StaffMember | null;
  createdBy: StaffMember;
};

export function EventStaffTasks({
  eventId,
  staffMembers,
  tasks,
  archived,
}: {
  eventId: string;
  staffMembers: StaffMember[];
  tasks: Task[];
  archived: boolean;
}) {
  const { t } = useT();
  const createWrapped = useMemo(
    () =>
      wrapFormActionWithToast(createStaffTaskAction, {
        success: t("staffTasks.toastCreated"),
      }),
    [t],
  );

  const pending = tasks.filter((x) => x.status === "PENDING");
  const done = tasks.filter((x) => x.status === "DONE");

  return (
    <Card className="px-5 py-6 sm:px-6">
      <h2 className="text-sm font-semibold text-zinc-900">{t("staffTasks.title")}</h2>
      <p className="mt-1 text-xs text-zinc-500">{t("staffTasks.hint")}</p>

      {!archived ? (
        <form action={createWrapped} className="mt-4 space-y-3">
          <input type="hidden" name="eventId" value={eventId} />
          <Input name="title" placeholder={t("staffTasks.taskPlaceholder")} required />
          <Textarea name="note" placeholder={t("staffTasks.notePlaceholder")} rows={2} />
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              {t("staffTasks.assignTo")}
            </label>
            <select
              name="assignedToId"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="">{t("staffTasks.assignAnyone")}</option>
              {staffMembers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.email}
                </option>
              ))}
            </select>
          </div>
          <SubmitButton pendingLabel={t("staffTasks.adding")}>
            {t("staffTasks.add")}
          </SubmitButton>
        </form>
      ) : null}

      <ul className="mt-6 space-y-2">
        {pending.length === 0 && done.length === 0 ? (
          <li className="text-center text-sm text-zinc-500 py-6">
            {t("staffTasks.empty")}
          </li>
        ) : null}
        {[...pending, ...done].map((task) => (
          <li
            key={task.id}
            className={`flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
              task.status === "DONE"
                ? "border-zinc-100 bg-zinc-50/80 opacity-70"
                : "border-zinc-200 bg-white"
            }`}
          >
            <div className="min-w-0">
              <p
                className={`font-medium text-zinc-900 ${task.status === "DONE" ? "line-through" : ""}`}
              >
                {task.title}
              </p>
              {task.note ? (
                <p className="mt-0.5 text-sm text-zinc-500">{task.note}</p>
              ) : null}
              <p className="mt-1 text-xs text-zinc-400">
                {task.assignedTo
                  ? t("staffTasks.assigned").replace(
                      "{name}",
                      task.assignedTo.name || task.assignedTo.email,
                    )
                  : t("staffTasks.unassigned")}
                <span className="text-zinc-300"> · </span>
                {task.createdBy.name || task.createdBy.email}
              </p>
            </div>
            {!archived ? (
              <div className="flex shrink-0 gap-2">
                <form
                  action={wrapFormActionWithToast(toggleStaffTaskDoneAction, {
                    success: t("staffTasks.toastUpdated"),
                  })}
                >
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="eventId" value={eventId} />
                  <input
                    type="hidden"
                    name="done"
                    value={String(task.status !== "DONE")}
                  />
                  <SubmitButton variant="outline" className="text-xs" pendingLabel="…">
                    {task.status === "DONE"
                      ? t("staffTasks.reopen")
                      : t("staffTasks.done")}
                  </SubmitButton>
                </form>
                <form
                  action={wrapFormActionWithToast(deleteStaffTaskAction, {
                    success: t("staffTasks.toastDeleted"),
                  })}
                >
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="eventId" value={eventId} />
                  <SubmitButton
                    variant="ghost"
                    className="text-xs text-red-700"
                    pendingLabel="…"
                  >
                    {t("staffTasks.remove")}
                  </SubmitButton>
                </form>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
