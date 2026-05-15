import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { EVENT_STATUS } from "@/lib/constants";
import { toDatetimeLocalValue } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { EventDetailTabs } from "@/components/dashboard/event-detail-tabs";
import { EventMoreMenu } from "@/components/dashboard/event-more-menu";
import { EventRequestsLive } from "@/components/dashboard/event-requests-live";
import { outlineButtonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");
  const event = await prisma.event.findFirst({
    where: { id, ownerId: userId },
    include: { menuItems: { orderBy: { sortOrder: "asc" } } },
  });
  if (!event) notFound();
  const archived = event.status === EVENT_STATUS.ARCHIVED;
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const guestUrl = `${base}/e/${event.publicSlug}`;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={
              archived ? "/dashboard/historique" : "/dashboard/evenements"
            }
            className={outlineButtonClassName}
          >
            ← {archived ? "Historique" : "Événements"}
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">
            {event.name}
          </h1>
          {archived ? (
            <span className="mt-2 inline-block rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700">
              Archivé
            </span>
          ) : null}
        </div>
        <EventMoreMenu eventId={event.id} archived={archived} />
      </div>

      <EventDetailTabs
        eventId={event.id}
        archived={archived}
        name={event.name}
        venue={event.venue}
        startsAtLocal={toDatetimeLocalValue(event.startsAt)}
        instructions={event.instructions}
        menuItems={event.menuItems.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          outOfStock: m.outOfStock,
        }))}
        guestUrl={guestUrl}
        qrDownloadHref={`/api/evenements/${event.id}/qr`}
      />

      {!archived ? (
        <Card className="px-5 py-6 sm:px-6">
          <EventRequestsLive eventId={event.id} />
        </Card>
      ) : null}
    </div>
  );
}
