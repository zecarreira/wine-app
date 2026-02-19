import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seasons, dinners, users } from "@/lib/schema";
import { eq, count } from "drizzle-orm";
import { authenticate } from "@/lib/middleware";

// POST /api/seasons/[id]/close - Close a season (founder/admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request);

    if (auth instanceof NextResponse) return auth;
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    if (!user || (user.role !== "founder" && user.role !== "admin")) {
      return NextResponse.json(
        { error: "Only founders and admins can close seasons" },
        { status: 403 }
      );
    }

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

    if (dinnerCount !== 8) {
      return NextResponse.json(
        {
          error: `Cannot close season. Season must have exactly 8 dinners (currently has ${dinnerCount})`,
        },
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
