import { db } from "@/lib/db";
import { seasons, dinners } from "@/lib/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function getSeasonStats() {
  // Replaces: supabase.from("season_stats").select("*")
  const result = await db
    .select({
      id: seasons.id,
      season_number: seasons.season_number,
      status: seasons.status,
      start_date: seasons.start_date,
      end_date: seasons.end_date,
      created_at: seasons.created_at,
      dinner_count: sql<number>`count(${dinners.id})::int`,
    })
    .from(seasons)
    .leftJoin(dinners, eq(dinners.season_id, seasons.id))
    .groupBy(seasons.id)
    .orderBy(desc(seasons.season_number));

  return result;
}
