import { describe, expect, it } from "vitest";
import { isValidScore, scoreValidationError } from "@/lib/domain/score";
import { SCORE_MAX, SCORE_MIN, SCORE_STEP } from "@/lib/domain/constants";

/** R01 — Score scale 1–10 step 0.5 */
describe("R01 score validation", () => {
  it("accepts boundary and mid scores on 0.5 steps", () => {
    for (const s of [1, 1.5, 5, 7.5, 10]) {
      expect(isValidScore(s)).toBe(true);
      expect(scoreValidationError(s)).toBeNull();
    }
  });

  it("rejects below min, above max, and non-step values", () => {
    expect(isValidScore(0)).toBe(false);
    expect(isValidScore(0.5)).toBe(false);
    expect(isValidScore(10.5)).toBe(false);
    expect(isValidScore(7.25)).toBe(false);
    expect(isValidScore(NaN)).toBe(false);
  });

  it("scoreValidationError messages", () => {
    expect(scoreValidationError(null)).toBe("Score is required");
    expect(scoreValidationError(undefined)).toBe("Score is required");
    expect(scoreValidationError("x")).toBe("Score must be a number");
    expect(scoreValidationError(0)).toBe(
      `Score must be between ${SCORE_MIN} and ${SCORE_MAX}`
    );
    expect(scoreValidationError(11)).toBe(
      `Score must be between ${SCORE_MIN} and ${SCORE_MAX}`
    );
    expect(scoreValidationError(7.25)).toBe(
      `Score must be in steps of ${SCORE_STEP}`
    );
  });
});
