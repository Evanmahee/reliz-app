import { redirect } from "next/navigation";
import { createStaffMemberAction, deleteStaffMemberAction } from "@/app/actions/staff";
import { getSessionUserId } from "@/lib/auth";
import { getSessionUser, isOwner } from "@/lib/event-access";
import { USER_ROLE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { StaffTeamManager } from "@/components/dashboard/staff-team-manager";
import { getT } from "@/i18n/server";

export default async function EquipePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { t } = await getT();
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");
  const user = await getSessionUser(userId);
  if (!user || !isOwner(user)) redirect("/dashboard");

  const [staff, events] = await Promise.all([
    prisma.user.findMany({
      where: { employerId: user.id, role: USER_ROLE.STAFF },
      orderBy: { createdAt: "desc" },
      include: { staffEventAccess: { select: { eventId: true } } },
    }),
    prisma.event.findMany({
      where: { ownerId: user.id, status: "LIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const sp = await searchParams;

  return (
    <div className="w-full space-y-6">
      {sp.ok ? (
        <p className="text-sm font-medium text-emerald-700">{t("equipe.created")}</p>
      ) : null}
      {sp.erreur === "email" ? (
        <p className="text-sm text-red-600">{t("equipe.errEmail")}</p>
      ) : null}
      {sp.erreur === "champs" ? (
        <p className="text-sm text-red-600">{t("equipe.errFields")}</p>
      ) : null}

      <StaffTeamManager
        staff={staff.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          eventIds: s.staffEventAccess.map((a) => a.eventId),
        }))}
        events={events}
        createAction={createStaffMemberAction}
        deleteAction={deleteStaffMemberAction}
      />
    </div>
  );
}
