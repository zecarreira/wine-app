import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/middleware";
import { parseBody } from "@/lib/api/parse-body";
import { patchPenalty } from "@/lib/services/deadline";

const patchSchema = z.object({
  amount: z.number().int().positive().optional(),
  status: z.enum(["pending", "waived"]).optional(),
  user_id: z.uuid().optional(),
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

    const updated = await patchPenalty(id, {
      ...parsed.data,
      adminUserId: auth.userId,
    });

    if (!updated) {
      return NextResponse.json({ error: "Penalty not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, penalty: updated });
  } catch (error) {
    console.error("PATCH penalty error:", error);
    return NextResponse.json(
      { error: "Failed to update penalty" },
      { status: 500 }
    );
  }
}
