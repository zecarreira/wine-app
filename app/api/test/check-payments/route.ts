import { NextResponse } from "next/server";
import supabase from "@/lib/db";

// GET /api/test/check-payments - Test endpoint to verify payments table
export async function GET() {
  try {
    // Try to query payments table
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: "Payments table error",
        details: error,
        message:
          "A tabela 'payments' não existe ou há um erro de acesso. Precisas executar a migration em /migrations/create_payments_system.sql",
      });
    }

    // Try to query fines table
    const { data: finesData, error: finesError } = await supabase
      .from("fines")
      .select("*")
      .limit(1);

    if (finesError) {
      return NextResponse.json({
        success: false,
        error: "Fines table error",
        details: finesError,
        message:
          "A tabela 'fines' não existe ou há um erro de acesso. Precisas executar a migration em /migrations/create_payments_system.sql",
      });
    }

    return NextResponse.json({
      success: true,
      message: "✅ Payment system tables exist and are accessible!",
      payments_count: data?.length || 0,
      fines_count: finesData?.length || 0,
      sample_payment: data?.[0] || null,
    });
  } catch (error) {
    console.error("Check payments error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check payments table",
        details: error instanceof Error ? error.message : "Unknown error",
        message:
          "⚠️ Provavelmente a migration não foi executada. Executa o SQL em /migrations/create_payments_system.sql no Supabase Dashboard.",
      },
      { status: 500 }
    );
  }
}
