import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dinners, bottles } from "@/lib/schema";
import { eq, count } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

// GET /api/dinners/:id/reveal-status - Get current reveal state
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id: dinnerId } = await params;

    const [dinner] = await db.select().from(dinners).where(eq(dinners.id, dinnerId)).limit(1);

    if (!dinner) {
      return NextResponse.json({ error: "Dinner not found" }, { status: 404 });
    }

    const [{ value: totalBottles }] = await db
      .select({ value: count() })
      .from(bottles)
      .where(eq(bottles.dinner_id, dinnerId));

    const revealedCount = dinner.reveal_index || 0;
    const remainingCount = totalBottles - revealedCount;

    return NextResponse.json({
      success: true,
      status: dinner.status,
      totalBottles,
      revealedCount,
      remainingCount,
      isComplete: revealedCount >= totalBottles,
      canReveal: dinner.status === "ended" || dinner.status === "revealing",
    });
  } catch (error) {
    console.error("Get reveal status error:", error);
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}
