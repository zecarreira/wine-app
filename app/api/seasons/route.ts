import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seasons } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireFounder } from "@/lib/middleware";
import { getSeasonStats } from "@/lib/queries/seasons";

// GET /api/seasons - List all seasons
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const seasonStats = await getSeasonStats();

    return NextResponse.json({
      success: true,
      seasons: seasonStats,
    });
  } catch (error) {
    console.error("Fetch seasons error:", error);
    return NextResponse.json(
      { error: "Failed to fetch seasons" },
      { status: 500 }
    );
  }
}

// POST /api/seasons - Create new season (founder only)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireFounder(request);
    if (auth instanceof NextResponse) return auth;

    const [activeSeason] = await db
      .select()
      .from(seasons)
      .where(eq(seasons.status, "active"))
      .limit(1);

    if (activeSeason) {
      return NextResponse.json(
        { error: "There is already an active season. Close it first." },
        { status: 400 }
      );
    }

    const [lastSeason] = await db
      .select({ season_number: seasons.season_number })
      .from(seasons)
      .orderBy(desc(seasons.season_number))
      .limit(1);

    const nextSeasonNumber = lastSeason ? lastSeason.season_number + 1 : 1;

    const [newSeason] = await db
      .insert(seasons)
      .values({ season_number: nextSeasonNumber, status: "active" })
      .returning();

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
    return NextResponse.json(
      { error: "Failed to create season" },
      { status: 500 }
    );
  }
}
