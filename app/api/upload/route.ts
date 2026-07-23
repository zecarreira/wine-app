import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { uploadToR2, VALID_BUCKETS } from "@/lib/storage/r2";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucket = formData.get("bucket") as string;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (!bucket || !VALID_BUCKETS.includes(bucket as (typeof VALID_BUCKETS)[number])) {
      return NextResponse.json({ success: false, error: "Invalid bucket" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File too large (max 5MB)" }, { status: 400 });
    }

    const MIME_TO_EXT: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const fileExt = MIME_TO_EXT[file.type];
    if (!fileExt) {
      return NextResponse.json({ success: false, error: "Only JPEG, PNG, WebP, or GIF images allowed" }, { status: 400 });
    }

    const fileName = `${auth.userId}-${Date.now()}.${fileExt}`;
    const key = `${bucket}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { publicUrl, path } = await uploadToR2({
      key,
      body: buffer,
      contentType: file.type,
    });

    return NextResponse.json({ success: true, url: publicUrl, path });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: "Failed to upload" }, { status: 500 });
  }
}
