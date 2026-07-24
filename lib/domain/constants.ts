export const MAX_SEASON_DINNERS = 8;
export const BASE_PIPAS = 10;
export const MAX_FOUNDERS = 7;
export const SCORE_MIN = 1;
export const SCORE_MAX = 10;
export const SCORE_STEP = 0.5;
export const MAX_BOTTLES_ORGANIZER = 2;
export const MAX_BOTTLES_DEFAULT = 1;

/** Default months between dinners (overridable via app_settings). */
export const DEFAULT_DINNER_INTERVAL_MONTHS = 6;
/** Default pipas fine per overdue period (overridable via app_settings). */
export const DEFAULT_DEADLINE_FINE = 20;
/** When deadline is past, default poll window end = today + this many days. */
export const OVERDUE_POLL_HORIZON_DAYS = 45;
/** Banner warning threshold (days left). */
export const DEADLINE_WARNING_DAYS = 30;
/** Min members (founder|admin) with submitted "Posso" required before admin can mark a date from poll. */
export const MIN_AVAILABLE_FOR_SCHEDULED_DINNER = 6;
/** Dinner statuses that count as "scheduled" (not yet ended/realized). Max 1 at a time. */
export const SCHEDULED_DINNER_STATUSES = ["setup", "active"] as const;

export type DinnerStatus =
  | "setup"
  | "active"
  | "ended"
  | "revealing"
  | "completed";

export type UserRole = "admin" | "founder" | "guest";
