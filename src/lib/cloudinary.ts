import { v2 as cloudinary } from "cloudinary";
import { MAX_ARTWORK_BYTES } from "@/lib/uploadConstants";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export class ArtworkTooLargeError extends Error {
  constructor() {
    super(`Artwork exceeds the ${MAX_ARTWORK_BYTES / 1024 / 1024}MB limit`);
    this.name = "ArtworkTooLargeError";
  }
}

/**
 * Uploads customer artwork to Cloudinary and returns the resulting secure
 * URL. resource_type "auto" so this accepts images as well as PDFs/vectors,
 * matching the Upload step's "all formats" copy.
 */
export async function uploadArtwork(
  buffer: Buffer,
  filename: string,
): Promise<{ url: string; publicId: string }> {
  if (buffer.byteLength > MAX_ARTWORK_BYTES) {
    throw new ArtworkTooLargeError();
  }

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "sticker-quest/artwork",
          resource_type: "auto",
          filename_override: filename,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Cloudinary upload failed"));
          else resolve(result);
        },
      );
      stream.end(buffer);
    },
  );

  return { url: result.secure_url, publicId: result.public_id };
}
