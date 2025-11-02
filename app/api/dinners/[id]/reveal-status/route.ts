import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

// GET /api/dinners/:id/reveal-status - Get current reveal state
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dinnerId } = await params;

    const { data: dinner, error: dinnerError } = await supabase
      .from("dinners")
      .select("*")
      .eq("id", dinnerId)
      .single();

    if (dinnerError || !dinner) {
      return NextResponse.json({ error: "Dinner not found" }, { status: 404 });
    }

    // Get bottle count
    const { data: bottles } = await supabase
      .from("bottles")
      .select("id")
      .eq("dinner_id", dinnerId);

    const totalBottles = bottles?.length || 0;
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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to get status", details: errorMessage },
      { status: 500 }
    );
  }
}
