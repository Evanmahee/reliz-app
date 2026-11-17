"use server";

import { field } from "@/lib/form-field";
import { checkPassword } from "@/lib/password-policy";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { USER_ROLE, STAFF_TASK_STATUS } from "@/lib/constants";
import {
  assertEventAccess,
  canManageEventOps,
  getOwnerId,
  isOwner,
  requireSessionUser,
} from "@/lib/event-access";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const TEAM_ROLES = [USER_ROLE.STAFF, USER_ROLE.MAITRE_HOTEL] as const;

function parseTeamRole(raw: string): (typeof TEAM_ROLES)[number] {
  return raw === USER_ROLE.MAITRE_HOTEL
    ? USER_ROLE.MAITRE_HOTEL
    : USER_ROLE.STAFF;
}

export async function createStaffMemberAction(formData: FormData) {
  const user = await requireSessionUser();
  if (!isOwner(user)) throw new Error("Réservé au traiteur");
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = parseTeamRole(String(formData.get("role") ?? ""));
  const eventIds = formData
    .getAll("eventIds")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (!name || !email) {
    redirect("/dashboard/equipe?erreur=champs");
  }
  if (checkPassword(password, email)) {
    redirect("/dashboard/equipe?erreur=motdepasse");
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect("/dashboard/equipe?erreur=email");

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (e) {
    console.error("[createStaffMemberAction]", e);
    redirect("/dashboard/equipe?erreur=champs");
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error || !created.user) {
    console.error("[createStaffMemberAction] Auth:", error?.message);
    if (/already|registered|exists/i.test(error?.message ?? "")) {
      redirect("/dashboard/equipe?erreur=email");
    }
    redirect("/dashboard/equipe?erreur=champs");
  }

  const staff = await prisma.user.create({
    data: {
      id: created.user.id,
      name,
      email,
      role,
      employerId: user.id,
    },
  });

  // Accès événement uniquement pour STAFF (MH voit tous les events).
  if (role === USER_ROLE.STAFF && eventIds.length > 0) {
    const owned = await prisma.event.findMany({
      where: { ownerId: user.id, id: { in: eventIds } },
      select: { id: true },
    });
    if (owned.length > 0) {
      await prisma.staffEventAccess.createMany({
        data: owned.map((e) => ({ userId: staff.id, eventId: e.id })),
        skipDuplicates: true,
      });
    }
  }
  revalidatePath("/dashboard/equipe");
  redirect("/dashboard/equipe?ok=1");
}

export async function deleteStaffMemberAction(formData: FormData) {
  const user = await requireSessionUser();
  if (!isOwner(user)) return;
  const staffId = field(formData, "staffId");
  if (!staffId) return;

  await prisma.user.deleteMany({
    where: {
      id: staffId,
      employerId: user.id,
      role: { in: [...TEAM_ROLES] },
    },
  });

  try {
    const admin = createSupabaseAdminClient();
    await admin.auth.admin.deleteUser(staffId);
  } catch (e) {
    console.error("[deleteStaffMemberAction] Auth delete:", e);
  }

  revalidatePath("/dashboard/equipe");
}

export async function updateStaffRoleAction(formData: FormData) {
  const user = await requireSessionUser();
  if (!isOwner(user)) return;
  const staffId = field(formData, "staffId");
  const role = parseTeamRole(String(formData.get("role") ?? ""));
  if (!staffId) return;

  const member = await prisma.user.findFirst({
    where: {
      id: staffId,
      employerId: user.id,
      role: { in: [...TEAM_ROLES] },
    },
  });
  if (!member) return;

  await prisma.user.update({
    where: { id: staffId },
    data: { role },
  });

  if (role === USER_ROLE.MAITRE_HOTEL) {
    await prisma.staffEventAccess.deleteMany({ where: { userId: staffId } });
  }

  revalidatePath("/dashboard/equipe");
}

export async function updateStaffEventsAction(formData: FormData) {
  const user = await requireSessionUser();
  if (!isOwner(user)) return;
  const staffId = field(formData, "staffId");
  const eventIds = formData
    .getAll("eventIds")
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (!staffId) return;
  const staff = await prisma.user.findFirst({
    where: { id: staffId, employerId: user.id, role: USER_ROLE.STAFF },
  });
  if (!staff) return;
  const owned = await prisma.event.findMany({
    where: { ownerId: user.id, id: { in: eventIds } },
    select: { id: true },
  });
  const validIds = owned.map((e) => e.id);
  await prisma.staffEventAccess.deleteMany({ where: { userId: staffId } });
  if (validIds.length > 0) {
    await prisma.staffEventAccess.createMany({
      data: validIds.map((eventId) => ({ userId: staffId, eventId })),
    });
  }
  revalidatePath("/dashboard/equipe");
}

export async function createStaffTaskAction(formData: FormData) {
  const user = await requireSessionUser();
  const eventId = field(formData, "eventId");
  const title = field(formData, "title");
  const note = field(formData, "note");
  const assignedToId =
    field(formData, "assignedToId") || null;
  if (!eventId || !title) return;
  if (!canManageEventOps(user)) return;
  await assertEventAccess(eventId, user);
  const ownerId = getOwnerId(user);
  if (assignedToId) {
    const ok = await prisma.user.findFirst({
      where: {
        id: assignedToId,
        employerId: ownerId,
        role: USER_ROLE.STAFF,
        staffEventAccess: { some: { eventId } },
      },
    });
    if (!ok) return;
  }
  await prisma.staffTask.create({
    data: {
      eventId,
      createdById: user.id,
      assignedToId,
      title,
      note,
    },
  });
  revalidatePath(`/dashboard/evenements/${eventId}`);
  revalidatePath("/dashboard/taches");
}

export async function toggleStaffTaskDoneAction(formData: FormData) {
  const user = await requireSessionUser();
  const taskId = field(formData, "taskId");
  const eventId = field(formData, "eventId");
  const done = String(formData.get("done") ?? "") === "true";
  if (!taskId || !eventId) return;
  await assertEventAccess(eventId, user);
  await prisma.staffTask.updateMany({
    // Un serveur ne coche que ses propres tâches ; OWNER / MH toutes.
    where: canManageEventOps(user)
      ? { id: taskId, eventId }
      : { id: taskId, eventId, assignedToId: user.id },
    data: {
      status: done ? STAFF_TASK_STATUS.DONE : STAFF_TASK_STATUS.PENDING,
    },
  });
  revalidatePath(`/dashboard/evenements/${eventId}`);
  revalidatePath("/dashboard/taches");
}

export async function deleteStaffTaskAction(formData: FormData) {
  const user = await requireSessionUser();
  const taskId = field(formData, "taskId");
  const eventId = field(formData, "eventId");
  if (!taskId || !eventId) return;
  if (!canManageEventOps(user)) return;
  await assertEventAccess(eventId, user);
  await prisma.staffTask.deleteMany({ where: { id: taskId, eventId } });
  revalidatePath(`/dashboard/evenements/${eventId}`);
  revalidatePath("/dashboard/taches");
}
