import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, requireAuth } from "@/lib/middleware";
import { parseBody } from "@/lib/api/parse-body";
import { getOrCreateSettings, updateSettings } from "@/lib/services/deadline";

const patchSchema = z.object({
  dinner_interval_months: z.number().int().min(1).max(24).optional(),
  deadline_fine_amount: z.number().int().min(1).max(1000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const settings = await getOrCreateSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("GET settings error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const parsed = await parseBody(request, patchSchema);
    if ("error" in parsed) return parsed.error;

    if (
      parsed.data.dinner_interval_months == null &&
      parsed.data.deadline_fine_amount == null
    ) {
      return NextResponse.json(
        { error: "Nada para actualizar" },
        { status: 400 }
      );
    }

    const settings = await updateSettings({
      ...parsed.data,
      updated_by: auth.userId,
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("PATCH settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
