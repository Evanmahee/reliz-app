"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  formatShoppingListPlain,
  parseShoppingItems,
  type ShoppingListItem,
} from "@/lib/shopping-items";
import { getOwnerId, isOwner, requireSessionUser } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";

function parseItemsJson(raw: string): ShoppingListItem[] {
  try {
    return parseShoppingItems(JSON.parse(raw));
  } catch {
    return [];
  }
}

function revalidateShopping(eventId: string | null | undefined, listId?: string) {
  revalidatePath("/dashboard/evenements");
  if (eventId) {
    revalidatePath(`/dashboard/evenements/${eventId}`);
  }
  if (listId) {
    revalidatePath(`/dashboard/courses/${listId}`);
  }
}

export async function createEventShoppingListAction(formData: FormData) {
  const user = await requireSessionUser();
  if (!isOwner(user)) return;
  const eventId = String(formData.get("eventId") ?? "").trim();
  if (!eventId) return;

  const ev = await prisma.event.findFirst({
    where: { id: eventId, ownerId: user.id },
    select: { id: true, name: true },
  });
  if (!ev) return;

  const existing = await prisma.shoppingList.findFirst({
    where: { eventId: ev.id, ownerId: user.id },
    select: { id: true },
  });
  if (existing) {
    revalidateShopping(ev.id);
    return;
  }

  await prisma.shoppingList.create({
    data: {
      name: ev.name,
      ownerId: user.id,
      eventId: ev.id,
      items: [{ id: "1", name: "", quantity: "" }] as unknown as object,
    },
  });
  revalidateShopping(ev.id);
}

export async function createShoppingListAction(formData: FormData) {
  const user = await requireSessionUser();
  if (!isOwner(user)) return;
  const name = String(formData.get("name") ?? "").trim();
  const eventId = String(formData.get("eventId") ?? "").trim() || null;
  const itemsRaw = String(formData.get("items") ?? "[]");
  if (!name) redirect("/dashboard/evenements");
  if (eventId) {
    const ev = await prisma.event.findFirst({
      where: { id: eventId, ownerId: user.id },
    });
    if (!ev) redirect("/dashboard/evenements");
  }
  const list = await prisma.shoppingList.create({
    data: {
      name,
      ownerId: user.id,
      eventId,
      items: parseItemsJson(itemsRaw) as unknown as object,
    },
  });
  revalidateShopping(eventId, list.id);
  if (eventId) {
    redirect(`/dashboard/evenements/${eventId}`);
  }
  redirect(`/dashboard/courses/${list.id}`);
}

export async function updateShoppingListAction(formData: FormData) {
  const user = await requireSessionUser();
  if (!isOwner(user)) return;
  const listId = String(formData.get("listId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const itemsRaw = String(formData.get("items") ?? "[]");
  if (!listId || !name) return;

  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, ownerId: user.id },
    select: { eventId: true },
  });
  if (!list) return;

  await prisma.shoppingList.updateMany({
    where: { id: listId, ownerId: user.id },
    data: {
      name,
      items: parseItemsJson(itemsRaw) as unknown as object,
    },
  });
  revalidateShopping(list.eventId, listId);
}

export async function markShoppingListSentAction(formData: FormData) {
  const user = await requireSessionUser();
  if (!isOwner(user)) return;
  const listId = String(formData.get("listId") ?? "").trim();
  const sentTo = String(formData.get("sentTo") ?? "").trim();
  if (!listId) return;

  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, ownerId: user.id },
    select: { eventId: true },
  });
  if (!list) return;

  await prisma.shoppingList.updateMany({
    where: { id: listId, ownerId: user.id },
    data: { sentAt: new Date(), sentTo },
  });
  revalidateShopping(list.eventId, listId);
}

export async function deleteShoppingListAction(formData: FormData) {
  const user = await requireSessionUser();
  if (!isOwner(user)) return;
  const listId = String(formData.get("listId") ?? "").trim();
  if (!listId) return;

  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, ownerId: user.id },
    select: { eventId: true },
  });
  if (!list) return;

  await prisma.shoppingList.deleteMany({
    where: { id: listId, ownerId: user.id },
  });
  revalidateShopping(list.eventId);
  if (list.eventId) {
    redirect(`/dashboard/evenements/${list.eventId}`);
  }
  redirect("/dashboard/evenements");
}

export async function getShoppingListMailto(listId: string): Promise<string | null> {
  const user = await requireSessionUser();
  if (!isOwner(user)) return null;
  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, ownerId: user.id },
  });
  if (!list) return null;
  const items = parseShoppingItems(list.items);
  const body = encodeURIComponent(formatShoppingListPlain(list.name, items));
  const to = list.sentTo ? encodeURIComponent(list.sentTo) : "";
  return `mailto:${to}?subject=${encodeURIComponent(list.name)}&body=${body}`;
}
