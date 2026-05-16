"use client";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";

export function GuestTopBar({ returnTo }: { returnTo: string }) {
  return (
    <div className="mx-auto mb-4 flex max-w-lg justify-end px-1">
      <LocaleSwitcher returnTo={returnTo} />
    </div>
  );
}
