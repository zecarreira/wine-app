import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, fines } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireAuth } from "@/lib/middleware";

// PATCH /api/dinners/:dinnerId/payments/:paymentId/fines/:fineId - Atualizar multa (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string; fineId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, auth.userId)).limit(1);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Only admins can update fines" }, { status: 403 });
    }

    const { fineId } = await params;
    const body = await request.json();
    const { amount, reason } = body;

    if (amount !== undefined && amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }
    if (reason !== undefined && reason.trim() === "") {
      return NextResponse.json({ error: "Reason cannot be empty" }, { status: 400 });
    }

    const [existingFine] = await db.select({ id: fines.id }).from(fines).where(eq(fines.id, fineId)).limit(1);
    if (!existingFine) {
      return NextResponse.json({ error: "Fine not found" }, { status: 404 });
    }

    const updateData: { amount?: number; reason?: string; updated_at: Date } = { updated_at: new Date() };
    if (amount !== undefined) updateData.amount = amount;
    if (reason !== undefined) updateData.reason = reason.trim();

    await db.update(fines).set(updateData).where(eq(fines.id, fineId));

    // Fetch updated fine with admin user info
    const adminUser = alias(users, "admin");
    const [updatedFine] = await db
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
      .where(eq(fines.id, fineId))
      .limit(1);

    const fineFormatted = {
      id: updatedFine.id,
      payment_id: updatedFine.payment_id,
      amount: updatedFine.amount,
      reason: updatedFine.reason,
      created_at: updatedFine.created_at,
      created_by: updatedFine.created_by,
      admin: updatedFine.admin_id ? { id: updatedFine.admin_id, name: updatedFine.admin_name } : null,
    };

    return NextResponse.json({ success: true, message: "Fine updated successfully", fine: fineFormatted });
  } catch (error) {
    console.error("Update fine error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: "Failed to update fine", details: errorMessage }, { status: 500 });
  }
}

// DELETE /api/dinners/:dinnerId/payments/:paymentId/fines/:fineId - Remover multa (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string; fineId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, auth.userId)).limit(1);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Only admins can delete fines" }, { status: 403 });
    }

    const { fineId } = await params;

    const [existingFine] = await db.select({ id: fines.id }).from(fines).where(eq(fines.id, fineId)).limit(1);
    if (!existingFine) {
      return NextResponse.json({ error: "Fine not found" }, { status: 404 });
    }

    await db.delete(fines).where(eq(fines.id, fineId));

    return NextResponse.json({ success: true, message: "Fine deleted successfully" });
  } catch (error) {
    console.error("Delete fine error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: "Failed to delete fine", details: errorMessage }, { status: 500 });
  }
}
