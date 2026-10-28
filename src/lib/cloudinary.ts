import { v2 as cloudinary } from "cloudinary";
import { MAX_ARTWORK_BYTES } from "@/lib/uploadConstants";
import { isOwnArtworkUrl } from "@/lib/artworkUrls";

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

// The browser->server leg can finish (and show 100%) well before Cloudinary
// acks the server->Cloudinary leg. Without a timeout, a stalled Cloudinary
// connection leaves the upload_stream callback never firing and the client
// waiting forever.
const CLOUDINARY_UPLOAD_TIMEOUT_MS = 30_000;

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
      const timer = setTimeout(() => {
        reject(new Error("Cloudinary upload timed out"));
      }, CLOUDINARY_UPLOAD_TIMEOUT_MS);

      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "sticker-quest/artwork",
          resource_type: "auto",
          filename_override: filename,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          clearTimeout(timer);
          if (error || !result) reject(error ?? new Error("Cloudinary upload failed"));
          else resolve(result);
        },
      );
      stream.end(buffer);
    },
  );

  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Copies existing artwork into a brand-new Cloudinary asset (for reorders),
 * so two orders never share — or can delete — one file. Only our own
 * artwork URLs are accepted, so Cloudinary is never asked to fetch an
 * arbitrary address.
 */
export async function copyArtwork(sourceUrl: string): Promise<{ url: string; publicId: string }> {
  if (!isOwnArtworkUrl(sourceUrl)) throw new Error("Refusing to copy artwork from outside our Cloudinary folder");

  const upload = cloudinary.uploader.upload(sourceUrl, {
    folder: "sticker-quest/artwork",
    resource_type: "auto",
    use_filename: true,
    unique_filename: true,
  });
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Cloudinary copy timed out")), CLOUDINARY_UPLOAD_TIMEOUT_MS),
  );
  const result = await Promise.race([upload, timeout]);
  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * A plain `download` attribute is ignored by browsers for cross-origin
 * assets, so a link straight to `secure_url` just opens the file in-tab.
 * Cloudinary's bare fl_attachment flag sets Content-Disposition: attachment
 * on its own response, forcing a real download regardless of origin — and
 * it already returns the correct original filename on its own, since upload
 * used `use_filename: true`. Do NOT append `:<filename>` here — Cloudinary
 * chokes on filenames containing a "." (e.g. an extension), responding with
 * `400 Invalid flag in transformation: <ext>` instead of the file.
 */
export function toArtworkDownloadUrl(url: string): string {
  return url.replace("/upload/", "/upload/fl_attachment/");
}
