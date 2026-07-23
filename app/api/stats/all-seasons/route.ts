import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seasons, dinners, payments, fines } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const [allSeasons, allDinners, allPayments, allFines] = await Promise.all([
      db
        .select({ id: seasons.id, season_number: seasons.season_number, status: seasons.status, created_at: seasons.created_at })
        .from(seasons)
        .orderBy(desc(seasons.created_at)),
      db
        .select({ id: dinners.id, season_id: dinners.season_id, status: dinners.status })
        .from(dinners),
      db
        .select({
          id: payments.id,
          dinner_id: payments.dinner_id,
          base_amount: payments.base_amount,
          status: payments.status,
          season_id: dinners.season_id,
        })
        .from(payments)
        .leftJoin(dinners, eq(payments.dinner_id, dinners.id)),
      db
        .select({ id: fines.id, payment_id: fines.payment_id, amount: fines.amount })
        .from(fines),
    ]);

    const seasonStats = allSeasons.map((season) => {
      const seasonDinners = allDinners.filter((d) => d.season_id === season.id);
      const seasonPayments = allPayments.filter((p) => p.season_id === season.id);

      const seasonFinesTotal = seasonPayments.reduce((total, payment) => {
        const paymentFines = allFines.filter((f) => f.payment_id === payment.id);
        return total + paymentFines.reduce((sum, f) => sum + (f.amount || 0), 0);
      }, 0);

      const totalBase = seasonPayments.reduce((sum, p) => sum + (p.base_amount || 0), 0);
      const totalAmount = totalBase + seasonFinesTotal;

      const paidPayments = seasonPayments.filter((p) => p.status === "paid");
      const pendingPayments = seasonPayments.filter((p) => p.status === "pending");

      const totalPaid = paidPayments.reduce((sum, p) => {
        const paymentFines = allFines.filter((f) => f.payment_id === p.id);
        const finesAmount = paymentFines.reduce((s, f) => s + (f.amount || 0), 0);
        return sum + (p.base_amount || 0) + finesAmount;
      }, 0);

      const totalPending = pendingPayments.reduce((sum, p) => {
        const paymentFines = allFines.filter((f) => f.payment_id === p.id);
        const finesAmount = paymentFines.reduce((s, f) => s + (f.amount || 0), 0);
        return sum + (p.base_amount || 0) + finesAmount;
      }, 0);

      return {
        id: season.id,
        name: `Temporada ${season.season_number}`,
        season_number: season.season_number,
        is_active: season.status === "active",
        total_dinners: seasonDinners.length,
        completed_dinners: seasonDinners.filter((d) => d.status === "completed").length,
        total_amount: totalAmount,
        total_paid: totalPaid,
        total_pending: totalPending,
        total_fines: seasonFinesTotal,
      };
    });

    const grandTotals = {
      total_seasons: allSeasons.length,
      total_dinners: allDinners.length,
      completed_dinners: allDinners.filter((d) => d.status === "completed").length,
      total_amount: seasonStats.reduce((sum, s) => sum + s.total_amount, 0),
      total_paid: seasonStats.reduce((sum, s) => sum + s.total_paid, 0),
      total_pending: seasonStats.reduce((sum, s) => sum + s.total_pending, 0),
      total_fines: seasonStats.reduce((sum, s) => sum + s.total_fines, 0),
    };

    return NextResponse.json({
      grand_totals: grandTotals,
      seasons: seasonStats,
    });
  } catch (error) {
    console.error("Error in all-seasons stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
