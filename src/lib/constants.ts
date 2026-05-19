export const GUEST_REQUEST = {
  PRODUCT: "PRODUCT",
  SERVICE: "SERVICE",
  STAFF: "STAFF",
} as const;

export const EVENT_STATUS = {
  LIVE: "LIVE",
  ARCHIVED: "ARCHIVED",
} as const;

export const USER_ROLE = {
  OWNER: "OWNER",
  STAFF: "STAFF",
} as const;

export const STAFF_TASK_STATUS = {
  PENDING: "PENDING",
  DONE: "DONE",
} as const;
