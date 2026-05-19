import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import {
  getSessionUser,
  getOwnerId,
  listAccessibleLiveEventIds,
} from "@/lib/event-access";
import { USER_ROLE } from "@/lib/constants";
import {
  assigneeDisplayName,
  extractCheckboxTasks,
  filterTasksForUser,
} from "@/lib/assigned-checkbox-tasks";
import { prisma } from "@/lib/prisma";
import { DashboardTaskCard } from "@/components/dashboard/dashboard-task-card";
import { Card } from "@/components/ui/card";
import { getT } from "@/i18n/server";

export default async function TachesPage() {
  const { t } = await getT();
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");
  const user = await getSessionUser(userId);
  if (!user) redirect("/connexion");

  const eventIds = await listAccessibleLiveEventIds(user);
  const events =
    eventIds.length > 0
      ? await prisma.event.findMany({
          where: { id: { in: eventIds } },
          select: {
            id: true,
            name: true,
            instructions: true,
            instructionsBlocks: true,
          },
        })
      : [];

  const staffById =
    user.role === USER_ROLE.STAFF
      ? new Map([[user.id, user]])
      : new Map(
          (
            await prisma.user.findMany({
              where: { employerId: getOwnerId(user), role: USER_ROLE.STAFF },
              select: { id: true, name: true, email: true },
            })
          ).map((s) => [s.id, s]),
        );

  const allTasks = events.flatMap((ev) =>
    extractCheckboxTasks(ev.id, ev.name, ev.instructionsBlocks, ev.instructions),
  );
  const tasks = filterTasksForUser(allTasks, user.id, user.role);

  const isStaff = user.role === USER_ROLE.STAFF;

  return (
    <div className="w-full space-y-8">
      <div>
        <p className="text-xs font-medium text-zinc-400">{t("checklists.pageTag")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          {isStaff ? t("checklists.pageTitleStaff") : t("checklists.pageTitle")}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {isStaff ? t("checklists.pageSubtitleStaff") : t("checklists.pageSubtitle")}
        </p>
      </div>

      {tasks.length === 0 ? (
        <Card className="px-6 py-12 text-center text-sm text-zinc-500">
          {isStaff ? t("checklists.pageEmptyStaff") : t("checklists.pageEmpty")}
        </Card>
      ) : (
        <Card className="overflow-hidden px-0 py-0">
          <ul className="divide-y divide-zinc-100">
            {tasks.map((task) => (
              <DashboardTaskCard
                key={`${task.eventId}-${task.blockId}`}
                eventId={task.eventId}
                blockId={task.blockId}
                eventName={task.eventName}
                label={task.label}
                assigneeName={assigneeDisplayName(task.assignedToId, staffById)}
                unassignedLabel={t("checklists.unassigned")}
                pendingLabel={t("dashboard.taskPending")}
              />
            ))}
          </ul>
        </Card>
      )}

      {!isStaff ? (
        <p className="text-center text-sm text-zinc-500">
          <Link
            href="/dashboard/checklists"
            className="font-medium text-violet-700 hover:underline"
          >
            {t("checklists.manageTemplates")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
