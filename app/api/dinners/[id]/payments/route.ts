import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, dinners, payments, fines } from "@/lib/schema";
import { eq, asc, inArray, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireAuth, requireAdmin } from "@/lib/middleware";
import { parseBody } from "@/lib/api/parse-body";
import { paymentCreateSchema } from "@/lib/validations";

// GET /api/dinners/:id/payments - Listar todos os pagamentos de um jantar
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id: dinnerId } = await params;

    const paymentUser = alias(users, "payment_user");

    const allPayments = await db
      .select({
        id: payments.id,
        dinner_id: payments.dinner_id,
        user_id: payments.user_id,
        base_amount: payments.base_amount,
        status: payments.status,
        paid_at: payments.paid_at,
        created_at: payments.created_at,
        user_id_ref: paymentUser.id,
        user_name: paymentUser.name,
        user_email: paymentUser.email,
      })
      .from(payments)
      .leftJoin(paymentUser, eq(payments.user_id, paymentUser.id))
      .where(eq(payments.dinner_id, dinnerId))
      .orderBy(asc(payments.created_at));

    if (allPayments.length === 0) {
      return NextResponse.json({
        success: true,
        payments: [],
        stats: { total_payments: 0, paid_count: 0, pending_count: 0, total_collected: 0, total_pending: 0 },
      });
    }

    const paymentIds = allPayments.map(p => p.id);
    const adminUser = alias(users, "admin");

    const allFines = await db
      .select({
        id: fines.id,
        payment_id: fines.payment_id,
        amount: fines.amount,
        reason: fines.reason,
        created_at: fines.created_at,
        created_by: fines.created_by,
        admin_id: adminUser.id,
        admin_name: adminUser.name,
      })
      .from(fines)
      .leftJoin(adminUser, eq(fines.created_by, adminUser.id))
      .where(inArray(fines.payment_id, paymentIds))
      .orderBy(asc(fines.created_at));

    // Agregar fines por payment
    const paymentsWithFines = allPayments.map(payment => {
      const paymentFines = allFines
        .filter(f => f.payment_id === payment.id)
        .map(f => ({
          id: f.id,
          payment_id: f.payment_id,
          amount: f.amount,
          reason: f.reason,
          created_at: f.created_at,
          created_by: f.created_by,
          admin: f.admin_id ? { id: f.admin_id, name: f.admin_name } : null,
        }));
      const totalFines = paymentFines.reduce((sum, f) => sum + f.amount, 0);
      const totalAmount = payment.base_amount + totalFines;
      return {
        id: payment.id,
        dinner_id: payment.dinner_id,
        user_id: payment.user_id,
        base_amount: payment.base_amount,
        status: payment.status,
        paid_at: payment.paid_at,
        created_at: payment.created_at,
        user: payment.user_id_ref ? { id: payment.user_id_ref, name: payment.user_name, email: payment.user_email } : null,
        fines: paymentFines,
        total_fines: totalFines,
        total_amount: totalAmount,
      };
    });

    const stats = {
      total_payments: paymentsWithFines.length,
      paid_count: paymentsWithFines.filter(p => p.status === "paid").length,
      pending_count: paymentsWithFines.filter(p => p.status === "pending").length,
      total_collected: paymentsWithFines.filter(p => p.status === "paid").reduce((sum, p) => sum + p.total_amount, 0),
      total_pending: paymentsWithFines.filter(p => p.status === "pending").reduce((sum, p) => sum + p.total_amount, 0),
      base_amount: allPayments.length * 10,
      total_fines: allFines.reduce((sum, f) => sum + f.amount, 0),
    };

    return NextResponse.json({ success: true, payments: paymentsWithFines, stats });
  } catch (error) {
    console.error("Fetch payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST /api/dinners/:id/payments - Criar novo pagamento (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id: dinnerId } = await params;
    const parsed = await parseBody(request, paymentCreateSchema);
    if ("error" in parsed) return parsed.error;
    const { user_id, base_amount = 10 } = parsed.data;

    const [dinner] = await db.select({ id: dinners.id }).from(dinners).where(eq(dinners.id, dinnerId)).limit(1);
    if (!dinner) {
      return NextResponse.json({ error: "Dinner not found" }, { status: 404 });
    }

    const [targetUser] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, user_id)).limit(1);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [existingPayment] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(and(eq(payments.dinner_id, dinnerId), eq(payments.user_id, user_id)))
      .limit(1);

    if (existingPayment) {
      return NextResponse.json({ error: "Payment already exists for this user in this dinner" }, { status: 409 });
    }

    const [newPayment] = await db
      .insert(payments)
      .values({ dinner_id: dinnerId, user_id, base_amount, status: "pending" })
      .returning();

    return NextResponse.json(
      { success: true, message: "Payment created successfully", payment: newPayment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
