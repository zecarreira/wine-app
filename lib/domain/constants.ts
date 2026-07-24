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

export type DinnerStatus =
  | "setup"
  | "active"
  | "ended"
  | "revealing"
  | "completed";

export type UserRole = "admin" | "founder" | "guest";
