import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireFounder } from "@/lib/middleware";
import { parseBody } from "@/lib/api/parse-body";
import { respondToPoll } from "@/lib/services/calendar";

const respondSchema = z.object({
  days: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireFounder(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const parsed = await parseBody(request, respondSchema);
    if ("error" in parsed) return parsed.error;

    try {
      const result = await respondToPoll({
        pollId: id,
        userId: auth.userId,
        days: parsed.data.days,
      });
      return NextResponse.json({ success: true, ...result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to respond";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (error) {
    console.error("POST respond error:", error);
    return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
  }
}
