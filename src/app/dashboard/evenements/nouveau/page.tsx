import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateEventForm } from "@/components/dashboard/create-event-form";
import { outlineButtonClassName } from "@/components/ui/button";
import { getSessionUserId } from "@/lib/auth";
import { getSessionUser, isOwner } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";
import { getT } from "@/i18n/server";

export default async function NouvelEvenementPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { t } = await getT();
  const sp = await searchParams;
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");
  const user = await getSessionUser(userId);
  if (!user || !isOwner(user)) redirect("/dashboard/evenements");

  const checklists = await prisma.checklist.findMany({
    where: { ownerId: userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="w-full space-y-8">
      <div>
        <Link href="/dashboard/evenements" className={outlineButtonClassName}>
          {t("events.newBack")}
        </Link>
        <p className="mt-5 text-xs font-medium text-zinc-400">{t("events.newTag")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          {t("events.newTitle")}
        </h1>
      </div>

      <CreateEventForm
        checklists={checklists}
        showNameError={sp.erreur === "nom"}
      />
    </div>
  );
}
