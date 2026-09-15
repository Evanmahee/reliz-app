"use client";

import { useState } from "react";
import { MdOutlineVisibility, MdOutlineVisibilityOff } from "react-icons/md";
import { Input } from "@/components/ui/input";
import { useT } from "@/i18n/i18n-provider";

export function PasswordField() {
  const [visible, setVisible] = useState(false);
  const { t } = useT();
  return (
    <div className="relative">
      <Input
        name="password"
        type={visible ? "text" : "password"}
        autoComplete="current-password"
        required
        placeholder="••••••••"
        className="pr-11"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
        aria-label={
          visible ? t("common.hidePassword") : t("common.showPassword")
        }
      >
        {visible ? (
          <MdOutlineVisibilityOff size={20} />
        ) : (
          <MdOutlineVisibility size={20} />
        )}
      </button>
    </div>
  );
}
