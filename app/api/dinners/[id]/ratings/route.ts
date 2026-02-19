import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bottles, ratings, users } from "@/lib/schema";
import { eq, inArray, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

// GET /api/dinners/:id/ratings - Get aggregated ratings for all bottles in a dinner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dinnerId } = await params;

    const broughtByUser = alias(users, "brought_by_user");

    const dinnerBottles = await db
      .select({
        id: bottles.id,
        name: bottles.name,
        description: bottles.description,
        vintage: bottles.vintage,
        producer: bottles.producer,
        wine_type: bottles.wine_type,
        position: bottles.position,
        brought_by_user: { id: broughtByUser.id, name: broughtByUser.name },
      })
      .from(bottles)
      .leftJoin(broughtByUser, eq(bottles.brought_by, broughtByUser.id))
      .where(eq(bottles.dinner_id, dinnerId))
      .orderBy(asc(bottles.position));

    if (dinnerBottles.length === 0) {
      return NextResponse.json({ success: true, bottles: [], message: "No bottles found for this dinner" });
    }

    const bottleIds = dinnerBottles.map((b) => b.id);
    const ratingUser = alias(users, "user");

    const allRatings = await db
      .select({
        id: ratings.id,
        bottle_id: ratings.bottle_id,
        user_id: ratings.user_id,
        score: ratings.score,
        tasting_notes: ratings.tasting_notes,
        created_at: ratings.created_at,
        updated_at: ratings.updated_at,
        user: { id: ratingUser.id, name: ratingUser.name },
      })
      .from(ratings)
      .leftJoin(ratingUser, eq(ratings.user_id, ratingUser.id))
      .where(inArray(ratings.bottle_id, bottleIds));

    const bottlesWithRatings = dinnerBottles.map((bottle) => {
      const bottleRatings = allRatings.filter((r) => r.bottle_id === bottle.id);
      const totalPoints = bottleRatings.reduce((sum, r) => sum + Number(r.score), 0);
      const averageScore = bottleRatings.length > 0 ? totalPoints / bottleRatings.length : 0;
      const highestRating = bottleRatings.length > 0 ? Math.max(...bottleRatings.map((r) => Number(r.score))) : 0;

      return {
        ...bottle,
        ratings: bottleRatings,
        stats: {
          total_ratings: bottleRatings.length,
          average_score: Math.round(averageScore * 10) / 10,
          total_points: Math.round(totalPoints * 10) / 10,
          highest_rating: highestRating,
        },
      };
    });

    const sortedBottles = [...bottlesWithRatings].sort((a, b) => {
      if (b.stats.average_score !== a.stats.average_score) return b.stats.average_score - a.stats.average_score;
      if (b.stats.total_points !== a.stats.total_points) return b.stats.total_points - a.stats.total_points;
      return b.stats.highest_rating - a.stats.highest_rating;
    });

    return NextResponse.json({
      success: true,
      bottles: bottlesWithRatings,
      rankings: sortedBottles,
      stats: { total_bottles: dinnerBottles.length, total_ratings: allRatings.length },
    });
  } catch (error) {
    console.error("Fetch dinner ratings error:", error);
    return NextResponse.json({ error: "Failed to fetch dinner ratings" }, { status: 500 });
  }
}
