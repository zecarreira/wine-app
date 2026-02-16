import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/middleware";

// PATCH - Update user role (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;

    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const [currentUser] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !["guest", "founder"].includes(role)) {
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
    }

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
