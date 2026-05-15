"use server";

import { nanoid } from "nanoid";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import {
  ensureBlocksDraft,
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

async function assertChecklistOwned(checklistId: string, userId: string) {
  const cl = await prisma.checklist.findFirst({
    where: { id: checklistId, ownerId: userId },
  });
  if (!cl) throw new Error("Checklist introuvable");
  return cl;
}

export async function createChecklistAction(formData: FormData) {
  const userId = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/dashboard/checklists/nouveau?erreur=nom");
  }
  const initialBlocks = [
    { type: "paragraph" as const, id: nanoid(), content: "" },
  ];
  const cl = await prisma.checklist.create({
    data: {
      name,
      ownerId: userId,
      blocks: initialBlocks as unknown as Prisma.InputJsonValue,
    },
  });
  revalidatePath("/dashboard/checklists");
  redirect(`/dashboard/checklists/${cl.id}`);
}

export async function updateChecklistNameAction(formData: FormData) {
  const userId = await requireOwner();
  const checklistId = String(formData.get("checklistId") ?? "");
  if (!checklistId) return;
  await assertChecklistOwned(checklistId, userId);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.checklist.update({
    where: { id: checklistId },
    data: { name },
  });
  revalidatePath(`/dashboard/checklists/${checklistId}`);
  revalidatePath("/dashboard/checklists");
}

export async function updateChecklistBlocksAction(formData: FormData) {
  const userId = await requireOwner();
  const checklistId = String(formData.get("checklistId") ?? "");
  if (!checklistId) return;
  const cl = await assertChecklistOwned(checklistId, userId);
  const rawPayload = String(formData.get("blocksPayload") ?? "").trim();
  let normalized = rawPayload
    ? validateAndNormalizeBlocksFromJson(rawPayload, "")
    : parseInstructionsBlocks(cl.blocks, "");
  normalized = ensureBlocksDraft(normalized).slice(0, INSTRUCTIONS_MAX_BLOCKS);

  await prisma.checklist.update({
    where: { id: checklistId },
    data: {
      blocks: normalized as unknown as Prisma.InputJsonValue,
    },
  });
  revalidatePath(`/dashboard/checklists/${checklistId}`);
  revalidatePath("/dashboard/checklists");
}

export async function toggleChecklistCheckboxAction(
  checklistId: string,
  blockId: string,
  checked: boolean,
) {
  const userId = await requireOwner();
  await assertChecklistOwned(checklistId, userId);
  const cl = await prisma.checklist.findFirst({
    where: { id: checklistId, ownerId: userId },
    select: { blocks: true },
  });
  if (!cl) return;

  const blocks = parseInstructionsBlocks(cl.blocks, "");
  let touched = false;
  const next = blocks.map((b) => {
    if (b.type === "checkbox" && b.id === blockId) {
      touched = true;
      return { ...b, checked };
    }
    return b;
  });
  if (!touched) return;

  await prisma.checklist.update({
    where: { id: checklistId },
    data: {
      blocks: next as unknown as Prisma.InputJsonValue,
    },
  });
  revalidatePath(`/dashboard/checklists/${checklistId}`);
  revalidatePath("/dashboard/checklists");
}

export async function deleteChecklistAction(formData: FormData) {
  const userId = await requireOwner();
  const checklistId = String(formData.get("checklistId") ?? "");
  if (!checklistId) return;
  await assertChecklistOwned(checklistId, userId);
  await prisma.checklist.delete({ where: { id: checklistId } });
  revalidatePath("/dashboard/checklists");
  redirect("/dashboard/checklists");
}
