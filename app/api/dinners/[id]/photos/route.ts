import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dinner_photos, dinners, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import jwt from "jsonwebtoken";

// GET - List all photos for a dinner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dinnerId } = await params;
    const uploadedByUser = alias(users, "uploaded_by_user");

    const photos = await db
      .select({
        id: dinner_photos.id,
        dinner_id: dinner_photos.dinner_id,
        photo_url: dinner_photos.photo_url,
        uploaded_by: dinner_photos.uploaded_by,
        created_at: dinner_photos.created_at,
        uploaded_by_user: { id: uploadedByUser.id, name: uploadedByUser.name },
      })
      .from(dinner_photos)
      .leftJoin(uploadedByUser, eq(dinner_photos.uploaded_by, uploadedByUser.id))
      .where(eq(dinner_photos.dinner_id, dinnerId))
      .orderBy(desc(dinner_photos.created_at));

    return NextResponse.json({ success: true, photos });
  } catch (error: unknown) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add photo to dinner
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dinnerId } = await params;

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    let userId: string;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const [dinner] = await db
      .select({ id: dinners.id })
      .from(dinners)
      .where(eq(dinners.id, dinnerId))
      .limit(1);

    if (!dinner) {
      return NextResponse.json({ success: false, error: "Dinner not found" }, { status: 404 });
    }

    const body = await request.json();
    const { photo_url } = body;

    if (!photo_url) {
      return NextResponse.json({ success: false, error: "Photo URL required" }, { status: 400 });
    }

    const uploadedByUser = alias(users, "uploaded_by_user");

    const [newPhoto] = await db
      .insert(dinner_photos)
      .values({ dinner_id: dinnerId, photo_url, uploaded_by: userId })
      .returning();

    const [photoWithUser] = await db
      .select({
        id: dinner_photos.id,
        dinner_id: dinner_photos.dinner_id,
        photo_url: dinner_photos.photo_url,
        uploaded_by: dinner_photos.uploaded_by,
        created_at: dinner_photos.created_at,
        uploaded_by_user: { id: uploadedByUser.id, name: uploadedByUser.name },
      })
      .from(dinner_photos)
      .leftJoin(uploadedByUser, eq(dinner_photos.uploaded_by, uploadedByUser.id))
      .where(eq(dinner_photos.id, newPhoto.id))
      .limit(1);

    return NextResponse.json({ success: true, photo: photoWithUser });
  } catch (error: unknown) {
    console.error("Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
