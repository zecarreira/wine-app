import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bottles, dinners, ratings, users } from "@/lib/schema";
import { eq, ilike, sql, asc, desc, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireAuth } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get("sortBy") || "name";
    const order = searchParams.get("order") || "asc";
    const producer = searchParams.get("producer") || "";
    const wineType = searchParams.get("wineType") || "";

    const broughtByUser = alias(users, "brought_by_user");
    const avgRating = sql<number>`round(coalesce(avg(${ratings.score}), 0)::numeric, 1)::float`;

    const orderDir = order === "desc" ? desc : asc;
    let orderExpr;
    switch (sortBy) {
      case "producer": orderExpr = orderDir(bottles.producer); break;
      case "rating": orderExpr = orderDir(avgRating); break;
      case "vintage": orderExpr = orderDir(bottles.vintage); break;
      default: orderExpr = orderDir(bottles.name);
    }

    const whereConditions = [];
    if (producer) whereConditions.push(ilike(bottles.producer, `%${producer}%`));
    if (wineType && wineType !== "all") whereConditions.push(eq(bottles.wine_type, wineType));

    const baseQuery = db
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
        average_rating: avgRating,
      })
      .from(bottles)
      .leftJoin(dinners, eq(bottles.dinner_id, dinners.id))
      .leftJoin(broughtByUser, eq(bottles.brought_by, broughtByUser.id))
      .leftJoin(ratings, eq(ratings.bottle_id, bottles.id))
      .groupBy(bottles.id, dinners.id, broughtByUser.id)
      .orderBy(orderExpr);

    const result = whereConditions.length > 0
      ? await baseQuery.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions))
      : await baseQuery;

    const producers = [...new Set(result.map((b) => b.producer).filter(Boolean).sort() as string[])];

    return NextResponse.json({ success: true, bottles: result, producers, total: result.length });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
