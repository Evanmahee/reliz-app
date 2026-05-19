import type { Event, Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
} from "@prisma/client/runtime/library";
import { getSessionUserId } from "@/lib/auth";
import { GUEST_REQUEST, USER_ROLE } from "@/lib/constants";
import { getOwnerId, getSessionUser, listAccessibleLiveEventIds } from "@/lib/event-access";
import {
  assigneeDisplayName,
  extractCheckboxTasks,
  filterTasksForUser,
} from "@/lib/assigned-checkbox-tasks";
import { prisma } from "@/lib/prisma";
import { getRequestUrgency } from "@/lib/request-urgency";
import { EventLiveCard } from "@/components/dashboard/event-live-card";
import { DashboardRequestCard } from "@/components/dashboard/dashboard-request-card";
import { DashboardTaskCard } from "@/components/dashboard/dashboard-task-card";
import { DashboardServiceOverview } from "@/components/dashboard/dashboard-service-overview";
import { Card } from "@/components/ui/card";
import { primaryButtonClassName } from "@/components/ui/button";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

type RecentGuestRequest = Prisma.GuestRequestGetPayload<{
  include: { event: { select: { id: true; name: true; venue: true } } };
}>;

export default async function DashboardHomePage() {
  const { t } = await getT();

  function typeLabel(typ: string) {
    if (typ === GUEST_REQUEST.PRODUCT) return t("dashboard.order");
    if (typ === GUEST_REQUEST.SERVICE) return t("dashboard.service");
    if (typ === GUEST_REQUEST.STAFF) return t("dashboard.staff");
    return typ;
  }

  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");

  const sessionUser = await getSessionUser(userId);
  if (!sessionUser) redirect("/connexion");
  const isStaff = sessionUser.role === USER_ROLE.STAFF;

  let events: Event[];
  let eventIds: string[] = [];
  try {
    eventIds = await listAccessibleLiveEventIds(sessionUser);
    events = eventIds.length
      ? await prisma.event.findMany({
          where: { id: { in: eventIds } },
          orderBy: [{ startsAt: "asc" }, { updatedAt: "desc" }],
        })
      : [];
  } catch (e) {
    console.error("[dashboard]", e);
    if (
      e instanceof PrismaClientInitializationError ||
      e instanceof PrismaClientKnownRequestError ||
      e instanceof PrismaClientUnknownRequestError
    ) {
      redirect("/connexion?erreur=db");
    }
    redirect("/connexion?erreur=serveur");
  }

  const count = events.length;

  let recentRequests: RecentGuestRequest[];
  try {
    recentRequests =
      count > 0
        ? await prisma.guestRequest.findMany({
            where: { eventId: { in: eventIds } },
            include: {
              event: { select: { id: true, name: true, venue: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 60,
          })
        : [];
  } catch (e) {
    console.error("[dashboard guestRequest]", e);
    if (
      e instanceof PrismaClientInitializationError ||
      e instanceof PrismaClientKnownRequestError ||
      e instanceof PrismaClientUnknownRequestError
    ) {
      redirect("/connexion?erreur=db");
    }
    redirect("/connexion?erreur=serveur");
  }

  recentRequests.sort((a, b) => {
    const pa = a.status === "PENDING" ? 0 : 1;
    const pb = b.status === "PENDING" ? 0 : 1;
    if (pa !== pb) return pa - pb;
    const ua = getRequestUrgency(a.createdAt);
    const ub = getRequestUrgency(b.createdAt);
    const urgencyOrder = { urgent: 0, waiting: 1, fresh: 2 };
    if (ua !== ub) return urgencyOrder[ua] - urgencyOrder[ub];
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const pending = recentRequests.filter((r) => r.status === "PENDING");
  const pendingNotif = pending.length;
  const urgentCount = pending.filter(
    (r) => getRequestUrgency(r.createdAt) === "urgent",
  ).length;

  const staffMembers =
    count > 0
      ? await prisma.user.findMany({
          where: {
            employerId: getOwnerId(sessionUser),
            role: USER_ROLE.STAFF,
          },
          select: { id: true, name: true, email: true },
        })
      : [];
  const staffById = new Map(staffMembers.map((s) => [s.id, s]));

  const pendingTasks = filterTasksForUser(
    events.flatMap((ev) =>
      extractCheckboxTasks(ev.id, ev.name, ev.instructionsBlocks, ev.instructions),
    ),
    userId,
    sessionUser.role,
  );

  const urgencyLabels = {
    fresh: t("dashboard.urgencyFresh"),
    waiting: t("dashboard.urgencyWaiting"),
    urgent: t("dashboard.urgencyUrgent"),
  };

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-400">{t("dashboard.tag")}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            {isStaff ? t("dashboard.titleStaff") : t("dashboard.title")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            {isStaff ? t("dashboard.subtitleStaff") : t("dashboard.subtitle")}
          </p>
        </div>
        {!isStaff ? (
          <Link
            href="/dashboard/evenements/nouveau"
            className={`${primaryButtonClassName} shrink-0`}
          >
            {t("dashboard.newEvent")}
          </Link>
        ) : (
          <Link
            href="/dashboard/taches"
            className={`${primaryButtonClassName} shrink-0`}
          >
            {t("dashboard.myTasks")}
          </Link>
        )}
      </div>

      {count > 0 && pendingNotif > 0 ? (
        <DashboardServiceOverview
          pendingTotal={pendingNotif}
          productCount={pending.filter((r) => r.type === GUEST_REQUEST.PRODUCT).length}
          serviceCount={pending.filter((r) => r.type === GUEST_REQUEST.SERVICE).length}
          staffCount={pending.filter((r) => r.type === GUEST_REQUEST.STAFF).length}
          urgentCount={urgentCount}
          labels={{
            pending: t("dashboard.summaryPending"),
            orders: t("dashboard.order"),
            service: t("dashboard.service"),
            staff: t("dashboard.staff"),
            urgent: t("dashboard.urgencyUrgent"),
          }}
        />
      ) : null}

      {count > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("dashboard.notifications")}
            </h2>
            {pendingNotif > 0 ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                {pendingNotif} {t("dashboard.toProcess")}
              </span>
            ) : (
              <span className="text-xs text-zinc-400">{t("dashboard.nothingPending")}</span>
            )}
          </div>
          <Card className="overflow-hidden px-0 py-0">
            {recentRequests.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-500">
                {t("dashboard.noRequests")}
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {recentRequests.slice(0, 25).map((r) => (
                  <DashboardRequestCard
                    key={r.id}
                    href={`/dashboard/evenements/${r.event.id}`}
                    createdAt={r.createdAt}
                    eventName={r.event.name}
                    venue={r.event.venue}
                    tableNumber={r.tableNumber}
                    tableLocation={r.tableLocation}
                    type={r.type}
                    typeLabel={typeLabel(r.type)}
                    message={r.message}
                    status={r.status}
                    urgencyLabels={urgencyLabels}
                    pendingLabel={t("dashboard.newBadge")}
                    doneLabel={t("dashboard.doneBadge")}
                    tablePrefix={t("dashboard.table")}
                    venuePrefix={t("dashboard.atVenue")}
                    minLabel={t("dashboard.minutes")}
                  />
                ))}
              </ul>
            )}
          </Card>
        </section>
      ) : null}

      {count > 0 && pendingTasks.length > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("dashboard.tasksSection")}
            </h2>
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-900">
              {pendingTasks.length} {t("dashboard.tasksToDo")}
            </span>
          </div>
          <Card className="overflow-hidden px-0 py-0">
            <ul className="divide-y divide-zinc-100">
              {pendingTasks.slice(0, 25).map((task) => (
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
        </section>
      ) : null}

      {count === 0 ? (
        <Card className="px-6 py-14 text-center">
          <p className="text-sm font-medium text-zinc-900">{t("dashboard.noEvents")}</p>
          <p className="mt-2 text-sm text-zinc-500">
            {isStaff ? t("dashboard.noEventsStaff") : t("dashboard.noEventsHint")}
          </p>
          {!isStaff ? (
            <Link
              href="/dashboard/evenements/nouveau"
              className={`${primaryButtonClassName} mx-auto mt-6 inline-flex`}
            >
              {t("dashboard.createEvent")}
            </Link>
          ) : null}
        </Card>
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">{t("dashboard.yourEvents")}</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {events.map((e) => (
              <li key={e.id}>
                <EventLiveCard
                  id={e.id}
                  name={e.name}
                  venue={e.venue}
                  startsAtIso={e.startsAt?.toISOString() ?? null}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
