import { NextRequest, NextResponse } from "next/server";
import supabase, { supabaseAdmin } from "@/lib/db";
import { requireAuth } from "@/lib/middleware";

// PATCH /api/dinners/:dinnerId/payments/:paymentId/fines/:fineId - Atualizar multa (Admin only)
export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; paymentId: string; fineId: string }>;
  }
) {
  try {
    // Require authentication
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) {
      return auth;
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", auth.userId)
      .single();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update fines" },
        { status: 403 }
      );
    }

    const { fineId } = await params;
    const body = await request.json();
    const { amount, reason } = body;

    if (amount !== undefined && amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (reason !== undefined && reason.trim() === "") {
      return NextResponse.json(
        { error: "Reason cannot be empty" },
        { status: 400 }
      );
    }

    // Check if fine exists
    const { data: existingFine, error: checkError } = await supabaseAdmin
      .from("fines")
      .select("id")
      .eq("id", fineId)
      .single();

    if (checkError || !existingFine) {
      return NextResponse.json({ error: "Fine not found" }, { status: 404 });
    }

    // Build update object
    const updateData: { amount?: number; reason?: string } = {};
    if (amount !== undefined) updateData.amount = amount;
    if (reason !== undefined) updateData.reason = reason.trim();

    // Update fine using supabaseAdmin to bypass RLS
    const { data: updatedFine, error: updateError } = await supabaseAdmin
      .from("fines")
      .update(updateData)
      .eq("id", fineId)
      .select(
        `
        *,
        admin:users!created_by(
          id,
          name
        )
      `
      )
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: "Fine updated successfully",
      fine: updatedFine,
    });
  } catch (error) {
    console.error("Update fine error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to update fine", details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/dinners/:dinnerId/payments/:paymentId/fines/:fineId - Remover multa (Admin only)
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; paymentId: string; fineId: string }>;
  }
) {
  try {
    // Require authentication
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) {
      return auth;
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", auth.userId)
      .single();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete fines" },
        { status: 403 }
      );
    }

    const { fineId } = await params;

    // Check if fine exists
    const { data: existingFine, error: checkError } = await supabaseAdmin
      .from("fines")
      .select("id")
      .eq("id", fineId)
      .single();

    if (checkError || !existingFine) {
      return NextResponse.json({ error: "Fine not found" }, { status: 404 });
    }

    // Delete fine using supabaseAdmin to bypass RLS
    const { error: deleteError } = await supabaseAdmin
      .from("fines")
      .delete()
      .eq("id", fineId);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: "Fine deleted successfully",
    });
  } catch (error) {
    console.error("Delete fine error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to delete fine", details: errorMessage },
      { status: 500 }
    );
  }
}
