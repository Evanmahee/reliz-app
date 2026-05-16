"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast:
            "rounded-[1.15rem] border border-zinc-200 bg-white font-sans shadow-lg",
          title: "font-semibold text-zinc-900",
          description: "text-zinc-600",
        },
      }}
    />
  );
}
