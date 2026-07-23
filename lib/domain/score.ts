import { SCORE_MAX, SCORE_MIN, SCORE_STEP } from "./constants";

/** Score must be a finite number in [SCORE_MIN, SCORE_MAX] on SCORE_STEP increments. */
export function isValidScore(score: number): boolean {
  if (typeof score !== "number" || !Number.isFinite(score)) return false;
  if (score < SCORE_MIN || score > SCORE_MAX) return false;
  // Allow floating error: n * 2 should be (near) integer for 0.5 steps
  const steps = score / SCORE_STEP;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

/**
 * Returns a validation error message, or null if valid.
 * Accepts unknown so route handlers can pass body values directly.
 */
export function scoreValidationError(score: unknown): string | null {
  if (score === undefined || score === null || score === "") {
    return "Score is required";
  }

  const n = typeof score === "number" ? score : Number(score);
  if (!Number.isFinite(n)) {
    return "Score must be a number";
  }

  if (n < SCORE_MIN || n > SCORE_MAX) {
    return `Score must be between ${SCORE_MIN} and ${SCORE_MAX}`;
  }

  if (!isValidScore(n)) {
    return `Score must be in steps of ${SCORE_STEP}`;
  }

  return null;
}
