import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { authenticate } from "@/lib/middleware";

// GET /api/seasons - List all seasons
export async function GET(request: NextRequest) {
  try {
    await authenticate(request);

    const { data: seasons, error } = await supabase
      .from("season_stats")
      .select("*")
      .order("season_number", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      seasons: seasons || [],
    });
  } catch (error) {
    console.error("Fetch seasons error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to fetch seasons", details: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/seasons - Create new season (founder only)
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);

    if (auth instanceof NextResponse) {
      return auth;
    }

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is founder or admin
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", auth.userId)
      .single();

    if (!user || (user.role !== "founder" && user.role !== "admin")) {
      return NextResponse.json(
        { error: "Only founders and admins can create seasons" },
        { status: 403 }
      );
    }

    // Check if there's already an active season
    const { data: activeSeason } = await supabase
      .from("seasons")
      .select("*")
      .eq("status", "active")
      .single();

    if (activeSeason) {
      return NextResponse.json(
        { error: "There is already an active season. Close it first." },
        { status: 400 }
      );
    }

    // Get the next season number
    const { data: lastSeason } = await supabase
      .from("seasons")
      .select("season_number")
      .order("season_number", { ascending: false })
      .limit(1)
      .single();

    const nextSeasonNumber = lastSeason ? lastSeason.season_number + 1 : 1;

    // Create new season
    const { data: newSeason, error: insertError } = await supabase
      .from("seasons")
      .insert({
        season_number: nextSeasonNumber,
        status: "active",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(
      {
        success: true,
        message: `Season ${nextSeasonNumber} created successfully`,
        season: newSeason,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create season error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to create season", details: errorMessage },
      { status: 500 }
    );
  }
}
