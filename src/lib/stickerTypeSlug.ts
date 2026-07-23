import type { StickerType } from "@/generated/prisma/client";

export const STICKER_TYPE_SLUGS: Record<StickerType, string> = {
  VINYL: "vinyl",
  HOLOGRAPHIC: "holographic",
  CHROME: "chrome",
  CLEAR: "clear",
  ECONOMY: "economy",
  STICKER_SHEETS: "sticker-sheets",
  LABEL_SHEETS: "label-sheets",
};

const SLUG_TO_STICKER_TYPE: Record<string, StickerType> = Object.fromEntries(
  Object.entries(STICKER_TYPE_SLUGS).map(([type, slug]) => [slug, type as StickerType]),
);

export function slugToStickerType(slug: string): StickerType | undefined {
  return SLUG_TO_STICKER_TYPE[slug];
}

export const STICKER_TYPE_LABELS: Record<StickerType, string> = {
  VINYL: "Vinyl",
  HOLOGRAPHIC: "Holographic",
  CHROME: "Chrome",
  CLEAR: "Clear",
  ECONOMY: "Economy",
  STICKER_SHEETS: "Sticker Sheets",
  LABEL_SHEETS: "Label Sheets",
};
