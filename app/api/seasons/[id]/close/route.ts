import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { authenticate } from "@/lib/middleware";

// POST /api/seasons/[id]/close - Close a season (founder/admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request);

    if (auth instanceof NextResponse) {
      return auth;
    }

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is founder or admin
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", auth.userId)
      .single();

    if (!user || (user.role !== "founder" && user.role !== "admin")) {
      return NextResponse.json(
        { error: "Only founders and admins can close seasons" },
        { status: 403 }
      );
    }

    // Get the season
    const { data: season, error: seasonError } = await supabase
      .from("seasons")
      .select("*")
      .eq("id", id)
      .single();

    if (seasonError || !season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    if (season.status === "completed") {
      return NextResponse.json(
        { error: "Season is already closed" },
        { status: 400 }
      );
    }

    // Check if season has 8 dinners
    const { count } = await supabase
      .from("dinners")
      .select("*", { count: "exact", head: true })
      .eq("season_id", id);

    if (count !== 8) {
      return NextResponse.json(
        {
          error: `Cannot close season. Season must have exactly 8 dinners (currently has ${count})`,
        },
        { status: 400 }
      );
    }

    // Close the season
    const { data: closedSeason, error: updateError } = await supabase
      .from("seasons")
      .update({
        status: "completed",
        end_date: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: `Season ${season.season_number} closed successfully`,
      season: closedSeason,
    });
  } catch (error) {
    console.error("Close season error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to close season", details: errorMessage },
      { status: 500 }
    );
  }
}
