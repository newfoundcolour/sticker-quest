"use client";

import { useState } from "react";
import { artworkPreviewUrl, artworkThumbnailUrl, hasArtworkPreview } from "@/lib/artworkUrls";

const CHECKER_STYLE = {
  backgroundColor: "#ffffff",
  backgroundImage:
    "linear-gradient(45deg, #e5e2ed 25%, transparent 25%), linear-gradient(-45deg, #e5e2ed 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e2ed 75%), linear-gradient(-45deg, transparent 75%, #e5e2ed 75%)",
  backgroundSize: "10px 10px",
  backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0",
};

/** Artwork preview tile; falls back to a file icon if Cloudinary can't render one. */
export function ArtworkThumb({
  url,
  size = 48,
  extra = 0,
  className = "",
  checker = false,
}: {
  url: string;
  /** Rendered size in px. */
  size?: number;
  /** Shows "+N" when an order has more items than the one previewed. */
  extra?: number;
  className?: string;
  /** A transparency checkerboard behind the art (admin), so white artwork stays visible. */
  checker?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = hasArtworkPreview(url) && !failed;

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-[1.5px] ${
        checker ? "border-admin-line" : "border-grape/40 bg-white"
      } ${className}`}
      style={{ width: size, height: size, ...(checker ? CHECKER_STYLE : {}) }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL with its own transforms
        <img
          src={checker ? artworkPreviewUrl(url, size) : artworkThumbnailUrl(url, size)}
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
