import { NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Supabase connected! Database is ready.",
      tables_accessible: true,
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
