import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { EVENT_STATUS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { EventLiveCard } from "@/components/dashboard/event-live-card";
import { Card } from "@/components/ui/card";
import { getT } from "@/i18n/server";

export default async function EvenementsPage() {
  const { t } = await getT();
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");
  const events = await prisma.event.findMany({
    where: { ownerId: userId, status: EVENT_STATUS.LIVE },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-400">{t("events.listTag")}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            {t("events.listTitle")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">{t("events.listSubtitle")}</p>
        </div>
        <Link
          href="/dashboard/evenements/nouveau"
          className="inline-flex items-center justify-center gap-2 rounded-[1.35rem] bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          {t("events.newButton")}
        </Link>
      </div>

      {events.length === 0 ? (
        <Card className="px-6 py-12 text-center text-sm text-zinc-500">{t("events.empty")}</Card>
      ) : (
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
      )}
    </div>
  );
}
