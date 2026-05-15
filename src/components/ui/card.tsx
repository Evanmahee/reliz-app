import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: Props) {
  return (
    <div
      className={`rounded-[1.75rem] border border-zinc-200/80 bg-white ${className}`}
      {...props}
    />
  );
}
