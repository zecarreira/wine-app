import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
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

    // Get dinner and verify host
    const { data: dinner, error: dinnerError } = await supabase
      .from("dinners")
      .select("*")
      .eq("id", dinnerId)
      .single();

    if (dinnerError || !dinner) {
      return NextResponse.json({ error: "Dinner not found" }, { status: 404 });
    }

    // Only host can end dinner
    if (dinner.host_id !== auth.userId && dinner.created_by !== auth.userId) {
      return NextResponse.json(
        { error: "Only the host can end this dinner" },
        { status: 403 }
      );
    }

    // Check if dinner is active
    if (dinner.status !== "active") {
      return NextResponse.json(
        { error: `Cannot end dinner in ${dinner.status} state` },
        { status: 400 }
      );
    }

    // End the dinner
    const { data: updatedDinner, error: updateError } = await supabase
      .from("dinners")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
        is_completed: true,
      })
      .eq("id", dinnerId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: "Dinner ended! Ready for reveal 🎉",
      dinner: updatedDinner,
    });
  } catch (error) {
    console.error("End dinner error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to end dinner", details: errorMessage },
      { status: 500 }
    );
  }
}
