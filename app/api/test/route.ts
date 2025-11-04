import { NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function GET() {
  try {
    // Test 1: Check if we can connect
    const { data: countData, error: countError } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (countError) throw countError;

    // Test 2: Get all users to verify the specific user exists
    const { data: allUsers, error: usersError } = await supabase
      .from("users")
      .select("id, name, email");

    console.log("All users:", allUsers);

    // Test 3: Try to get the specific user
    const userId = "00c8bb28-6a93-4ffc-9123-60edefe70c66";
    const { data: specificUser, error: specificError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    console.log("Specific user query:", { specificUser, specificError });

    return NextResponse.json({
      success: true,
      message: "Supabase connected! Database is ready.",
      tables_accessible: true,
      all_users: allUsers,
      specific_user: specificUser,
      specific_error: specificError,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
