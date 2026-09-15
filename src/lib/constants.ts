export const GUEST_REQUEST = {
  PRODUCT: "PRODUCT",
  SERVICE: "SERVICE",
  STAFF: "STAFF",
} as const;

export const REQUEST_CATEGORY = {
  DRINK: "DRINK",
  CLEAR: "CLEAR",
  ASSISTANCE: "ASSISTANCE",
  URGENT: "URGENT",
  MISC: "MISC",
  OTHER: "OTHER",
} as const;

export const GUEST_REQUEST_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  ESCALATED: "ESCALATED",
  DONE: "DONE",
} as const;

export const EVENT_STATUS = {
  LIVE: "LIVE",
  ARCHIVED: "ARCHIVED",
} as const;

export const USER_ROLE = {
  OWNER: "OWNER",
  MAITRE_HOTEL: "MAITRE_HOTEL",
  STAFF: "STAFF",
} as const;

export const STAFF_TASK_STATUS = {
  PENDING: "PENDING",
  DONE: "DONE",
} as const;
