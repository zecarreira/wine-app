import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bottles, dinners, payments } from "@/lib/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";
import { BASE_PIPAS, canAddBottle, nextBottlePosition } from "@/lib/domain";
import { attachPendingPenaltiesForUser } from "@/lib/services/deadline";
import { parseBody } from "@/lib/api/parse-body";
import { addBottleSchema } from "@/lib/validations";

// GET /api/dinners/:id/bottles - List all bottles for a dinner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id: dinnerId } = await params;

    const result = await db
      .select({
        id: bottles.id,
        name: bottles.name,
        description: bottles.description,
        vintage: bottles.vintage,
        producer: bottles.producer,
        wine_type: bottles.wine_type,
        position: bottles.position,
        photo_url: bottles.photo_url,
        brought_by: bottles.brought_by,
        dinner_id: bottles.dinner_id,
        created_at: bottles.created_at,
      })
      .from(bottles)
      .where(eq(bottles.dinner_id, dinnerId))
      .orderBy(bottles.position);

    return NextResponse.json({ success: true, bottles: result });
  } catch (error) {
    console.error("Fetch bottles error:", error);
    return NextResponse.json({ error: "Failed to fetch bottles" }, { status: 500 });
  }
}

// POST /api/dinners/:id/bottles - Add a bottle to a dinner
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id: dinnerId } = await params;
    const parsed = await parseBody(request, addBottleSchema);
    if ("error" in parsed) return parsed.error;
    const { name, description, vintage, producer, wine_type, photo_url, position } = parsed.data;

    const [dinner] = await db
      .select({ id: dinners.id, organizer_id: dinners.organizer_id })
      .from(dinners)
      .where(eq(dinners.id, dinnerId))
      .limit(1);

    if (!dinner) {
      return NextResponse.json({ error: "Dinner not found" }, { status: 404 });
    }

    const [{ value: bottlesCount }] = await db
      .select({ value: count() })
      .from(bottles)
      .where(and(eq(bottles.dinner_id, dinnerId), eq(bottles.brought_by, auth.userId)));

    const isOrganizer = dinner.organizer_id === auth.userId;
    const addCheck = canAddBottle(bottlesCount, isOrganizer);
    if (!addCheck.ok) {
      return NextResponse.json({ error: addCheck.error }, { status: 400 });
    }

    const [lastBottle] = await db
      .select({ position: bottles.position })
      .from(bottles)
      .where(eq(bottles.dinner_id, dinnerId))
      .orderBy(desc(bottles.position))
      .limit(1);

    const nextPosition = nextBottlePosition(lastBottle?.position);

    const [newBottle] = await db
      .insert(bottles)
      .values({
        dinner_id: dinnerId,
        name,
        description: description ?? null,
        vintage: vintage ?? null,
        producer: producer ?? null,
        wine_type: wine_type ?? "red",
        photo_url: photo_url ?? null,
        position: position ?? nextPosition,
        brought_by: auth.userId,
      })
      .returning();

    // Auto-create payment if not already exists
    const [existingPayment] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(and(eq(payments.dinner_id, dinnerId), eq(payments.user_id, auth.userId)))
      .limit(1);

    if (!existingPayment) {
      await db
        .insert(payments)
        .values({ dinner_id: dinnerId, user_id: auth.userId, base_amount: BASE_PIPAS, status: "pending" })
        .returning();
    }

    try {
      await attachPendingPenaltiesForUser(auth.userId, dinnerId, {
        createdBy: auth.userId,
      });
    } catch (err) {
      console.error("attachPendingPenaltiesForUser error:", err);
    }

    return NextResponse.json(
      { success: true, message: "Bottle added successfully", bottle: newBottle },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add bottle error:", error);
    return NextResponse.json({ error: "Failed to add bottle" }, { status: 500 });
  }
}
