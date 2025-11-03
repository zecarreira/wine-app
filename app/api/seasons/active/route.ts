import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { authenticate } from "@/lib/middleware";

// GET /api/seasons/active - Get active season with dinners
export async function GET(request: NextRequest) {
  try {
    await authenticate(request);

    const { data: activeSeason, error: seasonError } = await supabase
      .from("seasons")
      .select("*")
      .eq("status", "active")
      .single();

    if (seasonError || !activeSeason) {
      return NextResponse.json({
        success: true,
        season: null,
        message: "No active season found",
      });
    }

    // Get dinners for active season
    const { data: dinners, error: dinnersError } = await supabase
      .from("dinners")
      .select(
        `
        *,
        created_by_user:users!created_by(id, name, email)
      `
      )
      .eq("season_id", activeSeason.id)
      .order("dinner_number_in_season", { ascending: true });

    if (dinnersError) throw dinnersError;

    // Get stats
    const totalDinners = dinners?.length || 0;
    const regularDinners =
      dinners?.filter((d) => !d.is_extra_dinner).length || 0;
    const hasExtraDinner = dinners?.some((d) => d.is_extra_dinner) || false;

    return NextResponse.json({
      success: true,
      season: {
        ...activeSeason,
        dinners: dinners || [],
        stats: {
          total_dinners: totalDinners,
          regular_dinners: regularDinners,
          extra_dinners: hasExtraDinner ? 1 : 0,
          is_full: totalDinners >= 8,
          can_close: totalDinners === 8,
        },
      },
    });
  } catch (error) {
    console.error("Fetch active season error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to fetch active season", details: errorMessage },
      { status: 500 }
    );
  }
}
