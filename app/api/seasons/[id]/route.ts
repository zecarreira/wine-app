import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seasons, dinners, users } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireAuth } from "@/lib/middleware";

// GET /api/seasons/[id] - Get season details with dinners
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
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

    const createdByUser = alias(users, "created_by_user");

    const seasonDinners = await db
      .select({
        id: dinners.id,
        name: dinners.name,
        event_date: dinners.event_date,
        location: dinners.location,
        status: dinners.status,
        season_id: dinners.season_id,
        created_by: dinners.created_by,
        organizer_id: dinners.organizer_id,
        host_id: dinners.host_id,
        is_blind: dinners.is_blind,
        is_extra_dinner: dinners.is_extra_dinner,
        dinner_number_in_season: dinners.dinner_number_in_season,
        started_at: dinners.started_at,
        ended_at: dinners.ended_at,
        created_at: dinners.created_at,
        updated_at: dinners.updated_at,
        created_by_user: {
          id: createdByUser.id,
          name: createdByUser.name,
          email: createdByUser.email,
        },
      })
      .from(dinners)
      .leftJoin(createdByUser, eq(dinners.created_by, createdByUser.id))
      .where(eq(dinners.season_id, id))
      .orderBy(asc(dinners.dinner_number_in_season));

    return NextResponse.json({
      success: true,
      season: {
        ...season,
        dinners: seasonDinners,
      },
    });
  } catch (error) {
    console.error("Fetch season error:", error);
    return NextResponse.json(
      { error: "Failed to fetch season" },
      { status: 500 }
    );
  }
}
