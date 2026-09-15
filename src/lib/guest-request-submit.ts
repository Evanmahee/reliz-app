export type GuestRequestPayload = {
  publicSlug: string;
  tableNumber: string;
  message: string;
  type: string;
  category?: string;
  tableLocation?: string;
  allergies?: string;
};

export type GuestRequestSubmitResult =
  | { ok: true }
  | { ok: false; error: "client" | "network"; detail?: string };

const RETRY_DELAYS_MS = [2000, 4000, 8000] as const;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number) {
  return status >= 500 && status <= 599;
}

/**
 * POST /api/requests avec retries (réseau / 5xx uniquement).
 * Jusqu’à 3 retries : 2s → 4s → 8s.
 */
export async function postGuestRequestWithRetry(
  payload: GuestRequestPayload,
  onRetrying?: () => void,
): Promise<GuestRequestSubmitResult> {
  let lastNetwork = false;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      onRetrying?.();
      await sleep(RETRY_DELAYS_MS[attempt - 1]!);
    }

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        return { ok: true };
      }

      if (isRetryableStatus(res.status)) {
        lastNetwork = true;
        continue;
      }

      // 4xx et autres : pas de retry
      let detail: string | undefined;
      try {
        const data = (await res.json()) as { error?: string };
        detail = data.error;
      } catch {
        /* ignore */
      }
      return { ok: false, error: "client", detail };
    } catch {
      lastNetwork = true;
    }
  }

  return {
    ok: false,
    error: lastNetwork ? "network" : "client",
  };
}
