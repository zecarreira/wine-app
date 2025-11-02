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
      .select("id, name, email, role, created_at")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get dinners attended (as creator or participant with ratings)
    const { data: attendedDinners } = await supabase
      .from("dinners")
      .select(
        `
        id,
        name,
        event_date,
        location,
        status,
        created_by,
        bottles!inner(
          id,
          ratings!inner(user_id)
        )
      `
      )
      .or(`created_by.eq.${userId},bottles.ratings.user_id.eq.${userId}`);

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
          dinner:dinners(id, name, event_date)
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
    const totalDinners = attendedDinners?.length || 0;
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
