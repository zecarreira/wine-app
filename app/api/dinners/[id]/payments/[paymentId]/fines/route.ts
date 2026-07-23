import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, payments, fines, dinners } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireAuth } from "@/lib/middleware";
import { parseBody } from "@/lib/api/parse-body";
import { fineSchema } from "@/lib/validations";

// POST /api/dinners/:dinnerId/payments/:paymentId/fines - Adicionar multa (host OR admin)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, auth.userId)).limit(1);

    const { id: dinnerId, paymentId } = await params;

    const [dinner] = await db.select({ host_id: dinners.host_id }).from(dinners).where(eq(dinners.id, dinnerId)).limit(1);

    const isAdmin = currentUser?.role === "admin";
    const isDinnerHost = dinner?.host_id === auth.userId;

    if (!isAdmin && !isDinnerHost) {
      return NextResponse.json({ error: "Only admins or the dinner host can add fines" }, { status: 403 });
    }

    const parsed = await parseBody(request, fineSchema);
    if ("error" in parsed) return parsed.error;
    const { amount, reason } = parsed.data;

    const [payment] = await db
      .select({ id: payments.id, user_id: payments.user_id, dinner_id: payments.dinner_id })
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const [newFine] = await db
      .insert(fines)
      .values({ payment_id: paymentId, amount, reason: reason.trim(), created_by: auth.userId })
      .returning();

    // Fetch fine with admin user info
    const adminUser = alias(users, "admin");
    const [fineWithAdmin] = await db
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
      .where(eq(fines.id, newFine.id))
      .limit(1);

    const fineFormatted = {
      id: fineWithAdmin.id,
      payment_id: fineWithAdmin.payment_id,
      amount: fineWithAdmin.amount,
      reason: fineWithAdmin.reason,
      created_at: fineWithAdmin.created_at,
      created_by: fineWithAdmin.created_by,
      admin: fineWithAdmin.admin_id ? { id: fineWithAdmin.admin_id, name: fineWithAdmin.admin_name } : null,
    };

    // Fetch total fines for this payment
    const allFines = await db.select({ amount: fines.amount }).from(fines).where(eq(fines.payment_id, paymentId));
    const totalFines = allFines.reduce((sum, f) => sum + f.amount, 0);

    return NextResponse.json(
      { success: true, message: "Fine added successfully", fine: fineFormatted, total_fines: totalFines },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add fine error:", error);
    return NextResponse.json({ error: "Failed to add fine" }, { status: 500 });
  }
}

// GET /api/dinners/:dinnerId/payments/:paymentId/fines - Listar multas de um pagamento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { paymentId } = await params;

    const [payment] = await db.select({ id: payments.id }).from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

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
      .where(eq(fines.payment_id, paymentId))
      .orderBy(asc(fines.created_at));

    const finesFormatted = allFines.map(f => ({
      id: f.id,
      payment_id: f.payment_id,
      amount: f.amount,
      reason: f.reason,
      created_at: f.created_at,
      created_by: f.created_by,
      admin: f.admin_id ? { id: f.admin_id, name: f.admin_name } : null,
    }));

    const totalFines = finesFormatted.reduce((sum, f) => sum + f.amount, 0);

    return NextResponse.json({ success: true, fines: finesFormatted, total_fines: totalFines });
  } catch (error) {
    console.error("Fetch fines error:", error);
    return NextResponse.json({ error: "Failed to fetch fines" }, { status: 500 });
  }
}
