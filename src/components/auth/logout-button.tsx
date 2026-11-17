"use client";

import { useState } from "react";
import { MdLogout } from "react-icons/md";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/i18n/i18n-provider";

/** Déconnexion avec confirmation (évite un clic malheureux en plein service). */
export function LogoutButton({ variant = "full" }: { variant?: "full" | "icon" }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("nav.logout")}
          title={t("nav.logout")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[1.15rem] text-zinc-700 transition-colors hover:bg-zinc-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          <MdLogout size={22} aria-hidden />
        </button>
      ) : (
        <Button type="button" variant="outline" className="w-full justify-start" onClick={() => setOpen(true)}>
          {t("nav.logout")}
        </Button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t("nav.logoutTitle")} closeLabel={t("equipe.close")}>
        <p className="text-sm text-zinc-600">{t("nav.logoutBody")}</p>
        <form action={logoutAction} className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("equipe.cancel")}
          </Button>
          <SubmitButton pendingLabel="…">{t("nav.logoutConfirm")}</SubmitButton>
        </form>
      </Modal>
    </>
  );
}
