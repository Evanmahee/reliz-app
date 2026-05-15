import type { IconType } from "react-icons";
import {
  MdEvent,
  MdFactCheck,
  MdHistory,
  MdSettings,
  MdSpaceDashboard,
  MdOutlineEvent,
  MdOutlineFactCheck,
  MdOutlineHistory,
  MdOutlineSettings,
  MdOutlineSpaceDashboard,
} from "react-icons/md";

type Props = {
  name: string;
  filled?: boolean;
  className?: string;
  size?: number;
};

const FILLED: Record<string, IconType> = {
  space_dashboard: MdSpaceDashboard,
  event: MdEvent,
  checklist: MdFactCheck,
  history: MdHistory,
  settings: MdSettings,
};

const OUTLINE: Record<string, IconType> = {
  space_dashboard: MdOutlineSpaceDashboard,
  event: MdOutlineEvent,
  checklist: MdOutlineFactCheck,
  history: MdOutlineHistory,
  settings: MdOutlineSettings,
};

export function MaterialSymbol({
  name,
  filled = false,
  className = "",
  size = 24,
}: Props) {
  const Icon = (filled ? FILLED : OUTLINE)[name] ?? MdOutlineSettings;
  return <Icon size={size} className={`shrink-0 ${className}`} aria-hidden />;
}
