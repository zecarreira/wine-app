import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
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

    // Check if dinner exists
    const { data: dinner, error: dinnerError } = await supabase
      .from("dinners")
      .select("id")
      .eq("id", dinnerId)
      .single();

    if (dinnerError || !dinner) {
      return NextResponse.json({ error: "Dinner not found" }, { status: 404 });
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

    // Debug: verificar se a garrafa tem ID
    console.log("✅ Garrafa criada na API:", {
      id: newBottle?.id,
      position: newBottle?.position,
      name: newBottle?.name,
    });

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
