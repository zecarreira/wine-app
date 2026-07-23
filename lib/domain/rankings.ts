/** Round to 1 decimal place (half-up via Math.round). */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export type BottleStats = {
  total_ratings: number;
  average_score: number;
  total_points: number;
  highest_rating: number;
};

export function computeBottleStats(scores: number[]): BottleStats {
  const total_ratings = scores.length;
  if (total_ratings === 0) {
    return {
      total_ratings: 0,
      average_score: 0,
      total_points: 0,
      highest_rating: 0,
    };
  }

  const totalPoints = scores.reduce((sum, s) => sum + s, 0);
  const averageScore = totalPoints / total_ratings;
  const highestRating = Math.max(...scores);

  return {
    total_ratings,
    average_score: round1(averageScore),
    total_points: round1(totalPoints),
    highest_rating: highestRating,
  };
}

export type RankingComparable = {
  average_score: number;
  total_points: number;
  highest_rating: number;
};

/** Best first: avg desc, then total_points desc, then highest_rating desc. */
export function compareRankingsBestFirst(
  a: RankingComparable,
  b: RankingComparable
): number {
  if (b.average_score !== a.average_score) {
    return b.average_score - a.average_score;
  }
  if (b.total_points !== a.total_points) {
    return b.total_points - a.total_points;
  }
  return b.highest_rating - a.highest_rating;
}

export function sortRankingsBestFirst<T extends { stats: RankingComparable }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => compareRankingsBestFirst(a.stats, b.stats));
}

/** Worst → best by average only (used for reveal ceremony order). */
export function sortWorstToBestByAverage<
  T extends { stats: { average_score: number } },
>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => a.stats.average_score - b.stats.average_score
  );
}
