"use server";

import { revalidatePath } from "next/cache";
import { EVENT_STATUS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getT } from "@/i18n/server";

export async function submitGuestRequest(input: {
  publicSlug: string;
  tableNumber: string;
  type: string;
  message: string;
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
  await prisma.guestRequest.create({
    data: {
      eventId: event.id,
      tableNumber,
      type: input.type,
      message,
    },
  });
  revalidatePath(`/e/${input.publicSlug}`);
  revalidatePath(`/dashboard/evenements/${event.id}`);
  revalidatePath("/dashboard");
  return { ok: true as const };
}
