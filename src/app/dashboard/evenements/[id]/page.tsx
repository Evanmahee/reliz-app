import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { EVENT_STATUS, USER_ROLE } from "@/lib/constants";
import { getSessionUser, getOwnerId, isOwner, canManageEventOps } from "@/lib/event-access";
import { toDatetimeLocalValue } from "@/lib/datetime";
import { parseInstructionsBlocks } from "@/lib/instructions-blocks";
import { parseShoppingItems } from "@/lib/shopping-items";
import { prisma } from "@/lib/prisma";
import { EventDetailTabs } from "@/components/dashboard/event-detail-tabs";
import { EventMoreMenu } from "@/components/dashboard/event-more-menu";
import { EventRequestsLive } from "@/components/dashboard/event-requests-live";
import { outlineButtonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getT } from "@/i18n/server";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = await getT();
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");
  const sessionUser = await getSessionUser(userId);
  if (!sessionUser) redirect("/connexion");
  const ownerId = getOwnerId(sessionUser);
  const ownerView = isOwner(sessionUser);
  const maitreView = sessionUser.role === USER_ROLE.MAITRE_HOTEL;

  const event = await prisma.event.findFirst({
    where: ownerView
      ? { id, ownerId: sessionUser.id }
      : maitreView
        ? { id, ownerId }
        : {
            id,
            ownerId,
            staffAccess: { some: { userId: sessionUser.id } },
          },
    include: {
      menuItems: { orderBy: { sortOrder: "asc" } },
      accessories: { orderBy: { sortOrder: "asc" } },
      ...(ownerView
        ? {
            shoppingLists: {
              where: { ownerId: sessionUser.id },
              orderBy: { updatedAt: "desc" as const },
              take: 1,
            },
          }
        : {}),
    },
  });
  if (!event) notFound();

  const menuItems = event.menuItems;
  const accessories = event.accessories;
  const shoppingListRow = ownerView ? event.shoppingLists[0] ?? null : null;

  const staffMembers = ownerView
    ? await prisma.user.findMany({
        where: { employerId: ownerId, role: USER_ROLE.STAFF },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      })
    : [];

  const shoppingList = shoppingListRow
    ? {
        id: shoppingListRow.id,
        name: shoppingListRow.name,
        items: parseShoppingItems(shoppingListRow.items),
        sentTo: shoppingListRow.sentTo,
        sentAt: shoppingListRow.sentAt?.toISOString() ?? null,
      }
    : null;
  const archived = event.status === EVENT_STATUS.ARCHIVED;
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const guestUrl = `${base}/e/${event.publicSlug}`;

  const instructionBlocks = parseInstructionsBlocks(
    event.instructionsBlocks,
    event.instructions,
  );

  const backLabel = archived ? t("events.backToHistory") : t("events.backToEvents");

  return (
    <div className="w-full space-y-8 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={archived ? "/dashboard/historique" : "/dashboard/evenements"}
            className={outlineButtonClassName}
          >
            {backLabel}
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">
            {event.name}
          </h1>
          {archived ? (
            <span className="mt-2 inline-block rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700">
              {t("events.archivedBadge")}
            </span>
          ) : null}
        </div>
        {isOwner(sessionUser) ? (
          <EventMoreMenu eventId={event.id} archived={archived} />
        ) : null}
      </div>

      <EventDetailTabs
        eventId={event.id}
        archived={archived}
        isOwner={isOwner(sessionUser)}
        canManageOps={canManageEventOps(sessionUser)}
        name={event.name}
        venue={event.venue}
        menuHidden={event.menuHidden}
        startsAtLocal={toDatetimeLocalValue(event.startsAt)}
        instructionBlocks={instructionBlocks}
        menuItems={menuItems.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          outOfStock: m.outOfStock,
          hidden: m.hidden,
        }))}
        accessories={accessories.map((a) => ({
          id: a.id,
          name: a.name,
          quantity: a.quantity,
          notes: a.notes,
        }))}
        shoppingList={shoppingList}
        staffMembers={staffMembers}
        guestUrl={guestUrl}
        publicSlug={event.publicSlug}
        qrDownloadHref={`/api/evenements/${event.id}/qr`}
      />

      {!archived ? (
        <>
          <Card className="px-5 py-6 sm:px-6">
            <EventRequestsLive
              eventId={event.id}
              currentUserId={sessionUser.id}
              currentUserRole={sessionUser.role}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
}
