"use client";

import { useState } from "react";
import { artworkPreviewUrl, hasArtworkPreview } from "@/lib/artworkUrls";
import type { CutType } from "@/generated/prisma/client";

/**
 * A small preview of an ordered sticker. Kiss cut stickers sit on a white
 * backing square, like the real thing; die cut ones are cut to their shape,
 * so the artwork shows on its own with its transparency.
 */
export function StickerPreview({
  url,
  cutType,
  size = 44,
  extra = 0,
}: {
  url: string;
  cutType: CutType;
  /** Rendered size in px. */
  size?: number;
  /** Shows "+N" when an order has more designs than the one previewed. */
  extra?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = hasArtworkPreview(url) && !failed;
  const kissCut = cutType === "KISS";

  return (
    <span
      className={[
        "relative flex shrink-0 items-center justify-center rounded-[8px]",
        kissCut ? "bg-white p-1" : "",
      ].join(" ")}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL with its own transforms
        <img
          src={artworkPreviewUrl(url, size)}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          // The image can fail before React hydrates and misses onError; catch that on mount.
          ref={(img) => {
            if (img?.complete && img.naturalWidth === 0) setFailed(true);
          }}
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <span aria-hidden className="text-lg">
          🗂️
        </span>
      )}
      {extra > 0 && (
        <span className="absolute -bottom-1 -right-1 rounded-full bg-zap px-1.5 text-[10px] font-bold text-night">
          +{extra}
        </span>
      )}
    </span>
  );
}
