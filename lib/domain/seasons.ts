import { MAX_SEASON_DINNERS } from "./constants";

export function isSeasonFull(dinnerCount: number): boolean {
  return dinnerCount >= MAX_SEASON_DINNERS;
}

export function nextDinnerNumber(dinnerCount: number): number {
  return dinnerCount + 1;
}

/** 8th dinner or explicit flag marks the extra dinner. */
export function isExtraDinner(
  dinnerNumber: number,
  isExtraFlag?: boolean
): boolean {
  return isExtraFlag === true || dinnerNumber === MAX_SEASON_DINNERS;
}

export function canCloseSeason(dinnerCount: number): boolean {
  return dinnerCount === MAX_SEASON_DINNERS;
}

export function closeSeasonError(dinnerCount: number): string | null {
  if (canCloseSeason(dinnerCount)) return null;
  return `Cannot close season. Season must have exactly 8 dinners (currently has ${dinnerCount})`;
}

/** True if this founder already organized a dinner in the season. */
export function organizerAlreadyUsed(
  existingOrganizerIds: readonly string[],
  organizerId: string
): boolean {
  return existingOrganizerIds.includes(organizerId);
}
