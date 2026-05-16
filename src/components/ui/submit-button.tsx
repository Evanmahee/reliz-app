"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type Props = ComponentProps<typeof Button> & {
  pendingLabel: string;
};

/**
 * Bouton submit avec état de chargement (requiert d’être rendu à l’intérieur du &lt;form&gt;).
 */
export function SubmitButton({
  children,
  pendingLabel,
  disabled,
  ...props
}: Props) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={disabled ?? pending}
      aria-busy={pending}
      {...props}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
