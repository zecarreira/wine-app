import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/middleware";
import { parseBody } from "@/lib/api/parse-body";
import { adminRoleSchema } from "@/lib/validations";

// PATCH - Update user role (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;

    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const parsed = await parseBody(request, adminRoleSchema);
    if ("error" in parsed) return parsed.error;
    const { role } = parsed.data;

    // If promoting to founder, check limit
    if (role === "founder") {
      const founders = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.role, ["admin", "founder"]));

      if (founders.length >= 7) {
        return NextResponse.json(
          { success: false, error: "Maximum of 7 founders reached (including admin)" },
          { status: 400 }
        );
      }
    }

    // Don't allow changing admin role
    const [targetUser] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (targetUser?.role === "admin") {
      return NextResponse.json({ success: false, error: "Cannot change admin role" }, { status: 400 });
    }

    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, targetUserId))
      .returning();

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
