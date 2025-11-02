import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const jwtSecret = process.env.JWT_SECRET!;

// PATCH - Update user role (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;

    // Verify admin
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    let adminId: string;

    try {
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      adminId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user is admin
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", adminId)
      .single();

    if (userError || !currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !["guest", "founder"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      );
    }

    // If promoting to founder, check limit
    if (role === "founder") {
      const { data: founders } = await supabase
        .from("users")
        .select("id")
        .in("role", ["admin", "founder"]);

      const founderCount = founders?.length || 0;

      if (founderCount >= 7) {
        return NextResponse.json(
          {
            success: false,
            error: "Maximum of 7 founders reached (including admin)",
          },
          { status: 400 }
        );
      }
    }

    // Don't allow changing admin role
    const { data: targetUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", targetUserId)
      .single();

    if (targetUser?.role === "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot change admin role",
        },
        { status: 400 }
      );
    }

    // Update role
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ role })
      .eq("id", targetUserId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating user:", updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
