import { describe, expect, it } from "vitest";
import { blindLabel, shuffleArray } from "@/lib/domain/blind";

/** R07 — Blind tasting labels + deterministic shuffle */
describe("R07 blind", () => {
  it("blindLabel maps 0,1,2 to A,B,C", () => {
    expect(blindLabel(0)).toBe("A");
    expect(blindLabel(1)).toBe("B");
    expect(blindLabel(2)).toBe("C");
  });

  it("shuffleArray is deterministic for same seed", () => {
    const input = [1, 2, 3, 4, 5, 6];
    const a = shuffleArray(input, "dinner-seed");
    const b = shuffleArray(input, "dinner-seed");
    expect(a).toEqual(b);
    expect(a).not.toEqual(input); // likely shuffled (or equal only if n small)
    // original not mutated
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("different seeds produce different orders (usually)", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const a = shuffleArray(input, "seed-a");
    const b = shuffleArray(input, "seed-b");
    expect(a).not.toEqual(b);
  });

  it("never produces negative indices (all elements preserved)", () => {
    const input = ["a", "b", "c", "d", "e"];
    const out = shuffleArray(input, "x");
    expect(out).toHaveLength(input.length);
    expect(new Set(out)).toEqual(new Set(input));
    expect(out.every((x) => x !== undefined)).toBe(true);
  });
});
