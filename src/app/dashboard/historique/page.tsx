import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { EVENT_STATUS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export default async function HistoriquePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");
  const events = await prisma.event.findMany({
    where: { ownerId: userId, status: EVENT_STATUS.ARCHIVED },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-xs font-medium text-zinc-400">Historique</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          Événements archivés
        </h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-500">
          Consultation en lecture seule. Les QR invités ne sont plus actifs.
        </p>
      </div>

      {events.length === 0 ? (
        <Card className="px-6 py-12 text-center text-sm text-zinc-500">
          Aucun événement archivé pour le moment.
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {events.map((e) => (
            <li key={e.id}>
              <Link href={`/dashboard/evenements/${e.id}`}>
                <Card className="h-full px-5 py-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50/50">
                  <p className="text-sm font-semibold text-zinc-900">{e.name}</p>
                  {e.venue ? (
                    <p className="mt-1 text-xs text-zinc-500">{e.venue}</p>
                  ) : null}
                  <p className="mt-3 text-xs text-zinc-400">
                    Archivé le{" "}
                    {new Date(e.updatedAt).toLocaleDateString("fr-FR", {
                      dateStyle: "medium",
                    })}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
