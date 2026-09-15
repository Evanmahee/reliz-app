"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GUEST_REQUEST_STATUS } from "@/lib/constants";
import { useT } from "@/i18n/i18n-provider";

type ClaimedBy = {
  id: string;
  name: string | null;
  email: string;
} | null;

export function RequestClaimControls({
  requestId,
  status,
  claimedById,
  claimedBy,
  currentUserId,
  canManageOthers,
  onChanged,
}: {
  requestId: string;
  status: string;
  claimedById: string | null;
  claimedBy: ClaimedBy;
  currentUserId: string;
  canManageOthers: boolean;
  onChanged?: () => void;
}) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);

  if (status === GUEST_REQUEST_STATUS.DONE) return null;

  const claimedName =
    claimedBy?.name?.trim() ||
    claimedBy?.email ||
    t("user.defaultName");
  const isEscalated = status === GUEST_REQUEST_STATUS.ESCALATED;
  const isClaimed = Boolean(claimedById);
  const isMine = claimedById === currentUserId;
  const lockedByOther = isClaimed && !isMine && !isEscalated;

  async function claim() {
    setBusy(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/claim`, {
        method: "PATCH",
      });
      if (res.status === 409) {
        toast.error(t("events.requests.claimConflict"));
        onChanged?.();
        return;
      }
      if (!res.ok) {
        toast.error(t("events.requests.claimError"));
        return;
      }
      toast.success(t("events.requests.toastClaimed"));
      onChanged?.();
    } catch {
      toast.error(t("events.requests.networkError"));
    } finally {
      setBusy(false);
    }
  }

  async function unclaim() {
    setBusy(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/unclaim`, {
        method: "PATCH",
      });
      if (!res.ok) {
        toast.error(t("events.requests.unclaimError"));
        return;
      }
      toast.success(t("events.requests.toastUnclaimed"));
      onChanged?.();
    } catch {
      toast.error(t("events.requests.networkError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isEscalated ? (
        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-800">
          {t("events.requests.escalated")}
        </span>
      ) : null}

      {isClaimed && !isEscalated ? (
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
            lockedByOther
              ? "bg-zinc-200 text-zinc-600"
              : "bg-violet-50 text-violet-900"
          }`}
        >
          {t("events.requests.claimedBy").replace("{name}", claimedName)}
        </span>
      ) : null}

      {isEscalated && isClaimed ? (
        <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-800">
          {t("events.requests.claimedBy").replace("{name}", claimedName)}
        </span>
      ) : null}

      {(!isClaimed && status === GUEST_REQUEST_STATUS.PENDING) ||
      isEscalated ? (
        <Button
          type="button"
          variant="outline"
          className="text-xs"
          disabled={busy}
          onClick={() => void claim()}
        >
          {t("events.requests.claim")}
        </Button>
      ) : null}

      {!isEscalated && (isMine || (lockedByOther && canManageOthers)) ? (
        <Button
          type="button"
          variant="ghost"
          className="text-xs text-zinc-500"
          disabled={busy}
          onClick={() => void unclaim()}
        >
          {t("events.requests.unclaim")}
        </Button>
      ) : null}
    </div>
  );
}
