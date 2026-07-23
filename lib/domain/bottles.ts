import {
  MAX_BOTTLES_DEFAULT,
  MAX_BOTTLES_ORGANIZER,
} from "./constants";

export function maxBottlesForUser(isOrganizer: boolean): number {
  return isOrganizer ? MAX_BOTTLES_ORGANIZER : MAX_BOTTLES_DEFAULT;
}

export type CanAddBottleResult =
  | { ok: true }
  | { ok: false; error: string };

export function canAddBottle(
  currentCount: number,
  isOrganizer: boolean
): CanAddBottleResult {
  const max = maxBottlesForUser(isOrganizer);
  if (currentCount >= max) {
    return {
      ok: false,
      error: isOrganizer
        ? "Organizador já adicionou o máximo de 2 garrafas para este jantar"
        : "Já adicionaste 1 garrafa para este jantar. Apenas o organizador pode adicionar 2 garrafas.",
    };
  }
  return { ok: true };
}

/** Next sequential position for a bottle in a dinner (1-based). */
export function nextBottlePosition(
  lastPosition: number | null | undefined
): number {
  return lastPosition != null ? lastPosition + 1 : 1;
}
