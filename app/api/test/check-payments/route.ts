import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, fines } from "@/lib/schema";

// GET /api/test/check-payments - Test endpoint to verify payments table
export async function GET() {
  try {
    const paymentsData = await db.select().from(payments).limit(1);
    const finesData = await db.select().from(fines).limit(1);

    return NextResponse.json({
      success: true,
      message: "✅ Payment system tables exist and are accessible!",
      payments_count: paymentsData.length,
      fines_count: finesData.length,
      sample_payment: paymentsData[0] || null,
    });
  } catch (error) {
    console.error("Check payments error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check payments table",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
