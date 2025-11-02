import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
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

    // Get dinner and verify host
    const { data: dinner, error: dinnerError } = await supabase
      .from("dinners")
      .select("*")
      .eq("id", dinnerId)
      .single();

    if (dinnerError || !dinner) {
      return NextResponse.json({ error: "Dinner not found" }, { status: 404 });
    }

    // Only host can start dinner
    if (dinner.host_id !== auth.userId && dinner.created_by !== auth.userId) {
      return NextResponse.json(
        { error: "Only the host can start this dinner" },
        { status: 403 }
      );
    }

    // Check if already started
    if (dinner.status !== "setup") {
      return NextResponse.json(
        { error: `Dinner is already ${dinner.status}` },
        { status: 400 }
      );
    }

    // Check if there are bottles
    const { data: bottles } = await supabase
      .from("bottles")
      .select("id")
      .eq("dinner_id", dinnerId);

    if (!bottles || bottles.length === 0) {
      return NextResponse.json(
        { error: "Cannot start dinner without bottles" },
        { status: 400 }
      );
    }

    // Start the dinner
    const { data: updatedDinner, error: updateError } = await supabase
      .from("dinners")
      .update({
        status: "active",
        started_at: new Date().toISOString(),
      })
      .eq("id", dinnerId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: "Blind tasting started! 🎭",
      dinner: updatedDinner,
    });
  } catch (error) {
    console.error("Start dinner error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to start dinner", details: errorMessage },
      { status: 500 }
    );
  }
}
