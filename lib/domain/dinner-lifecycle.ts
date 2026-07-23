import type { DinnerStatus } from "./constants";

export function isDinnerHost(
  userId: string,
  dinner: { host_id: string | null; created_by: string | null },
  isAdmin?: boolean
): boolean {
  if (isAdmin) return true;
  return dinner.host_id === userId || dinner.created_by === userId;
}

export type LifecycleCheck = { ok: true } | { ok: false; error: string };

export function canStartDinner(
  status: string,
  bottleCount: number
): LifecycleCheck {
  if (status !== "setup") {
    return { ok: false, error: `Dinner is already ${status}` };
  }
  if (bottleCount === 0) {
    return { ok: false, error: "Cannot start dinner without bottles" };
  }
  return { ok: true };
}

export function canEndDinner(
  status: string,
  isExtraDinner = false
): LifecycleCheck {
  if (isExtraDinner) {
    if (status !== "setup" && status !== "active") {
      return { ok: false, error: `Jantar já está ${status}` };
    }
    return { ok: true };
  }
  if (status !== "active") {
    return { ok: false, error: `Cannot end dinner in ${status} state` };
  }
  return { ok: true };
}

export function canReveal(status: string): LifecycleCheck {
  if (status === "setup" || status === "active") {
    return { ok: false, error: "Dinner must be ended before revealing" };
  }
  return { ok: true };
}

export function statusAfterReveal(isComplete: boolean): DinnerStatus {
  return isComplete ? "completed" : "revealing";
}
