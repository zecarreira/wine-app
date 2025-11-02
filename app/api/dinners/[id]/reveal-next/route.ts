import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { requireAuth } from "@/lib/middleware";

// POST /api/dinners/:id/reveal-next - Reveal next bottle (special logic for final 2)
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

    // Only host can reveal
    if (dinner.host_id !== auth.userId && dinner.created_by !== auth.userId) {
      return NextResponse.json(
        { error: "Only the host can reveal bottles" },
        { status: 403 }
      );
    }

    // Check dinner status
    if (dinner.status === "setup" || dinner.status === "active") {
      return NextResponse.json(
        { error: "Dinner must be ended before revealing" },
        { status: 400 }
      );
    }

    // Change status to revealing on first reveal
    if (dinner.status === "ended") {
      await supabase
        .from("dinners")
        .update({ status: "revealing" })
        .eq("id", dinnerId);
    }

    // Get all bottles with ratings and calculate averages
    const { data: bottles, error: bottlesError } = await supabase
      .from("bottles")
      .select(
        `
        id,
        name,
        description,
        vintage,
        producer,
        wine_type,
        position,
        brought_by_user:users!brought_by(id, name)
      `
      )
      .eq("dinner_id", dinnerId)
      .order("position", { ascending: true });

    if (bottlesError) throw bottlesError;

    if (!bottles || bottles.length === 0) {
      return NextResponse.json({ error: "No bottles found" }, { status: 404 });
    }

    // Get all ratings
    const bottleIds = bottles.map((b) => b.id);
    const { data: ratings, error: ratingsError } = await supabase
      .from("ratings")
      .select(
        `
        *,
        user:users(id, name)
      `
      )
      .in("bottle_id", bottleIds);

    if (ratingsError) throw ratingsError;

    // Calculate averages and rank
    const bottlesWithStats = bottles.map((bottle) => {
      const bottleRatings =
        ratings?.filter((r) => r.bottle_id === bottle.id) || [];

      const totalPoints = bottleRatings.reduce((sum, r) => sum + r.score, 0);

      const averageScore =
        bottleRatings.length > 0 ? totalPoints / bottleRatings.length : 0;

      return {
        ...bottle,
        ratings: bottleRatings,
        stats: {
          total_ratings: bottleRatings.length,
          average_score: Math.round(averageScore * 10) / 10,
          total_points: Math.round(totalPoints * 10) / 10, // ADICIONADO
        },
      };
    });

    // Sort by score ASCENDING (worst to best: [5th, 4th, 3rd, 2nd, 1st])
    const sortedWorstToBest = [...bottlesWithStats].sort(
      (a, b) => a.stats.average_score - b.stats.average_score
    );

    const totalBottles = sortedWorstToBest.length;
    const revealedSoFar = dinner.reveal_index || 0;
    const remainingToReveal = totalBottles - revealedSoFar;

    // Check if all revealed
    if (remainingToReveal === 0) {
      return NextResponse.json(
        { error: "All bottles already revealed" },
        { status: 400 }
      );
    }

    // SPECIAL LOGIC: When 2 bottles remain, reveal WINNER first, then 2nd place
    let bottleToReveal;
    let actualPosition;
    let isWinner = false;
    let isRunnerUp = false;

    if (remainingToReveal === 2) {
      // Reveal 1st place (WINNER!)
      bottleToReveal = sortedWorstToBest[totalBottles - 1]; // Best (1st)
      actualPosition = 1;
      isWinner = true;
    } else if (remainingToReveal === 1) {
      // Last one to reveal is 2nd place (runner-up)
      bottleToReveal = sortedWorstToBest[totalBottles - 2]; // Second best (2nd)
      actualPosition = 2;
      isRunnerUp = true;
    } else {
      // Normal flow: reveal from worst upward
      bottleToReveal = sortedWorstToBest[revealedSoFar];
      actualPosition = totalBottles - revealedSoFar; // Position (5th, 4th, 3rd...)
    }

    // Update reveal index
    const newRevealIndex = revealedSoFar + 1;
    const isComplete = newRevealIndex >= totalBottles;

    await supabase
      .from("dinners")
      .update({
        reveal_index: newRevealIndex,
        status: isComplete ? "completed" : "revealing",
        revealed_at: isComplete ? new Date().toISOString() : dinner.revealed_at,
      })
      .eq("id", dinnerId);

    // Determine message and medal
    let message = "";
    let medal = "";

    if (isWinner) {
      message = "🏆 AND THE WINNER IS...";
      medal = "🏆";
    } else if (isRunnerUp) {
      message = "🥈 The Runner-Up Is...";
      medal = "🥈";
    } else if (actualPosition === 3) {
      message = "🥉 Third Place Goes To...";
      medal = "🥉";
    } else {
      message = `Position ${actualPosition}...`;
      medal = `#${actualPosition}`;
    }

    return NextResponse.json({
      success: true,
      bottle: bottleToReveal,
      position: actualPosition,
      totalBottles,
      remainingToReveal: remainingToReveal - 1,
      isWinner,
      isRunnerUp,
      isComplete,
      medal,
      message,
    });
  } catch (error) {
    console.error("Reveal error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to reveal bottle", details: errorMessage },
      { status: 500 }
    );
  }
}
