import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth/auth";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  const session = await auth();
  const level = session?.user?.level ?? 0;
  if (!session || level < 10)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file)
    return NextResponse.json({ ok: false, error: "파일이 없습니다." }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ ok: false, error: "이미지 파일만 업로드 가능합니다." }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ ok: false, error: "파일 크기는 10MB 이하여야 합니다." }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const key = `handover/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000",
      })
    );
  } catch (err) {
    console.error("[upload] R2 error:", err);
    return NextResponse.json({ ok: false, error: "업로드에 실패했습니다." }, { status: 500 });
  }

  const url = `${process.env.NEXT_PUBLIC_CDN_URL}/${key}`;
  return NextResponse.json({ ok: true, url });
}
