import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import supabase from "@/lib/db";
import { requireAuth } from "@/lib/middleware";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bottleId } = await params;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get bottle with all related data
    const { data: bottle, error } = await supabase
      .from("bottles")
      .select(
        `
        *,
        dinner:dinners(
          id, 
          name, 
          event_date, 
          location, 
          is_blind, 
          status,
          created_by,
          host:users!dinners_created_by_fkey(id, name)
        ),
        brought_by_user:users!bottles_brought_by_fkey(id, name),
        ratings(
          id,
          score,
          tasting_notes,
          created_at,
          user:users(id, name)
        )
      `
      )
      .eq("id", bottleId)
      .single();

    if (error) {
      console.error("Error fetching bottle:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Bottle not found",
        },
        { status: 404 }
      );
    }

    // Calculate stats
    const ratings = bottle.ratings || [];
    const totalRatings = ratings.length;
    const averageScore =
      totalRatings > 0
        ? (
            ratings.reduce((sum: number, r: any) => sum + r.score, 0) /
            totalRatings
          ).toFixed(1)
        : null;

    return NextResponse.json({
      success: true,
      bottle: {
        ...bottle,
        stats: {
          total_ratings: totalRatings,
          average_score: averageScore,
        },
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/bottles/:id - Update a bottle
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);

    if (auth instanceof NextResponse) {
      return auth;
    }

    const { id: bottleId } = await params;
    const body = await request.json();
    const { name, description, vintage, producer, wine_type, photo_url } = body;

    // Get bottle and dinner info
    const { data: bottle, error: bottleError } = await supabase
      .from("bottles")
      .select(
        `
        id,
        brought_by,
        dinner_id,
        dinners!inner(id, status)
      `
      )
      .eq("id", bottleId)
      .single();

    if (bottleError || !bottle) {
      return NextResponse.json({ error: "Bottle not found" }, { status: 404 });
    }

    // Check if dinner is in setup status
    const dinner = bottle.dinners as unknown as { id: string; status: string };
    if (dinner.status !== "setup") {
      return NextResponse.json(
        {
          error:
            "Apenas podes editar garrafas enquanto o jantar está em preparação (setup). O jantar já começou ou terminou.",
        },
        { status: 400 }
      );
    }

    // Check if user owns this bottle
    if (bottle.brought_by !== auth.userId) {
      return NextResponse.json(
        { error: "Não podes editar garrafas de outros utilizadores" },
        { status: 403 }
      );
    }

    // Update bottle
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (vintage !== undefined) updateData.vintage = vintage;
    if (producer !== undefined) updateData.producer = producer;
    if (wine_type !== undefined) updateData.wine_type = wine_type;
    if (photo_url !== undefined) updateData.photo_url = photo_url;

    const { data: updatedBottle, error: updateError } = await supabase
      .from("bottles")
      .update(updateData)
      .eq("id", bottleId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: "Garrafa atualizada com sucesso",
      bottle: updatedBottle,
    });
  } catch (error) {
    console.error("Update bottle error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to update bottle", details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/bottles/:id - Delete a bottle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);

    if (auth instanceof NextResponse) {
      return auth;
    }

    const { id: bottleId } = await params;

    // Get bottle and dinner info
    const { data: bottle, error: bottleError } = await supabase
      .from("bottles")
      .select(
        `
        id,
        brought_by,
        dinner_id,
        dinners!inner(id, status)
      `
      )
      .eq("id", bottleId)
      .single();

    if (bottleError || !bottle) {
      return NextResponse.json({ error: "Bottle not found" }, { status: 404 });
    }

    // Check if dinner is in setup status
    const dinner = bottle.dinners as unknown as { id: string; status: string };
    if (dinner.status !== "setup") {
      return NextResponse.json(
        {
          error:
            "Apenas podes apagar garrafas enquanto o jantar está em preparação (setup). O jantar já começou ou terminou.",
        },
        { status: 400 }
      );
    }

    // Check if user owns this bottle
    if (bottle.brought_by !== auth.userId) {
      return NextResponse.json(
        { error: "Não podes apagar garrafas de outros utilizadores" },
        { status: 403 }
      );
    }

    // Delete bottle
    const { error: deleteError } = await supabase
      .from("bottles")
      .delete()
      .eq("id", bottleId);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: "Garrafa apagada com sucesso",
    });
  } catch (error) {
    console.error("Delete bottle error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to delete bottle", details: errorMessage },
      { status: 500 }
    );
  }
}
