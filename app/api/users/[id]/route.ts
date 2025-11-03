import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user basic info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email, role, created_at, profile_photo_url")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    } // Get dinners created by user
    const { data: createdDinners } = await supabase
      .from("dinners")
      .select("id")
      .eq("created_by", userId);

    // Get dinners where user has rated bottles
    const { data: ratedBottles } = await supabase
      .from("ratings")
      .select("bottle:bottles(dinner_id)")
      .eq("user_id", userId);

    const dinnerIdsFromRatings =
      ratedBottles?.map((r: any) => r.bottle?.dinner_id).filter(Boolean) || [];

    const uniqueDinnerIds = new Set([
      ...(createdDinners?.map((d) => d.id) || []),
      ...dinnerIdsFromRatings,
    ]);

    const totalDinners = uniqueDinnerIds.size;

    // Get all ratings by user
    const { data: userRatings } = await supabase
      .from("ratings")
      .select(
        `
        id,
        score,
        tasting_notes,
        created_at,
        bottle:bottles(
          id,
          name,
          producer,
          vintage,
          photo_url,
          dinner:dinners(id, name, event_date, status, is_blind)
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Get bottles brought by user
    const { data: bottlesBrought } = await supabase
      .from("bottles")
      .select(
        `
        id,
        name,
        producer,
        vintage,
        photo_url,
        dinner:dinners(id, name, event_date)
      `
      )
      .eq("brought_by", userId);

    // Calculate stats
    const totalRatings = userRatings?.length || 0;
    const totalBottlesBrought = bottlesBrought?.length || 0;

    const averageRating =
      totalRatings > 0
        ? (
            userRatings!.reduce((sum, r) => sum + r.score, 0) / totalRatings
          ).toFixed(1)
        : null;

    // Find favorite wine (highest rated)
    const favoriteWine =
      userRatings && userRatings.length > 0
        ? userRatings.reduce((prev, current) =>
            current.score > prev.score ? current : prev
          )
        : null;

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        stats: {
          total_dinners: totalDinners,
          total_ratings: totalRatings,
          total_bottles_brought: totalBottlesBrought,
          average_rating: averageRating,
        },
        favorite_wine: favoriteWine,
        recent_ratings: userRatings?.slice(0, 5) || [],
        bottles_brought: bottlesBrought || [],
      },
    });
  } catch (error: any) {
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

// PATCH /api/users/:id - Update user profile photo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { profile_photo_url } = body;

    if (!profile_photo_url) {
      return NextResponse.json(
        { success: false, error: "Profile photo URL is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update user profile photo
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({ profile_photo_url })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update profile photo" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
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
