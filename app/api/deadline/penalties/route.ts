import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { listPenalties } from "@/lib/services/deadline";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const isAdmin = auth.userRole === "admin";
    // Fresh admin check is only on requireAdmin; role from JWT is fine for list filter
    const penalties = await listPenalties({
      userId: auth.userId,
      isAdmin,
    });

    return NextResponse.json({ success: true, penalties });
  } catch (error) {
    console.error("GET penalties error:", error);
    return NextResponse.json(
      { error: "Failed to load penalties" },
      { status: 500 }
    );
  }
}
