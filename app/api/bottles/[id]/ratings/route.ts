import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { requireAuth } from "@/lib/middleware";

// GET /api/bottles/:id/ratings - Get all ratings for a bottle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bottleId } = await params;

    // Fetch ratings with user info
    const { data: ratings, error } = await supabase
      .from("ratings")
      .select(
        `
        *,
        user:users(id, name)
      `
      )
      .eq("bottle_id", bottleId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Calculate average score
    const averageScore =
      ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
        : 0;

    return NextResponse.json({
      success: true,
      ratings: ratings || [],
      stats: {
        total_ratings: ratings?.length || 0,
        average_score: Math.round(averageScore * 10) / 10, // Round to 1 decimal
      },
    });
  } catch (error) {
    console.error("Fetch ratings error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to fetch ratings", details: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/bottles/:id/ratings - Submit a rating
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const auth = await requireAuth(request);

    if (auth instanceof NextResponse) {
      return auth;
    }

    const { id: bottleId } = await params;
    const body = await request.json();
    const { score, tasting_notes } = body;

    // Validate score
    if (score === undefined || score === null) {
      return NextResponse.json({ error: "Score is required" }, { status: 400 });
    }

    if (score < 1 || score > 10) {
      return NextResponse.json(
        { error: "Score must be between 1 and 10" },
        { status: 400 }
      );
    }

    // Check if bottle exists
    const { data: bottle, error: bottleError } = await supabase
      .from("bottles")
      .select("id")
      .eq("id", bottleId)
      .single();

    if (bottleError || !bottle) {
      return NextResponse.json({ error: "Bottle not found" }, { status: 404 });
    }

    // Check if user already rated this bottle
    const { data: existingRating } = await supabase
      .from("ratings")
      .select("id")
      .eq("bottle_id", bottleId)
      .eq("user_id", auth.userId)
      .single();

    if (existingRating) {
      // Update existing rating
      const { data: updatedRating, error: updateError } = await supabase
        .from("ratings")
        .update({
          score,
          tasting_notes: tasting_notes || null,
        })
        .eq("id", existingRating.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: "Rating updated successfully",
        rating: updatedRating,
      });
    } else {
      // Insert new rating
      const { data: newRating, error: insertError } = await supabase
        .from("ratings")
        .insert({
          bottle_id: bottleId,
          user_id: auth.userId,
          score,
          tasting_notes: tasting_notes || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return NextResponse.json(
        {
          success: true,
          message: "Rating submitted successfully",
          rating: newRating,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Submit rating error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to submit rating", details: errorMessage },
      { status: 500 }
    );
  }
}
