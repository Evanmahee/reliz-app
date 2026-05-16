"use client";

import { updatePasswordAction } from "@/app/actions/settings";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/i18n/i18n-provider";

export function PasswordChangeForm() {
  const { t } = useT();
  return (
    <form action={updatePasswordAction} className="mt-4 space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">
          {t("parametres.currentPassword")}
        </label>
        <Input
          name="current"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">
          {t("parametres.newPassword")}
        </label>
        <Input
          name="next"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <SubmitButton variant="outline" pendingLabel={t("parametres.updating")}>
        {t("parametres.update")}
      </SubmitButton>
    </form>
  );
}
