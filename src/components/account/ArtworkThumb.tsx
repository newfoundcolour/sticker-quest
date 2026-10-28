"use client";

import { useState } from "react";
import { artworkThumbnailUrl, hasArtworkPreview } from "@/lib/artworkUrls";

/** Artwork preview tile; falls back to a file icon if Cloudinary can't render one. */
export function ArtworkThumb({
  url,
  size = 48,
  extra = 0,
  className = "",
}: {
  url: string;
  /** Rendered size in px. */
  size?: number;
  /** Shows "+N" when an order has more items than the one previewed. */
  extra?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = hasArtworkPreview(url) && !failed;

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-[1.5px] border-grape/40 bg-white ${className}`}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL with its own transforms
        <img
          src={artworkThumbnailUrl(url, size)}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain"
        />
      ) : (
        <span aria-hidden className="text-lg">
          🗂️
        </span>
      )}
      {extra > 0 && (
        <span className="absolute bottom-0.5 right-0.5 rounded-full bg-night px-1.5 text-[10px] font-black text-white">
          +{extra}
        </span>
      )}
    </span>
  );
}
