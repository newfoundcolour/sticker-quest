"use client";

import { useState } from "react";
import { artworkPreviewUrl, hasArtworkPreview } from "@/lib/artworkUrls";

/**
 * The cart's artwork thumbnail: the customer's own file with its filename
 * underneath. Cloudinary renders a preview of PDFs and AI/EPS files too;
 * anything it can't shows a file icon.
 */
export function ArtworkPreview({ url, filename }: { url: string; filename: string }) {
  const [failed, setFailed] = useState(false);
  const showImage = hasArtworkPreview(url) && !failed;

  return (
    <figure className="flex w-24 shrink-0 flex-col items-center gap-2 sm:w-32">
      <div className="flex size-24 items-center justify-center overflow-hidden rounded-[14px] sm:size-32">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL with its own transforms
          <img
            src={artworkPreviewUrl(url, 256)}
            alt="Your artwork"
            loading="lazy"
            onError={() => setFailed(true)}
            // The image can fail before React hydrates and misses onError; catch that on mount.
            ref={(img) => {
              if (img?.complete && img.naturalWidth === 0) setFailed(true);
            }}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span role="img" aria-label="Your artwork file" className="text-4xl">
            🗂️
          </span>
        )}
      </div>
      <figcaption className="w-full truncate text-center text-[11px] text-dusk-note" title={filename}>
        {filename}
      </figcaption>
    </figure>
  );
}
