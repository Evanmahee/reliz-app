import type { Event, Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
} from "@prisma/client/runtime/library";
import { getSessionUserId } from "@/lib/auth";
import { EVENT_STATUS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { primaryButtonClassName } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type RecentGuestRequest = Prisma.GuestRequestGetPayload<{
  include: { event: { select: { id: true; name: true } } };
}>;

function typeLabel(t: string) {
  if (t === "PRODUCT") return "Commande";
  if (t === "SERVICE") return "Service";
  if (t === "STAFF") return "Personnel";
  return t;
}

export default async function DashboardHomePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");

  let events: Event[];
  try {
    events = await prisma.event.findMany({
      where: { ownerId: userId, status: EVENT_STATUS.LIVE },
      orderBy: [{ startsAt: "asc" }, { updatedAt: "desc" }],
    });
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
            where: {
              event: {
                ownerId: userId,
                status: EVENT_STATUS.LIVE,
              },
            },
            include: {
              event: { select: { id: true, name: true } },
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
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const pendingNotif = recentRequests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-400">Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Événements en cours
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            Ouvrez une fiche pour la carte, les consignes, le QR et les demandes
            des tables.
          </p>
        </div>
        <Link
          href="/dashboard/evenements/nouveau"
          className={`${primaryButtonClassName} shrink-0`}
        >
          Nouvel événement
        </Link>
      </div>

      {count > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-900">
              Notifications
            </h2>
            {pendingNotif > 0 ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                {pendingNotif} à traiter
              </span>
            ) : (
              <span className="text-xs text-zinc-400">Rien en attente</span>
            )}
          </div>
          <Card className="overflow-hidden px-0 py-0">
            {recentRequests.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-500">
                Aucune demande invité pour vos événements actifs.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {recentRequests.slice(0, 25).map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/dashboard/evenements/${r.event.id}`}
                      className="flex flex-col gap-1 px-4 py-3.5 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-zinc-400">
                          {new Date(r.createdAt).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                          <span className="text-zinc-300"> · </span>
                          <span className="font-medium text-zinc-600">
                            {r.event.name}
                          </span>
                          <span className="text-zinc-300"> · </span>
                          Table {r.tableNumber}
                        </p>
                        <p className="mt-1 text-sm font-medium text-zinc-900">
                          {typeLabel(r.type)}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600">
                          {r.message}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                        {r.status === "PENDING" ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-900">
                            Nouveau
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
                            Traité
                          </span>
                        )}
                        <span className="hidden text-[11px] font-medium text-violet-600 sm:inline">
                          Ouvrir →
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      ) : null}

      {count === 0 ? (
        <Card className="px-6 py-14 text-center">
          <p className="text-sm font-medium text-zinc-900">
            Aucun événement en cours
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Créez un événement pour générer un QR code et recevoir les demandes
            des tables.
          </p>
          <Link
            href="/dashboard/evenements/nouveau"
            className={`${primaryButtonClassName} mx-auto mt-6 inline-flex`}
          >
            Créer un événement
          </Link>
        </Card>
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">Vos événements</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {events.map((e) => (
              <li key={e.id}>
                <Link href={`/dashboard/evenements/${e.id}`}>
                  <Card className="h-full px-5 py-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-900">
                        {e.name}
                      </p>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
                        En cours
                      </span>
                    </div>
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
        </section>
      )}
    </div>
  );
}
