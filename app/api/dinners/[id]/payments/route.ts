import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { requireAuth } from "@/lib/middleware";

// GET /api/dinners/:id/payments - Listar todos os pagamentos de um jantar
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dinnerId } = await params;

    // Fetch payments com user info e fines
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select(
        `
        id,
        dinner_id,
        user_id,
        base_amount,
        status,
        paid_at,
        created_at,
        user:users!user_id(
          id,
          name,
          email
        )
      `
      )
      .eq("dinner_id", dinnerId)
      .order("created_at", { ascending: true });

    if (paymentsError) throw paymentsError;

    if (!payments || payments.length === 0) {
      return NextResponse.json({
        success: true,
        payments: [],
        stats: {
          total_payments: 0,
          paid_count: 0,
          pending_count: 0,
          total_collected: 0,
          total_pending: 0,
        },
      });
    }

    // Fetch todas as fines para estes pagamentos
    const paymentIds = payments.map((p) => p.id);
    const { data: fines, error: finesError } = await supabase
      .from("fines")
      .select(
        `
        id,
        payment_id,
        amount,
        reason,
        created_at,
        created_by,
        admin:users!created_by(
          id,
          name
        )
      `
      )
      .in("payment_id", paymentIds)
      .order("created_at", { ascending: true });

    if (finesError) throw finesError;

    // Agregar fines por payment
    const paymentsWithFines = payments.map((payment) => {
      const paymentFines =
        fines?.filter((f) => f.payment_id === payment.id) || [];
      const totalFines = paymentFines.reduce((sum, f) => sum + f.amount, 0);
      const totalAmount = payment.base_amount + totalFines;

      return {
        ...payment,
        fines: paymentFines,
        total_fines: totalFines,
        total_amount: totalAmount,
      };
    });

    // Calcular estatísticas
    const stats = {
      total_payments: paymentsWithFines.length,
      paid_count: paymentsWithFines.filter((p) => p.status === "paid").length,
      pending_count: paymentsWithFines.filter((p) => p.status === "pending")
        .length,
      total_collected: paymentsWithFines
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.total_amount, 0),
      total_pending: paymentsWithFines
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + p.total_amount, 0),
      base_amount: payments.length * 10,
      total_fines: fines?.reduce((sum, f) => sum + f.amount, 0) || 0,
    };

    return NextResponse.json({
      success: true,
      payments: paymentsWithFines,
      stats,
    });
  } catch (error) {
    console.error("Fetch payments error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to fetch payments", details: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/dinners/:id/payments - Criar novo pagamento (Admin only)
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

    // Check if user is admin
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("id", auth.userId)
      .single();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create payments" },
        { status: 403 }
      );
    }

    const { id: dinnerId } = await params;
    const body = await request.json();
    const { user_id, base_amount = 10 } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
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

    // Check if user exists
    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("id, name")
      .eq("id", user_id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if payment already exists
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("dinner_id", dinnerId)
      .eq("user_id", user_id)
      .single();

    if (existingPayment) {
      return NextResponse.json(
        { error: "Payment already exists for this user in this dinner" },
        { status: 409 }
      );
    }

    // Create payment
    const { data: payment, error: insertError } = await supabase
      .from("payments")
      .insert({
        dinner_id: dinnerId,
        user_id: user_id,
        base_amount: base_amount,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(
      {
        success: true,
        message: "Payment created successfully",
        payment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create payment error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to create payment", details: errorMessage },
      { status: 500 }
    );
  }
}
