import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bottleId } = await params;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get bottle with all related data
    const { data: bottle, error } = await supabase
      .from("bottles")
      .select(
        `
        *,
        dinner:dinners(
          id, 
          name, 
          event_date, 
          location, 
          is_blind, 
          status,
          created_by,
          host:users!dinners_created_by_fkey(id, name)
        ),
        brought_by_user:users!bottles_brought_by_fkey(id, name),
        ratings(
          id,
          score,
          tasting_notes,
          created_at,
          user:users(id, name)
        )
      `
      )
      .eq("id", bottleId)
      .single();

    if (error) {
      console.error("Error fetching bottle:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Bottle not found",
        },
        { status: 404 }
      );
    }

    // Calculate stats
    const ratings = bottle.ratings || [];
    const totalRatings = ratings.length;
    const averageScore =
      totalRatings > 0
        ? (
            ratings.reduce((sum: number, r: any) => sum + r.score, 0) /
            totalRatings
          ).toFixed(1)
        : null;

    return NextResponse.json({
      success: true,
      bottle: {
        ...bottle,
        stats: {
          total_ratings: totalRatings,
          average_score: averageScore,
        },
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
