import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dinners } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

// POST /api/dinners/:id/end - End dinner and prepare for reveal
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
      return NextResponse.json({ error: "Only the host can end this dinner" }, { status: 403 });
    }

    if (dinner.status !== "active") {
      return NextResponse.json(
        { error: `Cannot end dinner in ${dinner.status} state` },
        { status: 400 }
      );
    }

    const [updatedDinner] = await db
      .update(dinners)
      .set({ status: "ended", ended_at: new Date(), is_completed: true, updated_at: new Date() })
      .where(eq(dinners.id, dinnerId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Dinner ended! Ready for reveal 🎉",
      dinner: updatedDinner,
    });
  } catch (error) {
    console.error("End dinner error:", error);
    return NextResponse.json({ error: "Failed to end dinner" }, { status: 500 });
  }
}
