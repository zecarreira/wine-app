import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const jwtSecret = process.env.JWT_SECRET!;

// GET - List all photos for a dinner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dinnerId } = await params;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: photos, error } = await supabase
      .from("dinner_photos")
      .select(
        `
        *,
        uploaded_by_user:users!dinner_photos_uploaded_by_fkey(id, name)
      `
      )
      .eq("dinner_id", dinnerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching photos:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      photos: photos || [],
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

// POST - Add photo to dinner
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dinnerId } = await params;

    // Verify JWT token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    let userId: string;

    try {
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify dinner exists
    const { data: dinner, error: dinnerError } = await supabase
      .from("dinners")
      .select("id")
      .eq("id", dinnerId)
      .single();

    if (dinnerError || !dinner) {
      return NextResponse.json(
        { success: false, error: "Dinner not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { photo_url } = body;

    if (!photo_url) {
      return NextResponse.json(
        { success: false, error: "Photo URL required" },
        { status: 400 }
      );
    }

    // Insert photo record
    const { data: photo, error: insertError } = await supabase
      .from("dinner_photos")
      .insert({
        dinner_id: dinnerId,
        photo_url,
        uploaded_by: userId,
      })
      .select(
        `
        *,
        uploaded_by_user:users!dinner_photos_uploaded_by_fkey(id, name)
      `
      )
      .single();

    if (insertError) {
      console.error("Error inserting photo:", insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      photo,
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
