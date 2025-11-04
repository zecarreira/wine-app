import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all seasons with their stats
    const { data: seasons, error: seasonsError } = await supabase
      .from("seasons")
      .select("id, season_number, status, created_at")
      .order("created_at", { ascending: false });

    if (seasonsError) {
      console.error("Error fetching seasons:", seasonsError);
      return NextResponse.json(
        { error: "Failed to fetch seasons" },
        { status: 500 }
      );
    }

    // Get all dinners
    const { data: dinners, error: dinnersError } = await supabase
      .from("dinners")
      .select("id, season_id, status");

    if (dinnersError) {
      console.error("Error fetching dinners:", dinnersError);
      return NextResponse.json(
        { error: "Failed to fetch dinners" },
        { status: 500 }
      );
    }

    // Get all payments
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("*, dinner:dinners(season_id)");

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
      return NextResponse.json(
        { error: "Failed to fetch payments" },
        { status: 500 }
      );
    }

    // Get all fines
    const { data: fines, error: finesError } = await supabase
      .from("fines")
      .select("*");

    if (finesError) {
      console.error("Error fetching fines:", finesError);
      return NextResponse.json(
        { error: "Failed to fetch fines" },
        { status: 500 }
      );
    }

    // Calculate per-season stats
    const seasonStats = seasons?.map((season) => {
      const seasonDinners =
        dinners?.filter((d) => d.season_id === season.id) || [];
      const seasonPayments =
        payments?.filter(
          (p: any) => p.dinner && p.dinner.season_id === season.id
        ) || [];

      const seasonFines = seasonPayments.reduce(
        (total: number, payment: any) => {
          const paymentFines =
            fines?.filter((f) => f.payment_id === payment.id) || [];
          return (
            total + paymentFines.reduce((sum, f) => sum + (f.amount || 0), 0)
          );
        },
        0
      );

      const totalBase = seasonPayments.reduce(
        (sum: number, p: any) => sum + (p.base_amount || 0),
        0
      );
      const totalAmount = totalBase + seasonFines;

      const paidPayments = seasonPayments.filter(
        (p: any) => p.status === "paid"
      );
      const pendingPayments = seasonPayments.filter(
        (p: any) => p.status === "pending"
      );

      const totalPaid = paidPayments.reduce((sum: number, p: any) => {
        const paymentFines = fines?.filter((f) => f.payment_id === p.id) || [];
        const finesAmount = paymentFines.reduce(
          (s, f) => s + (f.amount || 0),
          0
        );
        return sum + (p.base_amount || 0) + finesAmount;
      }, 0);

      const totalPending = pendingPayments.reduce((sum: number, p: any) => {
        const paymentFines = fines?.filter((f) => f.payment_id === p.id) || [];
        const finesAmount = paymentFines.reduce(
          (s, f) => s + (f.amount || 0),
          0
        );
        return sum + (p.base_amount || 0) + finesAmount;
      }, 0);

      return {
        id: season.id,
        name: `Temporada ${season.season_number}`,
        season_number: season.season_number,
        is_active: season.status === "active",
        total_dinners: seasonDinners.length,
        completed_dinners: seasonDinners.filter((d) => d.status === "completed")
          .length,
        total_amount: totalAmount,
        total_paid: totalPaid,
        total_pending: totalPending,
        total_fines: seasonFines,
      };
    });

    // Calculate grand totals
    const grandTotals = {
      total_seasons: seasons?.length || 0,
      total_dinners: dinners?.length || 0,
      completed_dinners:
        dinners?.filter((d) => d.status === "completed").length || 0,
      total_amount:
        seasonStats?.reduce((sum, s) => sum + s.total_amount, 0) || 0,
      total_paid: seasonStats?.reduce((sum, s) => sum + s.total_paid, 0) || 0,
      total_pending:
        seasonStats?.reduce((sum, s) => sum + s.total_pending, 0) || 0,
      total_fines: seasonStats?.reduce((sum, s) => sum + s.total_fines, 0) || 0,
    };

    return NextResponse.json({
      grand_totals: grandTotals,
      seasons: seasonStats,
    });
  } catch (error) {
    console.error("Error in all-seasons stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
