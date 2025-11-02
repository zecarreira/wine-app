import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";
import { requireFounder, authenticate } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);

    const { data: dinners, error } = await supabase
      .from("dinners")
      .select(
        `
        *,
        created_by_user:users!created_by(id, name, email)
      `
      )
      .order("event_date", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      dinners: dinners || [],
    });
  } catch (error) {
    console.error("Fetch dinners error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to fetch dinners", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireFounder(request);

    if (auth instanceof NextResponse) {
      return auth;
    }

    const body = await request.json();
    const { name, event_date, location, is_blind } = body;

    if (!name || !event_date) {
      return NextResponse.json(
        { error: "Name and event date are required" },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(event_date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const { data: newDinner, error: insertError } = await supabase
      .from("dinners")
      .insert({
        name,
        event_date,
        location: location || null,
        is_blind: is_blind || false,
        created_by: auth.userId,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(
      {
        success: true,
        message: "Dinner created successfully",
        dinner: newDinner,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create dinner error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Failed to create dinner", details: errorMessage },
      { status: 500 }
    );
  }
}
