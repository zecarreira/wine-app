import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/middleware";
import { parseBody } from "@/lib/api/parse-body";
import { chooseDate } from "@/lib/services/calendar";

const chooseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  organizer_id: z.uuid().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const parsed = await parseBody(request, chooseSchema);
    if ("error" in parsed) return parsed.error;

    try {
      const result = await chooseDate({
        pollId: id,
        date: parsed.data.date,
        organizerId: parsed.data.organizer_id,
        createdBy: auth.userId,
      });
      return NextResponse.json({
        success: true,
        dinner: result.dinner,
        poll: result.poll,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to choose date";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (error) {
    console.error("POST choose-date error:", error);
    return NextResponse.json(
      { error: "Failed to choose date" },
      { status: 500 }
    );
  }
}
