import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dinners } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";
import { canEndDinner, isDinnerHost } from "@/lib/domain";
import { onDinnerRealized } from "@/lib/services/deadline";

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

    if (!isDinnerHost(auth.userId, { host_id: dinner.host_id, created_by: dinner.created_by }, auth.userRole === "admin")) {
      return NextResponse.json({ error: "Only the host can end this dinner" }, { status: 403 });
    }

    const endCheck = canEndDinner(dinner.status, !!dinner.is_extra_dinner);
    if (!endCheck.ok) {
      return NextResponse.json({ error: endCheck.error }, { status: 400 });
    }

    // Jantar extra: passa diretamente de "setup"/"active" para "completed"
    if (dinner.is_extra_dinner) {
      const [updatedDinner] = await db
        .update(dinners)
        .set({ status: "completed", ended_at: new Date(), is_completed: true, updated_at: new Date() })
        .where(eq(dinners.id, dinnerId))
        .returning();

      try {
        await onDinnerRealized(updatedDinner);
      } catch (err) {
        console.error("onDinnerRealized error:", err);
      }

      return NextResponse.json({
        success: true,
        message: "Jantar extra concluído! 🎉",
        dinner: updatedDinner,
      });
    }

    const [updatedDinner] = await db
      .update(dinners)
      .set({ status: "ended", ended_at: new Date(), is_completed: true, updated_at: new Date() })
      .where(eq(dinners.id, dinnerId))
      .returning();

    try {
      await onDinnerRealized(updatedDinner);
    } catch (err) {
      console.error("onDinnerRealized error:", err);
    }

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
