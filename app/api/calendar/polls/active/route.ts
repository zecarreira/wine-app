import { NextRequest, NextResponse } from "next/server";
import { requireFounder } from "@/lib/middleware";
import { getActivePollPayload } from "@/lib/services/calendar";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireFounder(request);
    if (auth instanceof NextResponse) return auth;

    const data = await getActivePollPayload(auth.userId);
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("GET active poll error:", error);
    return NextResponse.json(
      { error: "Failed to load poll" },
      { status: 500 }
    );
  }
}
