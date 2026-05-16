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

async function requireOwner() {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Non authentifié");
  return userId;
}

async function assertEventOwned(eventId: string, userId: string) {
  const ev = await prisma.event.findFirst({
    where: { id: eventId, ownerId: userId },
  });
  if (!ev) throw new Error("Événement introuvable");
  return ev;
}

function randomSlug() {
  return nanoid(12).toLowerCase().replace(/[^a-z0-9]/g, "x");
}

export async function createEventAction(formData: FormData) {
  const userId = await requireOwner();
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
  const userId = await requireOwner();
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return;
  await assertEventOwned(eventId, userId);
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
  const userId = await requireOwner();
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return;
  const ev = await assertEventOwned(eventId, userId);
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
}

export async function toggleInstructionCheckboxAction(
  eventId: string,
  blockId: string,
  checked: boolean,
) {
  const userId = await requireOwner();
  await assertEventOwned(eventId, userId);
  const ev = await prisma.event.findFirst({
    where: { id: eventId, ownerId: userId },
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
}

export async function deleteEventAction(eventId: string) {
  const userId = await requireOwner();
  await assertEventOwned(eventId, userId);
  await prisma.event.delete({ where: { id: eventId } });
  revalidatePath("/dashboard/evenements");
  revalidatePath("/dashboard/historique");
  redirect("/dashboard/evenements");
}

export async function archiveEventAction(eventId: string) {
  const userId = await requireOwner();
  await assertEventOwned(eventId, userId);
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
  const userId = await requireOwner();
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return;
  await assertEventOwned(eventId, userId);
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
  const userId = await requireOwner();
  const menuItemId = String(formData.get("menuItemId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  if (!menuItemId || !eventId) return;
  await assertEventOwned(eventId, userId);
  await prisma.menuItem.deleteMany({
    where: { id: menuItemId, eventId },
  });
  revalidatePath(`/dashboard/evenements/${eventId}`);
}

export async function toggleMenuStockAction(formData: FormData) {
  const userId = await requireOwner();
  const menuItemId = String(formData.get("menuItemId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const next = String(formData.get("outOfStock") ?? "") === "true";
  if (!menuItemId || !eventId) return;
  await assertEventOwned(eventId, userId);
  await prisma.menuItem.updateMany({
    where: { id: menuItemId, eventId },
    data: { outOfStock: next },
  });
  const ev = await prisma.event.findFirst({
    where: { id: eventId, ownerId: userId },
    select: { publicSlug: true },
  });
  revalidatePath(`/dashboard/evenements/${eventId}`);
  if (ev) revalidatePath(`/e/${ev.publicSlug}`);
}

export async function markRequestDoneAction(requestId: string, eventId: string) {
  const userId = await requireOwner();
  await assertEventOwned(eventId, userId);
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
