import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/middleware";
import { parseBody } from "@/lib/api/parse-body";
import { patchPoll } from "@/lib/services/calendar";

const patchSchema = z.object({
  window_start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  window_end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  status: z.enum(["cancelled", "closed"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const parsed = await parseBody(request, patchSchema);
    if ("error" in parsed) return parsed.error;

    try {
      const poll = await patchPoll(id, parsed.data);
      if (!poll) {
        return NextResponse.json({ error: "Poll not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, poll });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update poll";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (error) {
    console.error("PATCH poll error:", error);
    return NextResponse.json({ error: "Failed to update poll" }, { status: 500 });
  }
}
