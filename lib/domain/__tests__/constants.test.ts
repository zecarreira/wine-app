import { describe, expect, it } from "vitest";
import {
  BASE_PIPAS,
  MAX_BOTTLES_DEFAULT,
  MAX_BOTTLES_ORGANIZER,
  MAX_FOUNDERS,
  MAX_SEASON_DINNERS,
  SCORE_MAX,
  SCORE_MIN,
  SCORE_STEP,
} from "@/lib/domain/constants";

/** R15 — Domain constants match product rules */
describe("R15 constants", () => {
  it("exports expected product constants", () => {
    expect(MAX_SEASON_DINNERS).toBe(8);
    expect(BASE_PIPAS).toBe(10);
    expect(MAX_FOUNDERS).toBe(7);
    expect(SCORE_MIN).toBe(1);
    expect(SCORE_MAX).toBe(10);
    expect(SCORE_STEP).toBe(0.5);
    expect(MAX_BOTTLES_ORGANIZER).toBe(2);
    expect(MAX_BOTTLES_DEFAULT).toBe(1);
  });
});
