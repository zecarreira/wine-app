import { NextRequest, NextResponse } from "next/server";
import supabase, { supabaseAdmin } from "@/lib/db";
import { requireAuth } from "@/lib/middleware";

// PATCH /api/dinners/:dinnerId/payments/:paymentId - Marcar pagamento como pago (Admin only)
export async function PATCH(
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
        { error: "Only admins can update payment status" },
        { status: 403 }
      );
    }

    const { paymentId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || (status !== "paid" && status !== "pending")) {
      return NextResponse.json(
        { error: "Valid status is required (paid or pending)" },
        { status: 400 }
      );
    }

    // Check if payment exists
    const { data: existingPayment, error: fetchError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (fetchError || !existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Update payment
    const updateData: { status: string; paid_at?: string | null } = {
      status,
    };

    // Set paid_at timestamp quando marcar como paid
    if (status === "paid") {
      updateData.paid_at = new Date().toISOString();
    } else {
      // Limpar paid_at se voltar para pending
      updateData.paid_at = null;
    }

    const { data: payment, error: updateError } = await supabaseAdmin
      .from("payments")
      .update(updateData)
      .eq("id", paymentId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: `Payment marked as ${status}`,
      payment,
    });
  } catch (error) {
    console.error("Update payment error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to update payment", details: errorMessage },
      { status: 500 }
    );
  }
}
