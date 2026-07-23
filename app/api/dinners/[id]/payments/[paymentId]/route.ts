import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/middleware";
import { parseBody } from "@/lib/api/parse-body";
import { paymentStatusSchema } from "@/lib/validations";

// PATCH /api/dinners/:dinnerId/payments/:paymentId - Marcar pagamento como pago (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { paymentId } = await params;
    const parsed = await parseBody(request, paymentStatusSchema);
    if ("error" in parsed) return parsed.error;
    const { status } = parsed.data;

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
