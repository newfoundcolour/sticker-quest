import { NextResponse } from "next/server";
import { ArtworkTooLargeError, uploadArtwork } from "@/lib/cloudinary";
import { MAX_ARTWORK_BYTES } from "@/lib/uploadConstants";
import type { UploadArtworkResult } from "@/lib/uploadConstants";

/**
 * Route handler (rather than a Server Action) so the client can drive the
 * request with XMLHttpRequest and get real upload-progress events — Server
 * Actions don't expose those.
 */
export async function POST(request: Request): Promise<NextResponse<UploadArtworkResult>> {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file was received." });
  }

  if (file.size > MAX_ARTWORK_BYTES) {
    return NextResponse.json({ ok: false, error: `File is too large — max ${MAX_ARTWORK_BYTES / 1024 / 1024}MB.` });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadArtwork(buffer, file.name);
    return NextResponse.json({ ok: true, url, filename: file.name });
  } catch (error) {
    if (error instanceof ArtworkTooLargeError) {
      return NextResponse.json({ ok: false, error: error.message });
    }
    console.error("Artwork upload failed:", error);
    return NextResponse.json({ ok: false, error: "Upload failed — please try again." });
  }
}
