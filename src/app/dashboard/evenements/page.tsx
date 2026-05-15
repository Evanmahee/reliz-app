import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { EVENT_STATUS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export default async function EvenementsPage() {
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
          <p className="text-xs font-medium text-zinc-400">Événements</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Vos événements actifs
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            Créez un événement pour générer un QR code invité, gérer la carte et
            suivre les demandes en direct.
          </p>
        </div>
        <Link
          href="/dashboard/evenements/nouveau"
          className="inline-flex items-center justify-center gap-2 rounded-[1.35rem] bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Nouvel événement
        </Link>
      </div>

      {events.length === 0 ? (
        <Card className="px-6 py-12 text-center text-sm text-zinc-500">
          Aucun événement pour le moment. Créez votre premier événement pour
          obtenir un QR code.
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
                    {e.startsAt
                      ? new Date(e.startsAt).toLocaleString("fr-FR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Date à confirmer"}
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
