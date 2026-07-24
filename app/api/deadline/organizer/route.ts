import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/middleware";
import { parseBody } from "@/lib/api/parse-body";
import {
  setResponsibleOrganizer,
  getDeadlineStatus,
} from "@/lib/services/deadline";

const patchSchema = z.object({
  organizer_id: z.uuid().nullable(),
});

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const parsed = await parseBody(request, patchSchema);
    if ("error" in parsed) return parsed.error;

    await setResponsibleOrganizer(parsed.data.organizer_id);
    const status = await getDeadlineStatus();
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("PATCH deadline organizer error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update organizer";
    const status =
      message.includes("inválido") || message.includes("activo") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
