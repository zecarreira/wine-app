import { describe, expect, it } from "vitest";
import {
  canCloseSeason,
  closeSeasonError,
  isExtraDinner,
  isSeasonFull,
  nextDinnerNumber,
  organizerAlreadyUsed,
} from "@/lib/domain/seasons";

/** R10 — Season capacity and close rules */
describe("R10 seasons", () => {
  it("isSeasonFull at >= 8", () => {
    expect(isSeasonFull(7)).toBe(false);
    expect(isSeasonFull(8)).toBe(true);
    expect(isSeasonFull(9)).toBe(true);
  });

  it("nextDinnerNumber and isExtraDinner", () => {
    expect(nextDinnerNumber(0)).toBe(1);
    expect(nextDinnerNumber(7)).toBe(8);
    expect(isExtraDinner(8)).toBe(true);
    expect(isExtraDinner(7)).toBe(false);
    expect(isExtraDinner(3, true)).toBe(true);
  });

  it("canCloseSeason only when exactly 8", () => {
    expect(canCloseSeason(8)).toBe(true);
    expect(canCloseSeason(7)).toBe(false);
    expect(closeSeasonError(8)).toBeNull();
    expect(closeSeasonError(5)).toBe(
      "Cannot close season. Season must have exactly 8 dinners (currently has 5)"
    );
  });

  it("organizerAlreadyUsed", () => {
    expect(organizerAlreadyUsed(["a", "b"], "a")).toBe(true);
    expect(organizerAlreadyUsed(["a", "b"], "c")).toBe(false);
  });
});
