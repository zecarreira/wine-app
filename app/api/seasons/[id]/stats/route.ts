import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seasons, dinners, payments, fines, users } from "@/lib/schema";
import { eq, inArray, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

// GET /api/seasons/:id/stats - Estatísticas de pagamentos de uma season
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id: seasonId } = await params;

    const [season] = await db
      .select({ id: seasons.id, season_number: seasons.season_number, start_date: seasons.start_date, end_date: seasons.end_date })
      .from(seasons)
      .where(eq(seasons.id, seasonId))
      .limit(1);

    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    const seasonDinners = await db
      .select({ id: dinners.id, name: dinners.name, event_date: dinners.event_date })
      .from(dinners)
      .where(eq(dinners.season_id, seasonId))
      .orderBy(asc(dinners.event_date));

    if (seasonDinners.length === 0) {
      return NextResponse.json({
        success: true,
        season: { id: season.id, name: `Temporada ${season.season_number}`, start_date: season.start_date, end_date: season.end_date },
        stats: { total_dinners: 0, total_payments: 0, total_collected: 0, total_pending: 0, total_fines: 0, grand_total: 0 },
        dinners: [],
      });
    }

    const dinnerIds = seasonDinners.map((d) => d.id);

    const seasonPayments = await db
      .select({
        id: payments.id,
        dinner_id: payments.dinner_id,
        user_id: payments.user_id,
        base_amount: payments.base_amount,
        status: payments.status,
        paid_at: payments.paid_at,
        user: { id: users.id, name: users.name },
      })
      .from(payments)
      .leftJoin(users, eq(payments.user_id, users.id))
      .where(inArray(payments.dinner_id, dinnerIds));

    const paymentIds = seasonPayments.map((p) => p.id);
    let seasonFines: Array<{ payment_id: string; amount: number }> = [];

    if (paymentIds.length > 0) {
      seasonFines = await db
        .select({ payment_id: fines.payment_id, amount: fines.amount })
        .from(fines)
        .where(inArray(fines.payment_id, paymentIds)) as Array<{ payment_id: string; amount: number }>;
    }

    const dinnerStats = seasonDinners.map((dinner) => {
      const dinnerPayments = seasonPayments.filter((p) => p.dinner_id === dinner.id);
      const paymentsWithFines = dinnerPayments.map((payment) => {
        const paymentFines = seasonFines.filter((f) => f.payment_id === payment.id);
        const totalFines = paymentFines.reduce((sum, f) => sum + f.amount, 0);
        return { ...payment, total_fines: totalFines, total_amount: payment.base_amount + totalFines };
      });

      const paidPayments = paymentsWithFines.filter((p) => p.status === "paid");
      const pendingPayments = paymentsWithFines.filter((p) => p.status === "pending");

      return {
        dinner_id: dinner.id,
        dinner_name: dinner.name,
        dinner_date: dinner.event_date,
        total_payments: paymentsWithFines.length,
        paid_count: paidPayments.length,
        pending_count: pendingPayments.length,
        total_collected: paidPayments.reduce((sum, p) => sum + p.total_amount, 0),
        total_pending: pendingPayments.reduce((sum, p) => sum + p.total_amount, 0),
        total_fines: paymentsWithFines.reduce((sum, p) => sum + p.total_fines, 0),
        base_amount: paymentsWithFines.length * 10,
      };
    });

    const overallStats = {
      total_dinners: seasonDinners.length,
      total_payments: seasonPayments.length,
      total_collected: dinnerStats.reduce((sum, d) => sum + d.total_collected, 0),
      total_pending: dinnerStats.reduce((sum, d) => sum + d.total_pending, 0),
      total_fines: seasonFines.reduce((sum, f) => sum + f.amount, 0),
      base_amount: seasonPayments.length * 10,
      paid_count: seasonPayments.filter((p) => p.status === "paid").length,
      pending_count: seasonPayments.filter((p) => p.status === "pending").length,
      grand_total: 0,
    };
    overallStats.grand_total = overallStats.total_collected + overallStats.total_pending;

    return NextResponse.json({
      success: true,
      season: { id: season.id, name: `Temporada ${season.season_number}`, start_date: season.start_date, end_date: season.end_date },
      stats: overallStats,
      dinners: dinnerStats,
    });
  } catch (error) {
    console.error("Fetch season stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch season stats" },
      { status: 500 }
    );
  }
}
