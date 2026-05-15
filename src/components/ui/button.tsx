import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-[1.35rem] px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:pointer-events-none disabled:opacity-45";

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary: "bg-zinc-950 text-white hover:bg-zinc-800",
  ghost: "bg-transparent text-zinc-900 hover:bg-zinc-100/80",
  outline: "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
};

/** Même style que `<Button variant="outline">` pour les `<Link>`. */
export const outlineButtonClassName = `${base} ${variants.outline}`;

/** Même style que `<Button variant="primary">` pour les `<Link>`. */
export const primaryButtonClassName = `${base} ${variants.primary}`;

export function Button({
  className = "",
  variant = "primary",
  ...props
}: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
