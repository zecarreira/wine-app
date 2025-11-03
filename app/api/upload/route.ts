import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const jwtSecret = process.env.JWT_SECRET!;

export async function POST(request: NextRequest) {
  console.log("🚀 ===== UPLOAD ROUTE CALLED =====");

  try {
    console.log("🔑 Checking auth header...");
    const authHeader = request.headers.get("Authorization");
    console.log("🔑 Auth header exists?", !!authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ FAIL: No auth header");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("🎫 Token extracted, length:", token.length);

    let userId: string;
    try {
      console.log("🔐 Verifying JWT...");
      console.log("🔐 JWT_SECRET exists?", !!jwtSecret);
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      userId = decoded.userId;
      console.log("✅ JWT verified! User ID:", userId);
    } catch (error: any) {
      console.log("❌ JWT verification failed:", error.message);
      return NextResponse.json(
        { success: false, error: "Invalid token: " + error.message },
        { status: 401 }
      );
    }

    console.log("🗄️ Creating Supabase client...");
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucket = formData.get("bucket") as string;

    console.log("📦 File received:", !!file, "Bucket:", bucket);

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (
      !bucket ||
      !["bottle-photos", "dinner-photos", "profile-photos"].includes(bucket)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid bucket" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File too large (max 5MB)" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Only images allowed" },
        { status: 400 }
      );
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    console.log("📸 Uploading file:", fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    console.log("✅ Upload success! URL:", publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: fileName,
    });
  } catch (error: any) {
    console.error("💥 Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload",
      },
      { status: 500 }
    );
  }
}
