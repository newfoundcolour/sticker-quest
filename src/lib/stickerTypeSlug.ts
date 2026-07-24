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

export const STICKER_TYPE_DESCRIPTIONS: Record<StickerType, string> = {
  VINYL: "Durable, all-purpose stickers for indoor or outdoor use.",
  HOLOGRAPHIC: "Rainbow-shift finish that catches the light.",
  CHROME: "Mirror-like metallic finish.",
  CLEAR: "Transparent background — the print shows through.",
  ECONOMY: "Budget-friendly, built for short runs and testing.",
  STICKER_SHEETS: "Several sticker designs cut from one sheet.",
  LABEL_SHEETS: "Rectangular labels, sheet-fed for packaging and jars.",
};

/** Shared with the nav bar's search dropdown, which mirrors this grouping. */
export const STICKER_TYPE_GROUPS: { title: string; types: StickerType[] }[] = [
  {
    title: "Individually cut",
    types: ["VINYL", "HOLOGRAPHIC", "CHROME", "CLEAR", "ECONOMY"],
  },
  {
    title: "Sheets",
    types: ["STICKER_SHEETS", "LABEL_SHEETS"],
  },
];
