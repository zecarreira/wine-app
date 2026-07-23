import { NextResponse } from "next/server";
import type { z } from "zod";

export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return {
      error: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Validation failed";
    return {
      error: NextResponse.json(
        { error: message, issues: result.error.issues },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}
