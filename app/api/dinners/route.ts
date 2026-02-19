import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dinners, seasons, users } from "@/lib/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireFounder, authenticate } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  try {
    await authenticate(request);

    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get("seasonId");
    const onlyActive = searchParams.get("onlyActive") === "true";

    const createdByUser = alias(users, "created_by_user");
    const organizer = alias(users, "organizer");

    let seasonFilter: string | undefined = seasonId ?? undefined;

    if (onlyActive) {
      const [activeSeason] = await db
        .select({ id: seasons.id })
        .from(seasons)
        .where(eq(seasons.status, "active"))
        .limit(1);
      if (activeSeason) seasonFilter = activeSeason.id;
    }

    const query = db
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
      .orderBy(desc(dinners.event_date));

    const result = seasonFilter
      ? await query.where(eq(dinners.season_id, seasonFilter))
      : await query;

    return NextResponse.json({ success: true, dinners: result });
  } catch (error) {
    console.error("Fetch dinners error:", error);
    return NextResponse.json({ error: "Failed to fetch dinners" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireFounder(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { name, event_date, location, is_blind, is_extra, organizer_id } = body;

    if (!name || !event_date) {
      return NextResponse.json({ error: "Name and event date are required" }, { status: 400 });
    }
    if (!organizer_id) {
      return NextResponse.json({ error: "Organizer is required" }, { status: 400 });
    }

    if (isNaN(new Date(event_date).getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const [activeSeason] = await db
      .select()
      .from(seasons)
      .where(eq(seasons.status, "active"))
      .limit(1);

    if (!activeSeason) {
      return NextResponse.json(
        { error: "No active season found. Please create a new season first." },
        { status: 400 }
      );
    }

    const [organizer] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, organizer_id))
      .limit(1);

    if (!organizer) {
      return NextResponse.json({ error: "Invalid organizer selected" }, { status: 400 });
    }
    if (organizer.role !== "founder" && organizer.role !== "admin") {
      return NextResponse.json({ error: "Organizer must be a founder or admin" }, { status: 400 });
    }

    const [existingDinner] = await db
      .select({ id: dinners.id })
      .from(dinners)
      .where(and(eq(dinners.season_id, activeSeason.id), eq(dinners.organizer_id, organizer_id)))
      .limit(1);

    if (existingDinner) {
      return NextResponse.json(
        { error: "Este founder já organizou um jantar nesta temporada. Por favor escolhe outro organizador." },
        { status: 400 }
      );
    }

    const [{ value: dinnerCount }] = await db
      .select({ value: count() })
      .from(dinners)
      .where(eq(dinners.season_id, activeSeason.id));

    if (dinnerCount >= 8) {
      return NextResponse.json(
        { error: "Season is full (8 dinners maximum). Please close the current season and create a new one." },
        { status: 400 }
      );
    }

    const dinnerNumber = dinnerCount + 1;
    const isExtraDinner = is_extra === true || dinnerNumber === 8;

    const [newDinner] = await db
      .insert(dinners)
      .values({
        name,
        event_date,
        location: location || null,
        is_blind: is_blind || false,
        created_by: auth.userId,
        organizer_id,
        season_id: activeSeason.id,
        dinner_number_in_season: dinnerNumber,
        is_extra_dinner: isExtraDinner,
      })
      .returning();

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
    return NextResponse.json({ error: "Failed to create dinner" }, { status: 500 });
  }
}
