import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/middleware";

// GET - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const allUsers = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role, created_at: users.created_at })
      .from(users)
      .orderBy(desc(users.created_at));

    const founderCount = allUsers.filter(u => u.role === "founder" || u.role === "admin").length;

    return NextResponse.json({ success: true, users: allUsers, founderCount, maxFounders: 7 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
