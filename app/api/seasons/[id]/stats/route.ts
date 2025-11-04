import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

// GET /api/seasons/:id/stats - Estatísticas de pagamentos de uma season
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: seasonId } = await params;

    // Check if season exists
    const { data: season, error: seasonError } = await supabase
      .from("seasons")
      .select("id, season_number, start_date, end_date")
      .eq("id", seasonId)
      .single();

    if (seasonError || !season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    // Fetch all dinners from this season
    const { data: dinners, error: dinnersError } = await supabase
      .from("dinners")
      .select("id, name, event_date")
      .eq("season_id", seasonId)
      .order("event_date", { ascending: true });

    if (dinnersError) throw dinnersError;

    if (!dinners || dinners.length === 0) {
      return NextResponse.json({
        success: true,
        season: {
          id: season.id,
          name: `Temporada ${season.season_number}`,
          start_date: season.start_date,
          end_date: season.end_date,
        },
        stats: {
          total_dinners: 0,
          total_payments: 0,
          total_collected: 0,
          total_pending: 0,
          total_fines: 0,
          grand_total: 0,
        },
        dinners: [],
      });
    }

    const dinnerIds = dinners.map((d) => d.id);

    // Fetch all payments for these dinners
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
        user:users!user_id(
          id,
          name
        )
      `
      )
      .in("dinner_id", dinnerIds);

    if (paymentsError) throw paymentsError;

    // Fetch all fines for these payments
    const paymentIds = payments?.map((p) => p.id) || [];
    let fines: Array<{ payment_id: string; amount: number }> = [];

    if (paymentIds.length > 0) {
      const { data: finesData, error: finesError } = await supabase
        .from("fines")
        .select("payment_id, amount")
        .in("payment_id", paymentIds);

      if (finesError) throw finesError;
      fines = finesData || [];
    }

    // Aggregate stats per dinner
    const dinnerStats = dinners.map((dinner) => {
      const dinnerPayments =
        payments?.filter((p) => p.dinner_id === dinner.id) || [];

      const paymentsWithFines = dinnerPayments.map((payment) => {
        const paymentFines = fines.filter((f) => f.payment_id === payment.id);
        const totalFines = paymentFines.reduce((sum, f) => sum + f.amount, 0);
        return {
          ...payment,
          total_fines: totalFines,
          total_amount: payment.base_amount + totalFines,
        };
      });

      const paidPayments = paymentsWithFines.filter((p) => p.status === "paid");
      const pendingPayments = paymentsWithFines.filter(
        (p) => p.status === "pending"
      );

      return {
        dinner_id: dinner.id,
        dinner_name: dinner.name,
        dinner_date: dinner.event_date,
        total_payments: paymentsWithFines.length,
        paid_count: paidPayments.length,
        pending_count: pendingPayments.length,
        total_collected: paidPayments.reduce(
          (sum, p) => sum + p.total_amount,
          0
        ),
        total_pending: pendingPayments.reduce(
          (sum, p) => sum + p.total_amount,
          0
        ),
        total_fines: paymentsWithFines.reduce(
          (sum, p) => sum + p.total_fines,
          0
        ),
        base_amount: paymentsWithFines.length * 10,
      };
    });

    // Calculate overall season stats
    const overallStats = {
      total_dinners: dinners.length,
      total_payments: payments?.length || 0,
      total_collected: dinnerStats.reduce(
        (sum, d) => sum + d.total_collected,
        0
      ),
      total_pending: dinnerStats.reduce((sum, d) => sum + d.total_pending, 0),
      total_fines: fines.reduce((sum, f) => sum + f.amount, 0),
      base_amount: (payments?.length || 0) * 10,
      paid_count: payments?.filter((p) => p.status === "paid").length || 0,
      pending_count:
        payments?.filter((p) => p.status === "pending").length || 0,
      grand_total: 0,
    };

    overallStats.grand_total =
      overallStats.total_collected + overallStats.total_pending;

    return NextResponse.json({
      success: true,
      season: {
        id: season.id,
        name: `Temporada ${season.season_number}`,
        start_date: season.start_date,
        end_date: season.end_date,
      },
      stats: overallStats,
      dinners: dinnerStats,
    });
  } catch (error) {
    console.error("Fetch season stats error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to fetch season stats", details: errorMessage },
      { status: 500 }
    );
  }
}
