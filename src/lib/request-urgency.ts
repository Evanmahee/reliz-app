export type RequestUrgency = "fresh" | "waiting" | "urgent";

/** Urgence visuelle selon le temps d’attente (minutes). */
export function getRequestUrgency(createdAt: Date, now = new Date()): RequestUrgency {
  const minutes = (now.getTime() - createdAt.getTime()) / 60_000;
  if (minutes >= 8) return "urgent";
  if (minutes >= 3) return "waiting";
  return "fresh";
}

export function urgencyWaitMinutes(createdAt: Date, now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 60_000));
}
