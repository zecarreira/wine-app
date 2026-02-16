import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bottles, dinners, ratings, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireAuth } from "@/lib/middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bottleId } = await params;
    const broughtByUser = alias(users, "brought_by_user");
    const dinnerHost = alias(users, "host");

    const [bottle] = await db
      .select({
        id: bottles.id,
        name: bottles.name,
        producer: bottles.producer,
        vintage: bottles.vintage,
        wine_type: bottles.wine_type,
        description: bottles.description,
        photo_url: bottles.photo_url,
        position: bottles.position,
        brought_by: bottles.brought_by,
        dinner_id: bottles.dinner_id,
        created_at: bottles.created_at,
        updated_at: bottles.updated_at,
        dinner_db_id: dinners.id,
        dinner_name: dinners.name,
        dinner_event_date: dinners.event_date,
        dinner_location: dinners.location,
        dinner_is_blind: dinners.is_blind,
        dinner_status: dinners.status,
        dinner_created_by: dinners.created_by,
        dinner_host_id: dinnerHost.id,
        dinner_host_name: dinnerHost.name,
        brought_by_user: { id: broughtByUser.id, name: broughtByUser.name },
      })
      .from(bottles)
      .leftJoin(dinners, eq(bottles.dinner_id, dinners.id))
      .leftJoin(dinnerHost, eq(dinners.created_by, dinnerHost.id))
      .leftJoin(broughtByUser, eq(bottles.brought_by, broughtByUser.id))
      .where(eq(bottles.id, bottleId))
      .limit(1);

    if (!bottle) {
      return NextResponse.json({ success: false, error: "Bottle not found" }, { status: 404 });
    }

    const ratingUser = alias(users, "user");
    const bottleRatings = await db
      .select({
        id: ratings.id,
        score: ratings.score,
        tasting_notes: ratings.tasting_notes,
        created_at: ratings.created_at,
        user: { id: ratingUser.id, name: ratingUser.name },
      })
      .from(ratings)
      .leftJoin(ratingUser, eq(ratings.user_id, ratingUser.id))
      .where(eq(ratings.bottle_id, bottleId));

    const totalRatings = bottleRatings.length;
    const averageScore = totalRatings > 0
      ? (bottleRatings.reduce((sum, r) => sum + Number(r.score), 0) / totalRatings).toFixed(1)
      : null;

    const { dinner_db_id, dinner_name, dinner_event_date, dinner_location, dinner_is_blind, dinner_status, dinner_created_by, dinner_host_id, dinner_host_name, ...bottleFields } = bottle;

    return NextResponse.json({
      success: true,
      bottle: {
        ...bottleFields,
        dinner: dinner_db_id ? { id: dinner_db_id, name: dinner_name, event_date: dinner_event_date, location: dinner_location, is_blind: dinner_is_blind, status: dinner_status, created_by: dinner_created_by, host: { id: dinner_host_id, name: dinner_host_name } } : null,
        ratings: bottleRatings,
        stats: { total_ratings: totalRatings, average_score: averageScore },
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id: bottleId } = await params;
    const body = await request.json();
    const { name, description, vintage, producer, wine_type, photo_url } = body;

    const [bottle] = await db
      .select({ id: bottles.id, brought_by: bottles.brought_by, dinner_id: bottles.dinner_id })
      .from(bottles)
      .where(eq(bottles.id, bottleId))
      .limit(1);

    if (!bottle) {
      return NextResponse.json({ error: "Bottle not found" }, { status: 404 });
    }

    const [dinner] = await db
      .select({ status: dinners.status })
      .from(dinners)
      .where(eq(dinners.id, bottle.dinner_id!))
      .limit(1);

    if (!dinner || dinner.status !== "setup") {
      return NextResponse.json(
        { error: "Apenas podes editar garrafas enquanto o jantar está em preparação (setup). O jantar já começou ou terminou." },
        { status: 400 }
      );
    }

    if (bottle.brought_by !== auth.userId) {
      return NextResponse.json({ error: "Não podes editar garrafas de outros utilizadores" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (vintage !== undefined) updateData.vintage = vintage;
    if (producer !== undefined) updateData.producer = producer;
    if (wine_type !== undefined) updateData.wine_type = wine_type;
    if (photo_url !== undefined) updateData.photo_url = photo_url;

    const [updatedBottle] = await db
      .update(bottles)
      .set(updateData)
      .where(eq(bottles.id, bottleId))
      .returning();

    return NextResponse.json({ success: true, message: "Garrafa atualizada com sucesso", bottle: updatedBottle });
  } catch (error) {
    console.error("Update bottle error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: "Failed to update bottle", details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id: bottleId } = await params;

    const [bottle] = await db
      .select({ id: bottles.id, brought_by: bottles.brought_by, dinner_id: bottles.dinner_id })
      .from(bottles)
      .where(eq(bottles.id, bottleId))
      .limit(1);

    if (!bottle) {
      return NextResponse.json({ error: "Bottle not found" }, { status: 404 });
    }

    const [dinner] = await db
      .select({ status: dinners.status })
      .from(dinners)
      .where(eq(dinners.id, bottle.dinner_id!))
      .limit(1);

    if (!dinner || dinner.status !== "setup") {
      return NextResponse.json(
        { error: "Apenas podes apagar garrafas enquanto o jantar está em preparação (setup). O jantar já começou ou terminou." },
        { status: 400 }
      );
    }

    if (bottle.brought_by !== auth.userId) {
      return NextResponse.json({ error: "Não podes apagar garrafas de outros utilizadores" }, { status: 403 });
    }

    await db.delete(bottles).where(eq(bottles.id, bottleId));

    return NextResponse.json({ success: true, message: "Garrafa apagada com sucesso" });
  } catch (error) {
    console.error("Delete bottle error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: "Failed to delete bottle", details: errorMessage }, { status: 500 });
  }
}
