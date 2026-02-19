import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seasons, dinners, users } from "@/lib/schema";
import { eq, inArray, isNotNull } from "drizzle-orm";
import { requireFounder } from "@/lib/middleware";

/**
 * GET /api/seasons/active/available-organizers
 * Returns list of founders who haven't organized a dinner in the active season yet
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireFounder(request);

    if (auth instanceof NextResponse) return auth;

    const [activeSeason] = await db
      .select({ id: seasons.id })
      .from(seasons)
      .where(eq(seasons.status, "active"))
      .limit(1);

    if (!activeSeason) {
      return NextResponse.json(
        { error: "No active season found" },
        { status: 400 }
      );
    }

    const founders = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(inArray(users.role, ["founder", "admin"]))
      .orderBy(users.name);

    const organizerRows = await db
      .select({ organizer_id: dinners.organizer_id })
      .from(dinners)
      .where(eq(dinners.season_id, activeSeason.id));

    const organizedSet = new Set(
      organizerRows
        .filter((d) => d.organizer_id !== null)
        .map((d) => d.organizer_id)
    );

    const availableFounders = founders.filter(
      (founder) => !organizedSet.has(founder.id)
    );

    return NextResponse.json({
      success: true,
      founders: availableFounders,
      count: availableFounders.length,
    });
  } catch (error) {
    console.error("Fetch available organizers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch available organizers" },
      { status: 500 }
    );
  }
}
