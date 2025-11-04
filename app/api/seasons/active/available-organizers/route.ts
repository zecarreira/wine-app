import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { requireFounder } from "@/lib/middleware";

/**
 * GET /api/seasons/active/available-organizers
 * Returns list of founders who haven't organized a dinner in the active season yet
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireFounder(request);

    if (auth instanceof NextResponse) {
      return auth;
    }

    // Get active season
    const { data: activeSeason, error: seasonError } = await supabase
      .from("seasons")
      .select("id")
      .eq("status", "active")
      .single();

    if (seasonError || !activeSeason) {
      return NextResponse.json(
        { error: "No active season found" },
        { status: 400 }
      );
    }

    // Get all founders and admins (admins are also founders)
    const { data: founders, error: foundersError } = await supabase
      .from("users")
      .select("id, name, email")
      .in("role", ["founder", "admin"])
      .order("name");

    if (foundersError) throw foundersError;

    // Get founders who already organized in this season
    const { data: organizerIds, error: organizersError } = await supabase
      .from("dinners")
      .select("organizer_id")
      .eq("season_id", activeSeason.id)
      .not("organizer_id", "is", null);

    if (organizersError) throw organizersError;

    // Create set of organizer IDs for fast lookup
    const organizedSet = new Set(
      (organizerIds || []).map((d) => d.organizer_id)
    );

    // Filter out founders who already organized
    const availableFounders = (founders || []).filter(
      (founder) => !organizedSet.has(founder.id)
    );

    return NextResponse.json({
      success: true,
      founders: availableFounders,
      count: availableFounders.length,
    });
  } catch (error) {
    console.error("Fetch available organizers error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to fetch available organizers", details: errorMessage },
      { status: 500 }
    );
  }
}
