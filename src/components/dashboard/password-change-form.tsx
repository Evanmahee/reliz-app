"use client";

import { updatePasswordAction } from "@/app/actions/settings";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function PasswordChangeForm() {
  return (
    <form action={updatePasswordAction} className="mt-4 space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">
          Mot de passe actuel
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
          Nouveau mot de passe
        </label>
        <Input
          name="next"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <SubmitButton variant="outline" pendingLabel="Mise à jour…">
        Mettre à jour
      </SubmitButton>
    </form>
  );
}
