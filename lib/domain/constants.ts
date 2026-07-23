export const MAX_SEASON_DINNERS = 8;
export const BASE_PIPAS = 10;
export const MAX_FOUNDERS = 7;
export const SCORE_MIN = 1;
export const SCORE_MAX = 10;
export const SCORE_STEP = 0.5;
export const MAX_BOTTLES_ORGANIZER = 2;
export const MAX_BOTTLES_DEFAULT = 1;

export type DinnerStatus =
  | "setup"
  | "active"
  | "ended"
  | "revealing"
  | "completed";

export type UserRole = "admin" | "founder" | "guest";
