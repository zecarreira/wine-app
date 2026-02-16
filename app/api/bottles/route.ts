import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bottles, dinners, ratings, users } from "@/lib/schema";
import { eq, ilike, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get("sortBy") || "name";
    const order = searchParams.get("order") || "asc";
    const producer = searchParams.get("producer") || "";
    const wineType = searchParams.get("wineType") || "";

    const broughtByUser = alias(users, "brought_by_user");

    let query = db
      .select({
        id: bottles.id,
        name: bottles.name,
        producer: bottles.producer,
        vintage: bottles.vintage,
        wine_type: bottles.wine_type,
        description: bottles.description,
        photo_url: bottles.photo_url,
        dinner: { id: dinners.id, name: dinners.name, event_date: dinners.event_date },
        brought_by_user: { id: broughtByUser.id, name: broughtByUser.name },
        total_ratings: sql<number>`count(${ratings.id})::int`,
        average_rating: sql<number>`round(coalesce(avg(${ratings.score}), 0)::numeric, 1)::float`,
      })
      .from(bottles)
      .leftJoin(dinners, eq(bottles.dinner_id, dinners.id))
      .leftJoin(broughtByUser, eq(bottles.brought_by, broughtByUser.id))
      .leftJoin(ratings, eq(ratings.bottle_id, bottles.id))
      .groupBy(bottles.id, dinners.id, broughtByUser.id);

    const conditions = [];
    if (producer) conditions.push(ilike(bottles.producer, `%${producer}%`));
    if (wineType && wineType !== "all") conditions.push(eq(bottles.wine_type, wineType));

    const result = conditions.length > 0
      ? await query.where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`)
      : await query;

    // JS-side sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name": comparison = (a.name || "").localeCompare(b.name || ""); break;
        case "producer": comparison = (a.producer || "").localeCompare(b.producer || ""); break;
        case "rating": comparison = b.average_rating - a.average_rating; break;
        case "vintage": comparison = (b.vintage || 0) - (a.vintage || 0); break;
      }
      return order === "desc" ? -comparison : comparison;
    });

    const producers = [...new Set(result.map((b) => b.producer).filter(Boolean).sort() as string[])];

    return NextResponse.json({ success: true, bottles: result, producers, total: result.length });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
