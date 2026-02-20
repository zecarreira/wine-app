import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bottles, ratings, users } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireAuth } from "@/lib/middleware";

// GET /api/bottles/:id/ratings - Get all ratings for a bottle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id: bottleId } = await params;
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
      .where(eq(ratings.bottle_id, bottleId))
      .orderBy(desc(ratings.created_at));

    const averageScore = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + Number(r.score), 0) / allRatings.length
      : 0;

    return NextResponse.json({
      success: true,
      ratings: allRatings,
      stats: {
        total_ratings: allRatings.length,
        average_score: Math.round(averageScore * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Fetch ratings error:", error);
    return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 });
  }
}

// POST /api/bottles/:id/ratings - Submit a rating
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id: bottleId } = await params;
    const body = await request.json();
    const { score, tasting_notes } = body;

    if (score === undefined || score === null) {
      return NextResponse.json({ error: "Score is required" }, { status: 400 });
    }
    if (score < 0 || score > 10) {
      return NextResponse.json({ error: "Score must be between 0 and 10" }, { status: 400 });
    }

    const [bottle] = await db.select({ id: bottles.id }).from(bottles).where(eq(bottles.id, bottleId)).limit(1);
    if (!bottle) {
      return NextResponse.json({ error: "Bottle not found" }, { status: 404 });
    }

    const [existingRating] = await db
      .select({ id: ratings.id })
      .from(ratings)
      .where(and(eq(ratings.bottle_id, bottleId), eq(ratings.user_id, auth.userId)))
      .limit(1);

    if (existingRating) {
      const [updatedRating] = await db
        .update(ratings)
        .set({ score: String(score), tasting_notes: tasting_notes || null, updated_at: new Date() })
        .where(eq(ratings.id, existingRating.id))
        .returning();

      return NextResponse.json({ success: true, message: "Rating updated successfully", rating: updatedRating });
    } else {
      const [newRating] = await db
        .insert(ratings)
        .values({ bottle_id: bottleId, user_id: auth.userId, score: String(score), tasting_notes: tasting_notes || null })
        .returning();

      return NextResponse.json(
        { success: true, message: "Rating submitted successfully", rating: newRating },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Submit rating error:", error);
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 });
  }
}
