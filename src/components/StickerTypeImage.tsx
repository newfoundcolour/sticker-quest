import Image from "next/image";
import { STICKER_TYPE_IMAGES } from "@/lib/stickerTypeSlug";
import type { StickerType } from "@/generated/prisma/client";

export function StickerTypeImage({
  type,
  className,
}: {
  type: StickerType;
  className?: string;
}) {
  const src = STICKER_TYPE_IMAGES[type];

  if (!src) {
    return (
      <span
        aria-hidden
        className={`flex items-center justify-center rounded-lg border-2 border-dashed border-current opacity-30 ${className ?? ""}`}
      >
        <span className="text-xs font-black">?</span>
      </span>
    );
  }

  return (
    <span className={`flex items-center justify-center ${className ?? ""}`}>
      <Image src={src} alt="" width={96} height={96} className="h-full w-full object-contain" />
    </span>
  );
}
