import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dinners, seasons, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireAuth } from "@/lib/middleware";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id: dinnerId } = await params;

    if (!UUID_REGEX.test(dinnerId)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const createdByUser = alias(users, "created_by_user");
    const organizer = alias(users, "organizer");

    const [dinner] = await db
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
        is_completed: dinners.is_completed,
        reveal_index: dinners.reveal_index,
        started_at: dinners.started_at,
        ended_at: dinners.ended_at,
        created_at: dinners.created_at,
        updated_at: dinners.updated_at,
        created_by_user: { id: createdByUser.id, name: createdByUser.name, email: createdByUser.email },
        organizer: { id: organizer.id, name: organizer.name },
        season: { id: seasons.id, season_number: seasons.season_number, status: seasons.status },
      })
      .from(dinners)
      .leftJoin(createdByUser, eq(dinners.created_by, createdByUser.id))
      .leftJoin(organizer, eq(dinners.organizer_id, organizer.id))
      .leftJoin(seasons, eq(dinners.season_id, seasons.id))
      .where(eq(dinners.id, dinnerId))
      .limit(1);

    if (!dinner) {
      return NextResponse.json({ success: false, error: "Dinner not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, dinner });
  } catch (error) {
    console.error("Fetch dinner error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
