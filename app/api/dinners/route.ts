import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { requireFounder, authenticate } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  try {
    await authenticate(request);

    // Get query params to filter by season
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get("seasonId");
    const onlyActive = searchParams.get("onlyActive") === "true";

    let query = supabase.from("dinners").select(
      `
        *,
        created_by_user:users!created_by(id, name, email),
        season:seasons(id, season_number, status)
      `
    );

    if (seasonId) {
      query = query.eq("season_id", seasonId);
    }

    if (onlyActive) {
      // Get active season first
      const { data: activeSeason } = await supabase
        .from("seasons")
        .select("id")
        .eq("status", "active")
        .single();

      if (activeSeason) {
        query = query.eq("season_id", activeSeason.id);
      }
    }

    const { data: dinners, error } = await query.order("event_date", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      dinners: dinners || [],
    });
  } catch (error) {
    console.error("Fetch dinners error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to fetch dinners", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireFounder(request);

    if (auth instanceof NextResponse) {
      return auth;
    }

    const body = await request.json();
    const { name, event_date, location, is_blind, is_extra } = body;

    if (!name || !event_date) {
      return NextResponse.json(
        { error: "Name and event date are required" },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(event_date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Get active season
    const { data: activeSeason, error: seasonError } = await supabase
      .from("seasons")
      .select("*")
      .eq("status", "active")
      .single();

    if (seasonError || !activeSeason) {
      return NextResponse.json(
        {
          error: "No active season found. Please create a new season first.",
        },
        { status: 400 }
      );
    }

    // Count dinners in active season
    const { count, error: countError } = await supabase
      .from("dinners")
      .select("*", { count: "exact", head: true })
      .eq("season_id", activeSeason.id);

    if (countError) throw countError;

    if (count && count >= 8) {
      return NextResponse.json(
        {
          error:
            "Season is full (8 dinners maximum). Please close the current season and create a new one.",
        },
        { status: 400 }
      );
    }

    const dinnerNumber = (count || 0) + 1;
    const isExtraDinner = is_extra === true || dinnerNumber === 8;

    const { data: newDinner, error: insertError } = await supabase
      .from("dinners")
      .insert({
        name,
        event_date,
        location: location || null,
        is_blind: is_blind || false,
        created_by: auth.userId,
        season_id: activeSeason.id,
        dinner_number_in_season: dinnerNumber,
        is_extra_dinner: isExtraDinner,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(
      {
        success: true,
        message: `Dinner created successfully (${dinnerNumber}/8 in Season ${activeSeason.season_number})`,
        dinner: newDinner,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create dinner error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to create dinner", details: errorMessage },
      { status: 500 }
    );
  }
}
