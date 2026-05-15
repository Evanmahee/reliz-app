import Image from "next/image";

const ASPECT = 312 / 101;

type Props = {
  /** Hauteur affichée en px ; la largeur suit le ratio du logo. */
  height?: number;
  className?: string;
  priority?: boolean;
};

export function RelizLogo({ height = 28, className = "", priority = false }: Props) {
  const width = Math.round(height * ASPECT);
  return (
    <Image
      src="/reliz-logo.svg"
      alt="Reliz"
      width={width}
      height={height}
      priority={priority}
      style={{ height, width: "auto", maxWidth: "none" }}
      className={className}
    />
  );
}
