import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const VALID_BUCKETS = [
  "bottle-photos",
  "dinner-photos",
  "profile-photos",
] as const;

export type ValidBucket = (typeof VALID_BUCKETS)[number];

let client: S3Client | null = null;

/** Lazy S3 client for Cloudflare R2 (uses process.env, not lib/env). */
export function getR2Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

export async function uploadToR2(params: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<{ publicUrl: string; path: string }> {
  const r2 = getR2Client();

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${params.key}`;
  return { publicUrl, path: params.key };
}
