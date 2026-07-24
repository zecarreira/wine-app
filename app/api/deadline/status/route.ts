import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { getDeadlineStatus } from "@/lib/services/deadline";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const status = await getDeadlineStatus();
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("GET deadline status error:", error);
    return NextResponse.json(
      { error: "Failed to load deadline status" },
      { status: 500 }
    );
  }
}
