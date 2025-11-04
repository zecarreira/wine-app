import { NextRequest, NextResponse } from "next/server";
import supabase, { supabaseAdmin } from "@/lib/db";
import { requireAuth } from "@/lib/middleware";

// POST /api/dinners/:dinnerId/payments/:paymentId/fines - Adicionar multa (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
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
        { error: "Only admins can add fines" },
        { status: 403 }
      );
    }

    const { paymentId } = await params;
    const body = await request.json();
    const { amount, reason } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required (must be > 0)" },
        { status: 400 }
      );
    }

    if (!reason || reason.trim() === "") {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    // Check if payment exists
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, dinner_id")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Create fine using supabaseAdmin to bypass RLS
    const { data: fine, error: insertError } = await supabaseAdmin
      .from("fines")
      .insert({
        payment_id: paymentId,
        amount: amount,
        reason: reason.trim(),
        created_by: auth.userId,
      })
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

    if (insertError) throw insertError;

    // Fetch updated payment com todas as fines
    const { data: fines } = await supabaseAdmin
      .from("fines")
      .select("amount")
      .eq("payment_id", paymentId);

    const totalFines = fines?.reduce((sum, f) => sum + f.amount, 0) || 0;

    return NextResponse.json(
      {
        success: true,
        message: "Fine added successfully",
        fine,
        total_fines: totalFines,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add fine error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to add fine", details: errorMessage },
      { status: 500 }
    );
  }
}

// GET /api/dinners/:dinnerId/payments/:paymentId/fines - Listar multas de um pagamento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    // Check if payment exists
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Fetch fines
    const { data: fines, error: finesError } = await supabase
      .from("fines")
      .select(
        `
        *,
        admin:users!created_by(
          id,
          name
        )
      `
      )
      .eq("payment_id", paymentId)
      .order("created_at", { ascending: true });

    if (finesError) throw finesError;

    const totalFines = fines?.reduce((sum, f) => sum + f.amount, 0) || 0;

    return NextResponse.json({
      success: true,
      fines: fines || [],
      total_fines: totalFines,
    });
  } catch (error) {
    console.error("Fetch fines error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to fetch fines", details: errorMessage },
      { status: 500 }
    );
  }
}
