import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seasons, dinners, users } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireAuth } from "@/lib/middleware";

// GET /api/seasons/active - Get active season with dinners
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const [activeSeason] = await db
      .select()
      .from(seasons)
      .where(eq(seasons.status, "active"))
      .limit(1);

    if (!activeSeason) {
      return NextResponse.json({
        success: true,
        season: null,
        message: "No active season found",
      });
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
      .where(eq(dinners.season_id, activeSeason.id))
      .orderBy(asc(dinners.dinner_number_in_season));

    const totalDinners = seasonDinners.length;
    const regularDinners = seasonDinners.filter((d) => !d.is_extra_dinner).length;
    const hasExtraDinner = seasonDinners.some((d) => d.is_extra_dinner);

    return NextResponse.json({
      success: true,
      season: {
        ...activeSeason,
        dinners: seasonDinners,
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
    return NextResponse.json(
      { error: "Failed to fetch active season" },
      { status: 500 }
    );
  }
}
