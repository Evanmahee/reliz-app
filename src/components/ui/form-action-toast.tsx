"use client";

import { toast } from "sonner";
import { isNextRedirectError } from "@/lib/is-next-redirect-error";

/** Entoure une Server Action sur formulaire : toast succès / erreur (ignore les redirect Next). */
export function wrapFormActionWithToast(
  action: (formData: FormData) => Promise<void>,
  opts: { success: string; error?: string },
): (formData: FormData) => Promise<void> {
  return async (formData: FormData) => {
    try {
      await action(formData);
      toast.success(opts.success);
    } catch (err) {
      if (isNextRedirectError(err)) throw err;
      console.error(err);
      toast.error(opts.error ?? "Une erreur est survenue.");
    }
  };
}
