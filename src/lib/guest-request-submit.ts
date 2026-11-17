export type GuestRequestPayload = {
  publicSlug: string;
  tableNumber: string;
  message: string;
  type: string;
  category?: string;
  tableLocation?: string;
  allergies?: string;
  /** Identifiant généré côté téléphone : le serveur ignore les renvois. */
  clientRequestId: string;
};

export type GuestRequestSubmitResult =
  | { ok: true }
  | { ok: false; error: "client" | "network"; detail?: string };

const RETRY_DELAYS_MS = [2000, 4000, 8000] as const;
const REQUEST_TIMEOUT_MS = 12_000;
const QUEUE_KEY = "reliz_pending_requests";
/** Au-delà, une demande en file n'a plus de sens (le service a avancé). */
const QUEUE_MAX_AGE_MS = 30 * 60_000;
const QUEUE_MAX_ITEMS = 20;

type QueuedRequest = { payload: GuestRequestPayload; queuedAt: number };

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number) {
  return status >= 500 && status <= 599;
}

export function newClientRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Un seul essai, avec délai maximum (évite un envoi bloqué sur réseau très lent). */
async function postOnce(
  payload: GuestRequestPayload,
): Promise<GuestRequestSubmitResult | "retry"> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (res.ok) return { ok: true };
    if (isRetryableStatus(res.status)) return "retry";
    let detail: string | undefined;
    try {
      const data = (await res.json()) as { error?: string };
      detail = data.error;
    } catch {
      /* ignore */
    }
    return { ok: false, error: "client", detail };
  } catch {
    return "retry";
  } finally {
    clearTimeout(timer);
  }
}

/**
 * POST /api/requests avec retries (réseau / 5xx uniquement).
 * Jusqu’à 3 retries : 2s → 4s → 8s. Hors ligne : pas d'attente inutile.
 */
export async function postGuestRequestWithRetry(
  payload: GuestRequestPayload,
  onRetrying?: () => void,
): Promise<GuestRequestSubmitResult> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      if (typeof navigator !== "undefined" && navigator.onLine === false) break;
      onRetrying?.();
      await sleep(RETRY_DELAYS_MS[attempt - 1]!);
    }
    const res = await postOnce(payload);
    if (res !== "retry") return res;
  }
  return { ok: false, error: "network" };
}

function readQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const list = raw ? (JSON.parse(raw) as QueuedRequest[]) : [];
    const now = Date.now();
    return Array.isArray(list)
      ? list.filter((q) => q?.payload && now - q.queuedAt < QUEUE_MAX_AGE_MS)
      : [];
  } catch {
    return [];
  }
}

function writeQueue(list: QueuedRequest[]) {
  try {
    if (list.length === 0) localStorage.removeItem(QUEUE_KEY);
    else localStorage.setItem(QUEUE_KEY, JSON.stringify(list));
  } catch {
    /* stockage indisponible (navigation privée) : on abandonne la file */
  }
}

/** Met une demande de côté, pour la renvoyer quand le réseau revient. */
export function enqueueGuestRequest(payload: GuestRequestPayload) {
  const list = readQueue().filter(
    (q) => q.payload.clientRequestId !== payload.clientRequestId,
  );
  list.push({ payload, queuedAt: Date.now() });
  writeQueue(list.slice(-QUEUE_MAX_ITEMS));
}

export function pendingGuestRequestCount(publicSlug: string): number {
  return readQueue().filter((q) => q.payload.publicSlug === publicSlug).length;
}

let flushing = false;

/**
 * Renvoie les demandes en attente (un essai chacune). Les demandes refusées
 * par le serveur (4xx) sont abandonnées ; les autres restent en file.
 * Retourne le nombre de demandes parties.
 */
export async function flushGuestRequestQueue(): Promise<number> {
  if (flushing) return 0;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return 0;
  flushing = true;
  let sent = 0;
  try {
    for (const item of readQueue()) {
      const res = await postOnce(item.payload);
      if (res === "retry") break;
      const rest = readQueue().filter(
        (q) => q.payload.clientRequestId !== item.payload.clientRequestId,
      );
      writeQueue(rest);
      if (res.ok) sent++;
    }
  } finally {
    flushing = false;
  }
  return sent;
}
