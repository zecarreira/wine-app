import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allUsers = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users);

    const userId = "00c8bb28-6a93-4ffc-9123-60edefe70c66";
    const [specificUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: "Neon connected! Database is ready.",
      tables_accessible: true,
      all_users: allUsers,
      specific_user: specificUser || null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unknown error";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
