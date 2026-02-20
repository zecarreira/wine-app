import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, dinners, ratings, bottles, payments, fines } from "@/lib/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireAuth } from "@/lib/middleware";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id: userId } = await params;

    if (!UUID_REGEX.test(userId)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role, created_at: users.created_at, profile_photo_url: users.profile_photo_url })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Get dinners created by user
    const createdDinners = await db
      .select({ id: dinners.id })
      .from(dinners)
      .where(eq(dinners.created_by, userId));

    // Get all ratings by user with bottle and dinner info (flattened)
    const bottleAlias = alias(bottles, "bottle");
    const dinnerAlias = alias(dinners, "dinner");

    const userRatings = await db
      .select({
        id: ratings.id,
        score: ratings.score,
        tasting_notes: ratings.tasting_notes,
        created_at: ratings.created_at,
        bottle_id: bottleAlias.id,
        bottle_name: bottleAlias.name,
        bottle_producer: bottleAlias.producer,
        bottle_vintage: bottleAlias.vintage,
        bottle_photo_url: bottleAlias.photo_url,
        dinner_id: dinnerAlias.id,
        dinner_name: dinnerAlias.name,
        dinner_event_date: dinnerAlias.event_date,
        dinner_status: dinnerAlias.status,
        dinner_is_blind: dinnerAlias.is_blind,
      })
      .from(ratings)
      .leftJoin(bottleAlias, eq(ratings.bottle_id, bottleAlias.id))
      .leftJoin(dinnerAlias, eq(bottleAlias.dinner_id, dinnerAlias.id))
      .where(eq(ratings.user_id, userId))
      .orderBy(desc(ratings.created_at));

    // Get bottles brought by user with dinner info (flattened)
    const dinnerForBottle = alias(dinners, "dinner_for_bottle");
    const bottlesBrought = await db
      .select({
        id: bottles.id,
        name: bottles.name,
        producer: bottles.producer,
        vintage: bottles.vintage,
        photo_url: bottles.photo_url,
        dinner_id: dinnerForBottle.id,
        dinner_name: dinnerForBottle.name,
        dinner_event_date: dinnerForBottle.event_date,
        dinner_status: dinnerForBottle.status,
        dinner_is_blind: dinnerForBottle.is_blind,
      })
      .from(bottles)
      .leftJoin(dinnerForBottle, eq(bottles.dinner_id, dinnerForBottle.id))
      .where(eq(bottles.brought_by, userId));

    // Calculate dinner count (unique across created + rated)
    const dinnerIdsFromRatings = userRatings.map(r => r.dinner_id).filter(Boolean) as string[];
    const uniqueDinnerIds = new Set([...createdDinners.map(d => d.id), ...dinnerIdsFromRatings]);
    const totalDinners = uniqueDinnerIds.size;

    const totalRatings = userRatings.length;
    const totalBottlesBrought = bottlesBrought.length;
    const averageRating = totalRatings > 0
      ? (userRatings.reduce((sum, r) => sum + Number(r.score), 0) / totalRatings).toFixed(1)
      : null;

    // Calculate total spent (only for non-guest users)
    let totalSpent = 0;
    if (user.role !== "guest") {
      const userPayments = await db
        .select({ id: payments.id, base_amount: payments.base_amount })
        .from(payments)
        .where(eq(payments.user_id, userId));

      const paymentIds = userPayments.map(p => p.id);
      let totalFinesAmount = 0;
      if (paymentIds.length > 0) {
        const allFines = await db
          .select({ amount: fines.amount })
          .from(fines)
          .where(inArray(fines.payment_id, paymentIds));
        totalFinesAmount = allFines.reduce((sum, f) => sum + f.amount, 0);
      }

      totalSpent = userPayments.reduce((sum, p) => sum + p.base_amount, 0) + totalFinesAmount;
    }

    // Find favorite wine (highest rated)
    const favoriteWineRaw = userRatings.length > 0
      ? userRatings.reduce((prev, current) => Number(current.score) > Number(prev.score) ? current : prev)
      : null;

    // Reconstruct nested objects
    const formatRating = (r: typeof userRatings[0]) => ({
      id: r.id,
      score: r.score,
      tasting_notes: r.tasting_notes,
      created_at: r.created_at,
      bottle: r.bottle_id ? {
        id: r.bottle_id,
        name: r.bottle_name,
        producer: r.bottle_producer,
        vintage: r.bottle_vintage,
        photo_url: r.bottle_photo_url,
        dinner: r.dinner_id ? { id: r.dinner_id, name: r.dinner_name, event_date: r.dinner_event_date, status: r.dinner_status, is_blind: r.dinner_is_blind } : null,
      } : null,
    });

    const bottlesFormatted = bottlesBrought.map(b => ({
      id: b.id,
      name: b.name,
      producer: b.producer,
      vintage: b.vintage,
      photo_url: b.photo_url,
      dinner: b.dinner_id ? { id: b.dinner_id, name: b.dinner_name, event_date: b.dinner_event_date, status: b.dinner_status, is_blind: b.dinner_is_blind } : null,
    }));

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        stats: {
          total_dinners: totalDinners,
          total_ratings: totalRatings,
          total_bottles_brought: totalBottlesBrought,
          average_rating: averageRating,
          total_spent: totalSpent,
        },
        favorite_wine: favoriteWineRaw ? formatRating(favoriteWineRaw) : null,
        recent_ratings: userRatings.slice(0, 5).map(formatRating),
        bottles_brought: bottlesFormatted,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id: userId } = await params;

    if (auth.userId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { profile_photo_url } = body;

    if (!profile_photo_url) {
      return NextResponse.json({ success: false, error: "Profile photo URL is required" }, { status: 400 });
    }

    const [updatedUser] = await db
      .update(users)
      .set({ profile_photo_url })
      .where(eq(users.id, userId))
      .returning();

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
