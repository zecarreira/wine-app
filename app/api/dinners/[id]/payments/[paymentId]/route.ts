import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, payments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

// PATCH /api/dinners/:dinnerId/payments/:paymentId - Marcar pagamento como pago (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, auth.userId)).limit(1);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Only admins can update payment status" }, { status: 403 });
    }

    const { paymentId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || (status !== "paid" && status !== "pending")) {
      return NextResponse.json({ error: "Valid status is required (paid or pending)" }, { status: 400 });
    }

    const [existingPayment] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const [updatedPayment] = await db
      .update(payments)
      .set({
        status,
        paid_at: status === "paid" ? new Date() : null,
        updated_at: new Date(),
      })
      .where(eq(payments.id, paymentId))
      .returning();

    return NextResponse.json({ success: true, message: `Payment marked as ${status}`, payment: updatedPayment });
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}
