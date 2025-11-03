import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get("sortBy") || "name"; // name, producer, rating, vintage
    const order = searchParams.get("order") || "asc"; // asc, desc
    const producer = searchParams.get("producer") || "";
    const wineType = searchParams.get("wineType") || "";

    // Get all bottles with ratings
    let query = supabase.from("bottles").select(
      `
        id,
        name,
        producer,
        vintage,
        wine_type,
        description,
        photo_url,
        dinner:dinners(
          id,
          name,
          event_date
        ),
        brought_by_user:users!bottles_brought_by_fkey(id, name),
        ratings(
          id,
          score
        )
      `
    );

    // Apply filters
    if (producer) {
      query = query.ilike("producer", `%${producer}%`);
    }

    if (wineType && wineType !== "all") {
      query = query.eq("wine_type", wineType);
    }

    const { data: bottles, error } = await query;

    if (error) {
      console.error("Error fetching bottles:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch bottles",
        },
        { status: 500 }
      );
    }

    // Calculate average ratings and prepare data
    const bottlesWithStats = bottles.map((bottle: any) => {
      const ratings = bottle.ratings || [];
      const totalRatings = ratings.length;
      const averageRating =
        totalRatings > 0
          ? ratings.reduce((sum: number, r: any) => sum + r.score, 0) /
            totalRatings
          : 0;

      return {
        id: bottle.id,
        name: bottle.name,
        producer: bottle.producer,
        vintage: bottle.vintage,
        wine_type: bottle.wine_type,
        description: bottle.description,
        photo_url: bottle.photo_url,
        dinner: bottle.dinner,
        brought_by_user: bottle.brought_by_user,
        total_ratings: totalRatings,
        average_rating: parseFloat(averageRating.toFixed(1)),
      };
    });

    // Sort bottles
    bottlesWithStats.sort((a: any, b: any) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "");
          break;
        case "producer":
          comparison = (a.producer || "").localeCompare(b.producer || "");
          break;
        case "rating":
          comparison = b.average_rating - a.average_rating; // Higher ratings first by default
          break;
        case "vintage":
          comparison = (b.vintage || 0) - (a.vintage || 0); // Newer vintages first by default
          break;
        default:
          comparison = 0;
      }

      return order === "desc" ? -comparison : comparison;
    });

    // Get unique producers for filter
    const producers = [
      ...new Set(
        bottles
          .map((b: any) => b.producer)
          .filter((p: string) => p)
          .sort()
      ),
    ];

    return NextResponse.json({
      success: true,
      bottles: bottlesWithStats,
      producers,
      total: bottlesWithStats.length,
    });
  } catch (error) {
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
