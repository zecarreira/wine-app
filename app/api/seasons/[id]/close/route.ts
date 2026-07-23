import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seasons, dinners } from "@/lib/schema";
import { eq, count } from "drizzle-orm";
import { requireFounder } from "@/lib/middleware";
import { canCloseSeason, closeSeasonError } from "@/lib/domain";

// POST /api/seasons/[id]/close - Close a season (founder/admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireFounder(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const [season] = await db
      .select()
      .from(seasons)
      .where(eq(seasons.id, id))
      .limit(1);

    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    if (season.status === "completed") {
      return NextResponse.json(
        { error: "Season is already closed" },
        { status: 400 }
      );
    }

    const [{ value: dinnerCount }] = await db
      .select({ value: count() })
      .from(dinners)
      .where(eq(dinners.season_id, id));

    if (!canCloseSeason(dinnerCount)) {
      return NextResponse.json(
        { error: closeSeasonError(dinnerCount) },
        { status: 400 }
      );
    }

    const [closedSeason] = await db
      .update(seasons)
      .set({ status: "completed", end_date: new Date(), updated_at: new Date() })
      .where(eq(seasons.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Season ${season.season_number} closed successfully`,
      season: closedSeason,
    });
  } catch (error) {
    console.error("Close season error:", error);
    return NextResponse.json(
      { error: "Failed to close season" },
      { status: 500 }
    );
  }
}
