import {
  DEFAULT_DINNER_INTERVAL_MONTHS,
  OVERDUE_POLL_HORIZON_DAYS,
} from "./constants";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function assertDateStr(dateStr: string, label = "date"): void {
  if (!DATE_RE.test(dateStr)) {
    throw new Error(`Invalid ${label}: expected YYYY-MM-DD, got ${dateStr}`);
  }
}

/** Normalize DB/client date values to YYYY-MM-DD. */
export function toDateString(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return formatYmd(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }
  const s = String(value);
  if (DATE_RE.test(s)) return s;
  // ISO datetime
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

export function requireDateString(
  value: string | Date | null | undefined,
  label = "date"
): string {
  const s = toDateString(value);
  if (!s) throw new Error(`Invalid ${label}: ${value}`);
  return s;
}

/** Parse YYYY-MM-DD into UTC year/month/day (month 1–12). */
function parseYmd(dateStr: string): { y: number; m: number; d: number } {
  assertDateStr(dateStr);
  const [y, m, d] = dateStr.split("-").map(Number);
  return { y, m, d };
}

function formatYmd(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Last calendar day of month (month 1–12). */
function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * Add calendar months to a YYYY-MM-DD date (civil months).
 * Clamps day when target month is shorter (e.g. 2024-01-31 + 1 → 2024-02-29).
 */
export function addCalendarMonths(dateStr: string, months: number): string {
  const { y, m, d } = parseYmd(dateStr);
  const total = m - 1 + months;
  const newY = y + Math.floor(total / 12);
  let newM = total % 12;
  if (newM < 0) {
    newM = ((newM % 12) + 12) % 12;
  }
  const month1 = newM + 1;
  const last = daysInMonth(newY, month1);
  const day = Math.min(d, last);
  return formatYmd(newY, month1, day);
}

/** Add whole days to YYYY-MM-DD (UTC calendar arithmetic). */
export function addDays(dateStr: string, days: number): string {
  const { y, m, d } = parseYmd(dateStr);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return formatYmd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** Difference in whole days: b - a (can be negative). Both YYYY-MM-DD. */
export function daysBetween(a: string, b: string): number {
  const pa = parseYmd(a);
  const pb = parseYmd(b);
  const ta = Date.UTC(pa.y, pa.m - 1, pa.d);
  const tb = Date.UTC(pb.y, pb.m - 1, pb.d);
  return Math.round((tb - ta) / 86_400_000);
}

/** deadline_at = anchor + intervalMonths (calendar). */
export function computeDeadline(
  anchor: string,
  intervalMonths: number = DEFAULT_DINNER_INTERVAL_MONTHS
): string {
  return addCalendarMonths(anchor, intervalMonths);
}

/**
 * Period indexes that should exist when `today >= periodDeadline`.
 * period 1 → deadlineAt; period k → deadlineAt + (k-1)*intervalMonths.
 */
export function periodsDue(
  deadlineAt: string,
  intervalMonths: number,
  today: string
): number[] {
  assertDateStr(deadlineAt, "deadlineAt");
  assertDateStr(today, "today");
  if (intervalMonths < 1) {
    throw new Error("intervalMonths must be >= 1");
  }

  const due: number[] = [];
  let k = 1;
  let periodDeadline = deadlineAt;

  while (today >= periodDeadline && k <= 100) {
    due.push(k);
    k += 1;
    periodDeadline = addCalendarMonths(deadlineAt, (k - 1) * intervalMonths);
  }

  return due;
}

/** Date of the marco for period_index (1-based). */
export function periodDeadlineDate(
  deadlineAt: string,
  intervalMonths: number,
  periodIndex: number
): string {
  if (periodIndex < 1) throw new Error("periodIndex must be >= 1");
  return addCalendarMonths(deadlineAt, (periodIndex - 1) * intervalMonths);
}

/**
 * Pause auto-penalties when season only needs the extra dinner
 * (7 regular completed in active season). Derived, not stored.
 */
export function shouldPausePenalties(input: {
  regularCompletedCount: number;
}): boolean {
  return input.regularCompletedCount >= 7;
}

/**
 * Default poll date window.
 * start = today+1; end = deadline if still future, else today+horizon (45).
 */
export function defaultPollWindow(
  today: string,
  deadlineAt: string,
  horizonDays: number = OVERDUE_POLL_HORIZON_DAYS
): { start: string; end: string } {
  assertDateStr(today, "today");
  assertDateStr(deadlineAt, "deadlineAt");

  const start = addDays(today, 1);
  let end = deadlineAt >= start ? deadlineAt : addDays(today, horizonDays);
  if (end < start) end = start;
  return { start, end };
}

/** Today as YYYY-MM-DD in Europe/Lisbon. */
export function todayLisbon(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export type DeadlineUrgency = "none" | "ok" | "warning" | "overdue" | "paused";

export function computeUrgency(input: {
  hasCycle: boolean;
  daysLeft: number | null;
  pausePenalties: boolean;
  warningDays?: number;
}): DeadlineUrgency {
  if (!input.hasCycle) return "none";
  if (input.pausePenalties) return "paused";
  if (input.daysLeft == null) return "none";
  if (input.daysLeft < 0) return "overdue";
  const warn = input.warningDays ?? 30;
  if (input.daysLeft <= warn) return "warning";
  return "ok";
}
