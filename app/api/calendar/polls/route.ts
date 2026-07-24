import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/middleware";
import { openPoll } from "@/lib/services/calendar";

const postSchema = z.object({
  window_start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  window_end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    let body: z.infer<typeof postSchema> = {};
    try {
      const text = await request.text();
      if (text.trim()) {
        const raw = JSON.parse(text);
        const result = postSchema.safeParse(raw);
        if (!result.success) {
          return NextResponse.json(
            { error: result.error.issues[0]?.message ?? "Invalid body" },
            { status: 400 }
          );
        }
        body = result.data;
      }
    } catch {
      body = {};
    }

    try {
      const poll = await openPoll({
        createdBy: auth.userId,
        window_start: body.window_start,
        window_end: body.window_end,
      });
      return NextResponse.json({ success: true, poll }, { status: 201 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to open poll";
      const status = msg.includes("Já existe") ? 409 : 400;
      return NextResponse.json({ error: msg }, { status });
    }
  } catch (error) {
    console.error("POST poll error:", error);
    return NextResponse.json({ error: "Failed to open poll" }, { status: 500 });
  }
}
