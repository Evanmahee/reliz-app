import { redirect } from "next/navigation";
import { createStaffMemberAction, deleteStaffMemberAction } from "@/app/actions/staff";
import { getSessionUserId } from "@/lib/auth";
import { getSessionUser, isOwner, pendingUserIds, suspendedUserIds } from "@/lib/event-access";
import { mailerConfigured } from "@/lib/mailer";
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
      where: {
        employerId: user.id,
        role: { in: [USER_ROLE.STAFF, USER_ROLE.MAITRE_HOTEL] },
      },
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      include: { staffEventAccess: { select: { eventId: true } } },
    }),
    prisma.event.findMany({
      where: { ownerId: user.id, status: "LIVE" },
      orderBy: [{ startsAt: "asc" }, { name: "asc" }],
      select: { id: true, name: true, venue: true, startsAt: true },
    }),
  ]);

  const sp = await searchParams;
  const ids = staff.map((s) => s.id);
  const [suspended, pending] = await Promise.all([suspendedUserIds(ids), pendingUserIds(ids)]);

  return (
    <div className="w-full space-y-6">
      {sp.ok ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {sp.ok === "invite" ? t("equipe.okInvite") : t("equipe.created")}
        </p>
      ) : null}
      {sp.erreur === "invitation" ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{t("equipe.errInvitation")}</p>
      ) : null}
      {sp.erreur === "email" ? (
        <p className="text-sm text-red-600">{t("equipe.errEmail")}</p>
      ) : null}
      {sp.erreur === "motdepasse" ? (
        <p className="text-sm text-red-600">{t("equipe.errPw")}</p>
      ) : null}
      {sp.erreur === "champs" ? (
        <p className="text-sm text-red-600">{t("equipe.errFields")}</p>
      ) : null}

      <StaffTeamManager
        staff={staff.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          eventIds: s.staffEventAccess.map((a) => a.eventId),
          suspended: suspended.has(s.id),
          pending: pending.has(s.id),
        }))}
        events={events.map((e) => ({
          id: e.id,
          name: e.name,
          venue: e.venue,
          startsAt: e.startsAt?.toISOString() ?? null,
        }))}
        createAction={createStaffMemberAction}
        deleteAction={deleteStaffMemberAction}
        inviteByEmail={mailerConfigured()}
      />
    </div>
  );
}
