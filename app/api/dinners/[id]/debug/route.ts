import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET /api/dinners/:id/debug - Debug dinner state
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dinnerId } = await params;

    // Get dinner
    const { data: dinner, error: dinnerError } = await db
      .from("dinners")
      .select("*")
      .eq("id", dinnerId)
      .single();

    if (dinnerError || !dinner) {
      return NextResponse.json({ error: "Dinner not found" }, { status: 404 });
    }

    // Get bottles
    const { data: bottles, error: bottlesError } = await db
      .from("bottles")
      .select(
        `
        id,
        name,
        brought_by,
        brought_by_user:users!brought_by(id, name)
      `
      )
      .eq("dinner_id", dinnerId);

    if (bottlesError) {
      return NextResponse.json(
        { error: "Bottles error", details: bottlesError },
        { status: 500 }
      );
    }

    // Get ratings
    const { data: ratings, error: ratingsError } = await db
      .from("ratings")
      .select("*")
      .in(
        "bottle_id",
        bottles?.map((b) => b.id) || []
      );

    if (ratingsError) {
      return NextResponse.json(
        { error: "Ratings error", details: ratingsError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      dinner: {
        id: dinner.id,
        name: dinner.name,
        status: dinner.status,
        reveal_index: dinner.reveal_index,
      },
      bottles: bottles?.map((b) => ({
        id: b.id,
        name: b.name,
        brought_by: b.brought_by,
        brought_by_user: b.brought_by_user,
        ratings_count: ratings?.filter((r) => r.bottle_id === b.id).length || 0,
      })),
      total_ratings: ratings?.length || 0,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Debug failed", details: String(error) },
      { status: 500 }
    );
  }
}
