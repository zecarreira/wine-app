import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dinners, bottles } from "@/lib/schema";
import { eq, count } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

// POST /api/dinners/:id/start - Start blind tasting
export async function POST(
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

    if (dinner.host_id !== auth.userId && dinner.created_by !== auth.userId) {
      return NextResponse.json({ error: "Only the host can start this dinner" }, { status: 403 });
    }

    if (dinner.status !== "setup") {
      return NextResponse.json({ error: `Dinner is already ${dinner.status}` }, { status: 400 });
    }

    const [{ value: bottleCount }] = await db
      .select({ value: count() })
      .from(bottles)
      .where(eq(bottles.dinner_id, dinnerId));

    if (bottleCount === 0) {
      return NextResponse.json({ error: "Cannot start dinner without bottles" }, { status: 400 });
    }

    const [updatedDinner] = await db
      .update(dinners)
      .set({ status: "active", started_at: new Date(), updated_at: new Date() })
      .where(eq(dinners.id, dinnerId))
      .returning();

    return NextResponse.json({ success: true, message: "Blind tasting started! 🎭", dinner: updatedDinner });
  } catch (error) {
    console.error("Start dinner error:", error);
    return NextResponse.json({ error: "Failed to start dinner" }, { status: 500 });
  }
}
