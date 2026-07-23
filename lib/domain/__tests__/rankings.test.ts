import { describe, expect, it } from "vitest";
import {
  compareRankingsBestFirst,
  computeBottleStats,
  round1,
  sortRankingsBestFirst,
  sortWorstToBestByAverage,
} from "@/lib/domain/rankings";

/** R03 — Rankings: stats + tiebreakers + worst-to-best */
describe("R03 rankings", () => {
  it("round1 rounds to one decimal", () => {
    expect(round1(8.14)).toBe(8.1);
    expect(round1(8.15)).toBe(8.2);
    expect(round1(0)).toBe(0);
  });

  it("computeBottleStats aggregates scores", () => {
    expect(computeBottleStats([])).toEqual({
      total_ratings: 0,
      average_score: 0,
      total_points: 0,
      highest_rating: 0,
    });
    expect(computeBottleStats([8, 9, 7])).toEqual({
      total_ratings: 3,
      average_score: 8,
      total_points: 24,
      highest_rating: 9,
    });
    expect(computeBottleStats([8.5, 9])).toEqual({
      total_ratings: 2,
      average_score: 8.8,
      total_points: 17.5,
      highest_rating: 9,
    });
  });

  it("compare/sort best-first uses avg, total_points, highest_rating", () => {
    const items = [
      { id: "a", stats: { average_score: 8, total_points: 24, highest_rating: 9 } },
      { id: "b", stats: { average_score: 8, total_points: 24, highest_rating: 10 } },
      { id: "c", stats: { average_score: 9, total_points: 18, highest_rating: 9 } },
      { id: "d", stats: { average_score: 8, total_points: 32, highest_rating: 8 } },
    ];
    expect(compareRankingsBestFirst(items[0].stats, items[1].stats)).toBeGreaterThan(0);
    const sorted = sortRankingsBestFirst(items).map((x) => x.id);
    expect(sorted).toEqual(["c", "d", "b", "a"]);
  });

  it("sortWorstToBestByAverage only uses average", () => {
    const items = [
      { id: "high", stats: { average_score: 9 } },
      { id: "low", stats: { average_score: 6 } },
      { id: "mid", stats: { average_score: 7.5 } },
    ];
    expect(sortWorstToBestByAverage(items).map((x) => x.id)).toEqual([
      "low",
      "mid",
      "high",
    ]);
  });
});
