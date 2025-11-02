import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

// GET /api/dinners/:id/ratings - Get aggregated ratings for all bottles in a dinner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dinnerId } = await params;

    // Fetch all bottles with their ratings
    const { data: bottles, error: bottlesError } = await supabase
      .from("bottles")
      .select(
        `
        id,
        name,
        description,
        vintage,
        producer,
        wine_type,
        position,
        brought_by_user:users!brought_by(id, name)
      `
      )
      .eq("dinner_id", dinnerId)
      .order("position", { ascending: true });

    if (bottlesError) throw bottlesError;

    if (!bottles || bottles.length === 0) {
      return NextResponse.json({
        success: true,
        bottles: [],
        message: "No bottles found for this dinner",
      });
    }

    // Fetch ratings for all bottles
    const bottleIds = bottles.map((b) => b.id);
    const { data: ratings, error: ratingsError } = await supabase
      .from("ratings")
      .select(
        `
        *,
        user:users(id, name)
      `
      )
      .in("bottle_id", bottleIds);

    if (ratingsError) throw ratingsError;

    // Aggregate ratings by bottle
    const bottlesWithRatings = bottles.map((bottle) => {
      const bottleRatings =
        ratings?.filter((r) => r.bottle_id === bottle.id) || [];

      const totalPoints = bottleRatings.reduce((sum, r) => sum + r.score, 0);

      const averageScore =
        bottleRatings.length > 0 ? totalPoints / bottleRatings.length : 0;

      return {
        ...bottle,
        ratings: bottleRatings,
        stats: {
          total_ratings: bottleRatings.length,
          average_score: Math.round(averageScore * 10) / 10,
          total_points: Math.round(totalPoints * 10) / 10, // ADICIONADO
        },
      };
    });

    // Sort by average score (highest first)
    const sortedBottles = [...bottlesWithRatings].sort(
      (a, b) => b.stats.average_score - a.stats.average_score
    );

    return NextResponse.json({
      success: true,
      bottles: bottlesWithRatings, // Original order
      rankings: sortedBottles, // Sorted by score
      stats: {
        total_bottles: bottles.length,
        total_ratings: ratings?.length || 0,
      },
    });
  } catch (error) {
    console.error("Fetch dinner ratings error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to fetch dinner ratings", details: errorMessage },
      { status: 500 }
    );
  }
}
