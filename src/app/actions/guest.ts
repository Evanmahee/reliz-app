"use server";

import { revalidatePath } from "next/cache";
import { EVENT_STATUS, GUEST_REQUEST, REQUEST_CATEGORY } from "@/lib/constants";
import { normalizeRequestCategory } from "@/lib/request-category";
import { prisma } from "@/lib/prisma";
import { getT } from "@/i18n/server";

export async function submitGuestRequest(input: {
  publicSlug: string;
  tableNumber: string;
  tableLocation?: string;
  type: string;
  message: string;
  category?: string;
  allergies?: string;
}) {
  const { t } = await getT();
  const event = await prisma.event.findUnique({
    where: { publicSlug: input.publicSlug },
    select: { id: true, status: true },
  });
  if (!event || event.status !== EVENT_STATUS.LIVE) {
    return { ok: false as const, error: t("guest.errors.unavailable") };
  }
  const tableNumber = input.tableNumber.trim();
  if (!tableNumber) {
    return { ok: false as const, error: t("guest.errors.tableRequired") };
  }
  const message = input.message.trim();
  if (!message) {
    return { ok: false as const, error: t("guest.errors.messageRequired") };
  }
  const tableLocation = String(input.tableLocation ?? "").trim();
  const type = String(input.type ?? GUEST_REQUEST.SERVICE).trim() || GUEST_REQUEST.SERVICE;
  const category = normalizeRequestCategory(
    input.category ??
      (type === GUEST_REQUEST.STAFF
        ? REQUEST_CATEGORY.ASSISTANCE
        : type === GUEST_REQUEST.PRODUCT
          ? REQUEST_CATEGORY.OTHER
          : REQUEST_CATEGORY.MISC),
  );

  const tableRow = await prisma.table.findFirst({
    where: { eventId: event.id, number: tableNumber },
    select: { isVip: true, zone: true },
  });
  const resolvedLocation =
    tableLocation || (tableRow?.zone ? tableRow.zone : "");

  await prisma.guestRequest.create({
    data: {
      eventId: event.id,
      tableNumber,
      tableLocation: resolvedLocation,
      type,
      category,
      message,
      isVip: tableRow?.isVip ?? false,
    },
  });

  const allergies = String(input.allergies ?? "").trim();
  if (allergies) {
    await prisma.guestAllergy.create({
      data: {
        eventId: event.id,
        tableNumber,
        content: allergies,
      },
    });
  }

  revalidatePath(`/e/${input.publicSlug}`);
  revalidatePath(`/dashboard/evenements/${event.id}`);
  revalidatePath("/dashboard");
  return { ok: true as const };
}
