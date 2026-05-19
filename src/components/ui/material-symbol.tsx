import type { IconType } from "react-icons";
import {
  MdAssignment,
  MdEvent,
  MdFactCheck,
  MdGroups,
  MdHistory,
  MdSettings,
  MdShoppingCart,
  MdSpaceDashboard,
  MdOutlineAssignment,
  MdOutlineEvent,
  MdOutlineFactCheck,
  MdOutlineGroups,
  MdOutlineHistory,
  MdOutlineSettings,
  MdOutlineShoppingCart,
  MdOutlineSpaceDashboard,
  MdNotifications,
  MdOutlineNotifications,
  MdRestaurantMenu,
  MdOutlineRestaurantMenu,
  MdRoomService,
  MdOutlineRoomService,
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
  assignment: MdAssignment,
  groups: MdGroups,
  badge: MdGroups,
  shopping_cart: MdShoppingCart,
  history: MdHistory,
  settings: MdSettings,
  restaurant: MdRestaurantMenu,
  room_service: MdRoomService,
  notifications: MdNotifications,
};

const OUTLINE: Record<string, IconType> = {
  space_dashboard: MdOutlineSpaceDashboard,
  event: MdOutlineEvent,
  checklist: MdOutlineFactCheck,
  assignment: MdOutlineAssignment,
  groups: MdOutlineGroups,
  badge: MdOutlineGroups,
  shopping_cart: MdOutlineShoppingCart,
  history: MdOutlineHistory,
  settings: MdOutlineSettings,
  restaurant: MdOutlineRestaurantMenu,
  room_service: MdOutlineRoomService,
  notifications: MdOutlineNotifications,
};

export function MaterialSymbol({
  name,
  filled = false,
  className = "",
  size = 24,
}: Props) {
  const Icon = (filled ? FILLED : OUTLINE)[name] ?? MdOutlineSpaceDashboard;
  return <Icon size={size} className={`shrink-0 ${className}`} aria-hidden />;
}
