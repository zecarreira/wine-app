import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dinners, bottles, ratings, users } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

// GET /api/dinners/:id/debug - Debug dinner state
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dinnerId } = await params;

    // Get dinner
    const [dinner] = await db
      .select()
      .from(dinners)
      .where(eq(dinners.id, dinnerId));

    if (!dinner) {
      return NextResponse.json({ error: "Dinner not found" }, { status: 404 });
    }

    // Get bottles with brought_by user
    const broughtByUser = alias(users, "brought_by_user");
    const dinnerBottles = await db
      .select({
        id: bottles.id,
        name: bottles.name,
        brought_by: bottles.brought_by,
        brought_by_user: { id: broughtByUser.id, name: broughtByUser.name },
      })
      .from(bottles)
      .leftJoin(broughtByUser, eq(bottles.brought_by, broughtByUser.id))
      .where(eq(bottles.dinner_id, dinnerId));

    // Get ratings
    const bottleIds = dinnerBottles.map((b) => b.id);
    const allRatings =
      bottleIds.length > 0
        ? await db
            .select()
            .from(ratings)
            .where(inArray(ratings.bottle_id, bottleIds))
        : [];

    return NextResponse.json({
      dinner: {
        id: dinner.id,
        name: dinner.name,
        status: dinner.status,
        reveal_index: dinner.reveal_index,
      },
      bottles: dinnerBottles.map((b) => ({
        id: b.id,
        name: b.name,
        brought_by: b.brought_by,
        brought_by_user: b.brought_by_user,
        ratings_count: allRatings.filter((r) => r.bottle_id === b.id).length,
      })),
      total_ratings: allRatings.length,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Debug failed", details: String(error) },
      { status: 500 }
    );
  }
}
