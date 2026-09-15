"use server";

import { nanoid } from "nanoid";
import { Prisma } from "@prisma/client";
import {
  PrismaClientKnownRequestError,
} from "@prisma/client/runtime/library";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { EVENT_STATUS } from "@/lib/constants";
import {
  assertEventAccess,
  canManageEventOps,
  isOwner,
  requireSessionUser,
} from "@/lib/event-access";
import { isNextRedirectError } from "@/lib/is-next-redirect-error";
import {
  cloneBlocksWithNewIds,
  ensureBlocksDraft,
  flattenBlocksToPlainText,
  parseInstructionsBlocks,
  validateAndNormalizeBlocksFromJson,
  INSTRUCTIONS_MAX_BLOCKS,
} from "@/lib/instructions-blocks";
import { prisma } from "@/lib/prisma";

async function requireOwnerId() {
  const user = await requireSessionUser();
  if (!isOwner(user)) throw new Error("Réservé au traiteur");
  return user.id;
}

async function assertEventForSession(eventId: string) {
  const user = await requireSessionUser();
  return assertEventAccess(eventId, user);
}

async function assertEventOwnedByTraiteur(eventId: string) {
  const user = await requireSessionUser();
  if (!isOwner(user)) throw new Error("Réservé au traiteur");
  const ev = await prisma.event.findFirst({
    where: { id: eventId, ownerId: user.id },
  });
  if (!ev) throw new Error("Événement introuvable");
  return ev;
}

/** Accès opérationnel OWNER ou MAITRE_HOTEL. */
async function assertEventOps(eventId: string) {
  const user = await requireSessionUser();
  if (!canManageEventOps(user)) throw new Error("Accès refusé");
  return assertEventAccess(eventId, user);
}

function randomSlug() {
  return nanoid(12).toLowerCase().replace(/[^a-z0-9]/g, "x");
}

export async function createEventAction(formData: FormData) {
  const userId = await requireOwnerId();
  const name = String(formData.get("name") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const checklistId = String(formData.get("checklistId") ?? "").trim();
  const startsRaw = String(formData.get("startsAt") ?? "").trim();
  if (!name) {
    redirect("/dashboard/evenements/nouveau?erreur=nom");
  }

  let instructions = "";
  let instructionsBlocks: Prisma.InputJsonValue | undefined = undefined;

  if (checklistId) {
    const template = await prisma.checklist.findFirst({
      where: { id: checklistId, ownerId: userId },
    });
    if (template) {
      const parsed = parseInstructionsBlocks(template.blocks, "");
      const cloned = cloneBlocksWithNewIds(parsed);
      instructions = flattenBlocksToPlainText(cloned);
      instructionsBlocks = cloned as unknown as Prisma.InputJsonValue;
    }
  }

  let publicSlug = randomSlug();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.event.findUnique({ where: { publicSlug } });
    if (!clash) break;
    publicSlug = randomSlug();
  }
  const startsAt = startsRaw ? new Date(startsRaw) : null;
  const clientEventId = String(formData.get("clientEventId") ?? "").trim();
  const useClientId =
    clientEventId.length >= 12 &&
    clientEventId.length <= 36 &&
    /^[a-zA-Z0-9_-]+$/.test(clientEventId);

  try {
    const event = await prisma.event.create({
      data: {
        ...(useClientId ? { id: clientEventId } : {}),
        name,
        venue,
        instructions,
        publicSlug,
        ownerId: userId,
        status: EVENT_STATUS.LIVE,
        startsAt: startsAt && !Number.isNaN(startsAt.getTime()) ? startsAt : null,
        ...(instructionsBlocks !== undefined ? { instructionsBlocks } : {}),
      },
    });
    revalidatePath("/dashboard/evenements");
    revalidatePath("/dashboard");
    redirect(`/dashboard/evenements/${event.id}`);
  } catch (e) {
    if (isNextRedirectError(e)) throw e;
    if (
      e instanceof PrismaClientKnownRequestError &&
      e.code === "P2002" &&
      useClientId
    ) {
      const rawTarget = (e.meta as { target?: string | string[] } | undefined)
        ?.target;
      const target = Array.isArray(rawTarget)
        ? rawTarget
        : rawTarget
          ? [rawTarget]
          : [];
      if (target.includes("id")) {
        const existing = await prisma.event.findFirst({
          where: { id: clientEventId, ownerId: userId },
        });
        if (existing) {
          revalidatePath("/dashboard/evenements");
          revalidatePath("/dashboard");
          redirect(`/dashboard/evenements/${existing.id}`);
        }
      }
    }
    throw e;
  }
}

export async function updateEventInformationsAction(formData: FormData) {
  const userId = await requireOwnerId();
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return;
  await assertEventOwnedByTraiteur(eventId);
  const name = String(formData.get("name") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const startsRaw = String(formData.get("startsAt") ?? "").trim();
  if (!name) return;
  const startsAt = startsRaw ? new Date(startsRaw) : null;
  await prisma.event.update({
    where: { id: eventId },
    data: {
      name,
      venue,
      startsAt:
        startsAt && !Number.isNaN(startsAt.getTime()) ? startsAt : null,
    },
  });
  revalidatePath(`/dashboard/evenements/${eventId}`);
  revalidatePath("/dashboard/evenements");
  revalidatePath("/dashboard");
}

export async function updateEventConsignesAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return;
  const ev = await assertEventOps(eventId);
  const rawPayload = String(formData.get("instructionsPayload") ?? "").trim();
  let normalized = rawPayload
    ? validateAndNormalizeBlocksFromJson(rawPayload, ev.instructions)
    : parseInstructionsBlocks(ev.instructionsBlocks, ev.instructions);
  normalized = ensureBlocksDraft(normalized).slice(0, INSTRUCTIONS_MAX_BLOCKS);

  await prisma.event.update({
    where: { id: eventId },
    data: {
      instructionsBlocks: normalized as unknown as Prisma.InputJsonValue,
      instructions: flattenBlocksToPlainText(normalized),
    },
  });
  revalidatePath(`/dashboard/evenements/${eventId}`);
  revalidatePath("/dashboard/evenements");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/taches");
}

export async function toggleInstructionCheckboxAction(
  eventId: string,
  blockId: string,
  checked: boolean,
) {
  await assertEventForSession(eventId);
  const ev = await prisma.event.findFirst({
    where: { id: eventId },
    select: { instructionsBlocks: true, instructions: true },
  });
  if (!ev) return;

  const blocks = parseInstructionsBlocks(ev.instructionsBlocks, ev.instructions);
  let touched = false;
  const next = blocks.map((b) => {
    if (b.type === "checkbox" && b.id === blockId) {
      touched = true;
      return { ...b, checked };
    }
    return b;
  });
  if (!touched) return;

  await prisma.event.update({
    where: { id: eventId },
    data: {
      instructionsBlocks: next as unknown as Prisma.InputJsonValue,
      instructions: flattenBlocksToPlainText(next),
    },
  });
  revalidatePath(`/dashboard/evenements/${eventId}`);
  revalidatePath("/dashboard/evenements");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/taches");
}

export async function deleteEventAction(eventId: string) {
  const userId = await requireOwnerId();
  await assertEventOwnedByTraiteur(eventId);
  await prisma.event.delete({ where: { id: eventId } });
  revalidatePath("/dashboard/evenements");
  revalidatePath("/dashboard/historique");
  redirect("/dashboard/evenements");
}

export async function archiveEventAction(eventId: string) {
  const userId = await requireOwnerId();
  await assertEventOwnedByTraiteur(eventId);
  await prisma.event.update({
    where: { id: eventId },
    data: { status: EVENT_STATUS.ARCHIVED },
  });
  revalidatePath(`/dashboard/evenements/${eventId}`);
  revalidatePath("/dashboard/evenements");
  revalidatePath("/dashboard/historique");
  revalidatePath("/dashboard");
  redirect("/dashboard/historique");
}

/** Pour les formulaires sur les cartes d’événements (liste dashboard / événements). */
export async function archiveEventFormAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "").trim();
  if (!eventId) return;
  await archiveEventAction(eventId);
}

export async function addMenuItemAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return;
  await assertEventOps(eventId);
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return;
  const maxSort = await prisma.menuItem.aggregate({
    where: { eventId },
    _max: { sortOrder: true },
  });
  await prisma.menuItem.create({
    data: {
      eventId,
      name,
      description,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });
  revalidatePath(`/dashboard/evenements/${eventId}`);
}

export async function deleteMenuItemFormAction(formData: FormData) {
  const menuItemId = String(formData.get("menuItemId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  if (!menuItemId || !eventId) return;
  await assertEventOps(eventId);
  await prisma.menuItem.deleteMany({
    where: { id: menuItemId, eventId },
  });
  revalidatePath(`/dashboard/evenements/${eventId}`);
}

export async function toggleMenuStockAction(formData: FormData) {
  const menuItemId = String(formData.get("menuItemId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const next = String(formData.get("outOfStock") ?? "") === "true";
  if (!menuItemId || !eventId) return;
  const ev = await assertEventOps(eventId);
  await prisma.menuItem.updateMany({
    where: { id: menuItemId, eventId },
    data: { outOfStock: next },
  });
  revalidatePath(`/dashboard/evenements/${eventId}`);
  revalidatePath(`/e/${ev.publicSlug}`);
}

export async function markRequestDoneAction(requestId: string, eventId: string) {
  await assertEventForSession(eventId);
  await prisma.guestRequest.updateMany({
    where: { id: requestId, eventId },
    data: { status: "DONE" },
  });
  revalidatePath(`/dashboard/evenements/${eventId}`);
  revalidatePath("/dashboard");
}

export async function markRequestDoneFormAction(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  if (!requestId || !eventId) return;
  await markRequestDoneAction(requestId, eventId);
}

export async function toggleEventMenuHiddenAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const hidden = String(formData.get("menuHidden") ?? "") === "true";
  if (!eventId) return;
  const ev = await assertEventOps(eventId);
  await prisma.event.update({
    where: { id: eventId },
    data: { menuHidden: hidden },
  });
  revalidatePath(`/dashboard/evenements/${eventId}`);
  revalidatePath(`/e/${ev.publicSlug}`);
}

export async function toggleMenuItemHiddenAction(formData: FormData) {
  const menuItemId = String(formData.get("menuItemId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const hidden = String(formData.get("hidden") ?? "") === "true";
  if (!menuItemId || !eventId) return;
  const ev = await assertEventOps(eventId);
  await prisma.menuItem.updateMany({
    where: { id: menuItemId, eventId },
    data: { hidden },
  });
  revalidatePath(`/dashboard/evenements/${eventId}`);
  revalidatePath(`/e/${ev.publicSlug}`);
}

export async function addEventAccessoryAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const qtyRaw = parseInt(String(formData.get("quantity") ?? "1"), 10);
  const quantity = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;
  if (!eventId || !name) return;
  await assertEventOps(eventId);
  const maxSort = await prisma.eventAccessory.aggregate({
    where: { eventId },
    _max: { sortOrder: true },
  });
  await prisma.eventAccessory.create({
    data: {
      eventId,
      name,
      notes,
      quantity,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });
  revalidatePath(`/dashboard/evenements/${eventId}`);
}

export async function deleteEventAccessoryAction(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const accessoryId = String(formData.get("accessoryId") ?? "");
  if (!eventId || !accessoryId) return;
  await assertEventOps(eventId);
  await prisma.eventAccessory.deleteMany({
    where: { id: accessoryId, eventId },
  });
  revalidatePath(`/dashboard/evenements/${eventId}`);
}
