import { NextRequest, NextResponse } from "next/server";
import supabase, { supabaseAdmin } from "@/lib/db";
import { requireAuth } from "@/lib/middleware";

// GET /api/dinners/:id/bottles - List all bottles for a dinner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dinnerId } = await params;

    // Fetch bottles for this dinner with user info
    const { data: bottles, error } = await supabase
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
    photo_url,
    brought_by,
    dinner_id,
    created_at
  `
      )
      .eq("dinner_id", dinnerId)
      .order("position", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      bottles: bottles || [],
    });
  } catch (error) {
    console.error("Fetch bottles error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to fetch bottles", details: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/dinners/:id/bottles - Add a bottle to a dinner
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const auth = await requireAuth(request);

    if (auth instanceof NextResponse) {
      return auth;
    }

    const { id: dinnerId } = await params;
    const body = await request.json();
    const {
      name,
      description,
      vintage,
      producer,
      wine_type,
      photo_url,
      position,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Bottle name is required" },
        { status: 400 }
      );
    }

    // Check if dinner exists and get organizer info
    const { data: dinner, error: dinnerError } = await supabase
      .from("dinners")
      .select("id, organizer_id")
      .eq("id", dinnerId)
      .single();

    if (dinnerError || !dinner) {
      return NextResponse.json({ error: "Dinner not found" }, { status: 404 });
    }

    // Check how many bottles this user already added to this dinner
    const { data: userBottles, error: bottlesError } = await supabase
      .from("bottles")
      .select("id")
      .eq("dinner_id", dinnerId)
      .eq("brought_by", auth.userId);

    if (bottlesError) throw bottlesError;

    const bottlesCount = userBottles?.length || 0;

    // Determine max bottles allowed
    const isOrganizer = dinner.organizer_id === auth.userId;
    const maxBottles = isOrganizer ? 2 : 1;

    // Validate bottle limit
    if (bottlesCount >= maxBottles) {
      return NextResponse.json(
        {
          error: isOrganizer
            ? "Organizador já adicionou o máximo de 2 garrafas para este jantar"
            : "Já adicionaste 1 garrafa para este jantar. Apenas o organizador pode adicionar 2 garrafas.",
        },
        { status: 400 }
      );
    }

    // Insert bottle
    // Get current max position for this dinner
    const { data: existingBottles } = await supabase
      .from("bottles")
      .select("position")
      .eq("dinner_id", dinnerId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition =
      existingBottles && existingBottles.length > 0
        ? (existingBottles[0].position || 0) + 1
        : 1;

    // Insert bottle with auto-incremented position
    const { data: newBottle, error: insertError } = await supabase
      .from("bottles")
      .insert({
        dinner_id: dinnerId,
        name,
        description: description || null,
        vintage: vintage || null,
        producer: producer || null,
        wine_type: wine_type || null,
        photo_url: photo_url || null,
        position: position || nextPosition, // Use provided or auto-increment
        brought_by: auth.userId,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Auto-create payment for this user (10 pipas base)
    // Check if payment already exists for this user in this dinner
    const { data: existingPayment, error: checkPaymentError } =
      await supabaseAdmin
        .from("payments")
        .select("id")
        .eq("dinner_id", dinnerId)
        .eq("user_id", auth.userId)
        .maybeSingle();

    if (checkPaymentError) {
      console.error("Error checking existing payment:", checkPaymentError);
    }

    // Only create payment if it doesn't exist yet
    if (!existingPayment) {
      console.log(
        "Creating payment for user:",
        auth.userId,
        "in dinner:",
        dinnerId
      );
      const { data: newPayment, error: paymentError } = await supabaseAdmin
        .from("payments")
        .insert({
          dinner_id: dinnerId,
          user_id: auth.userId,
          base_amount: 10,
          status: "pending",
        })
        .select()
        .single();

      if (paymentError) {
        console.error("Failed to create payment:", paymentError);
        // Don't fail the bottle creation if payment fails
      } else {
        console.log("Payment created successfully:", newPayment);
      }
    } else {
      console.log("Payment already exists for this user in this dinner");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Bottle added successfully",
        bottle: newBottle,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add bottle error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to add bottle", details: errorMessage },
      { status: 500 }
    );
  }
}
