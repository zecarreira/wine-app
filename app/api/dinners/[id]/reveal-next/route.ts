import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dinners, bottles, ratings, users } from "@/lib/schema";
import { eq, inArray, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
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

    const [dinner] = await db.select().from(dinners).where(eq(dinners.id, dinnerId)).limit(1);

    if (!dinner) {
      return NextResponse.json({ error: "Dinner not found" }, { status: 404 });
    }

    if (dinner.host_id !== auth.userId && dinner.created_by !== auth.userId) {
      return NextResponse.json({ error: "Only the host can reveal bottles" }, { status: 403 });
    }

    if (dinner.status === "setup" || dinner.status === "active") {
      return NextResponse.json({ error: "Dinner must be ended before revealing" }, { status: 400 });
    }

    if (dinner.status === "ended") {
      await db.update(dinners).set({ status: "revealing", updated_at: new Date() }).where(eq(dinners.id, dinnerId));
    }

    const broughtByUser = alias(users, "brought_by_user");

    const dinnerBottles = await db
      .select({
        id: bottles.id,
        name: bottles.name,
        description: bottles.description,
        vintage: bottles.vintage,
        producer: bottles.producer,
        wine_type: bottles.wine_type,
        photo_url: bottles.photo_url,
        position: bottles.position,
        brought_by_user: { id: broughtByUser.id, name: broughtByUser.name },
      })
      .from(bottles)
      .leftJoin(broughtByUser, eq(bottles.brought_by, broughtByUser.id))
      .where(eq(bottles.dinner_id, dinnerId))
      .orderBy(asc(bottles.position));

    if (dinnerBottles.length === 0) {
      return NextResponse.json({ error: "No bottles found" }, { status: 404 });
    }

    const bottleIds = dinnerBottles.map((b) => b.id);
    const ratingUser = alias(users, "user");

    const allRatings = await db
      .select({
        id: ratings.id,
        bottle_id: ratings.bottle_id,
        user_id: ratings.user_id,
        score: ratings.score,
        tasting_notes: ratings.tasting_notes,
        user: { id: ratingUser.id, name: ratingUser.name },
      })
      .from(ratings)
      .leftJoin(ratingUser, eq(ratings.user_id, ratingUser.id))
      .where(inArray(ratings.bottle_id, bottleIds));

    const bottlesWithStats = dinnerBottles.map((bottle) => {
      const bottleRatings = allRatings.filter((r) => r.bottle_id === bottle.id);
      const totalPoints = bottleRatings.reduce((sum, r) => sum + Number(r.score), 0);
      const averageScore = bottleRatings.length > 0 ? totalPoints / bottleRatings.length : 0;

      return {
        ...bottle,
        ratings: bottleRatings,
        stats: {
          total_ratings: bottleRatings.length,
          average_score: Math.round(averageScore * 10) / 10,
          total_points: Math.round(totalPoints * 10) / 10,
        },
      };
    });

    const sortedWorstToBest = [...bottlesWithStats].sort(
      (a, b) => a.stats.average_score - b.stats.average_score
    );

    const totalBottles = sortedWorstToBest.length;
    const revealedSoFar = dinner.reveal_index || 0;
    const remainingToReveal = totalBottles - revealedSoFar;

    if (remainingToReveal === 0) {
      return NextResponse.json({ error: "All bottles already revealed" }, { status: 400 });
    }

    let bottleToReveal;
    let actualPosition;
    let isWinner = false;
    let isRunnerUp = false;

    if (remainingToReveal === 2) {
      bottleToReveal = sortedWorstToBest[totalBottles - 1];
      actualPosition = 1;
      isWinner = true;
    } else if (remainingToReveal === 1) {
      bottleToReveal = sortedWorstToBest[totalBottles - 2];
      actualPosition = 2;
      isRunnerUp = true;
    } else {
      bottleToReveal = sortedWorstToBest[revealedSoFar];
      actualPosition = totalBottles - revealedSoFar;
    }

    const newRevealIndex = revealedSoFar + 1;
    const isComplete = newRevealIndex >= totalBottles;

    await db
      .update(dinners)
      .set({
        reveal_index: newRevealIndex,
        status: isComplete ? "completed" : "revealing",
        revealed_at: isComplete ? new Date() : dinner.revealed_at,
        updated_at: new Date(),
      })
      .where(eq(dinners.id, dinnerId));

    let message = "";
    let medal = "";

    if (isWinner) { message = "🏆 E O VENCEDOR É..."; medal = "🏆"; }
    else if (isRunnerUp) { message = "🥈 O Segundo Classificado É..."; medal = "🥈"; }
    else if (actualPosition === 3) { message = "🥉 O Terceiro Lugar vai para..."; medal = "🥉"; }
    else { message = `Posição ${actualPosition}...`; medal = `#${actualPosition}`; }

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
    return NextResponse.json({ error: "Failed to reveal bottle" }, { status: 500 });
  }
}
