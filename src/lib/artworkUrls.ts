/**
 * Client-safe helpers for customer artwork stored on Cloudinary (no SDK
 * import here — see cloudinary.ts for uploads).
 */

const ARTWORK_FOLDER = "sticker-quest/artwork/";

/**
 * True only for artwork we uploaded: https, Cloudinary's delivery host, our
 * cloud name and our artwork folder. Used to reject artwork URLs sent from
 * the browser that point anywhere else.
 */
export function isOwnArtworkUrl(url: unknown, cloudName = process.env.CLOUDINARY_CLOUD_NAME): boolean {
  if (typeof url !== "string" || !cloudName) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return (
    parsed.protocol === "https:" &&
    parsed.hostname === "res.cloudinary.com" &&
    parsed.pathname.startsWith(`/${cloudName}/`) &&
    parsed.pathname.includes(`/upload/`) &&
    parsed.pathname.includes(`/${ARTWORK_FOLDER}`)
  );
}

/**
 * A small square preview of any artwork: Cloudinary rasterises the first
 * page of PDFs/AI/EPS to PNG, and crops images to fit.
 */
export function artworkThumbnailUrl(url: string, size = 96): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  // Only image/* uploads can be transformed; Cloudinary stores PDFs as images too.
  if (url.includes("/raw/upload/")) return url;
  const transform = `c_pad,b_white,w_${size * 2},h_${size * 2},pg_1,f_png`;
  return url.replace("/upload/", `/upload/${transform}/`);
}

/**
 * A larger preview that keeps the artwork's own shape and transparency
 * (no white padding), for showing it on a coloured tile like the cart's.
 */
export function artworkPreviewUrl(url: string, size = 160): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  if (url.includes("/raw/upload/")) return url;
  const transform = `c_fit,w_${size * 2},h_${size * 2},pg_1,f_png`;
  return url.replace("/upload/", `/upload/${transform}/`);
}

/** Whether a preview can be generated at all (raw uploads like .zip can't). */
export function hasArtworkPreview(url: string): boolean {
  return url.includes("res.cloudinary.com") && !url.includes("/raw/upload/");
}
