import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { authenticate } from "@/lib/middleware";

// GET /api/seasons/[id] - Get season details with dinners
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await authenticate(request);
    const { id } = await params;

    const { data: season, error: seasonError } = await supabase
      .from("seasons")
      .select("*")
      .eq("id", id)
      .single();

    if (seasonError) throw seasonError;

    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    const { data: dinners, error: dinnersError } = await supabase
      .from("dinners")
      .select(
        `
        *,
        created_by_user:users!created_by(id, name, email)
      `
      )
      .eq("season_id", id)
      .order("dinner_number_in_season", { ascending: true });

    if (dinnersError) throw dinnersError;

    return NextResponse.json({
      success: true,
      season: {
        ...season,
        dinners: dinners || [],
      },
    });
  } catch (error) {
    console.error("Fetch season error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to fetch season", details: errorMessage },
      { status: 500 }
    );
  }
}
