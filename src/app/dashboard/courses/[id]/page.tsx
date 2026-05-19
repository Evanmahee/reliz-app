import { notFound, redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { getSessionUser, isOwner } from "@/lib/event-access";
import { prisma } from "@/lib/prisma";

export default async function ListeCoursesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) redirect("/connexion");
  const user = await getSessionUser(userId);
  if (!user || !isOwner(user)) redirect("/dashboard");

  const list = await prisma.shoppingList.findFirst({
    where: { id, ownerId: user.id },
    select: { eventId: true },
  });
  if (!list) notFound();
  if (list.eventId) {
    redirect(`/dashboard/evenements/${list.eventId}`);
  }
  redirect("/dashboard/evenements");
}
