import type { CutType } from "@/generated/prisma/client";

/**
 * Option names and presets shared by the configurator and the cart, so a
 * choice reads the same in both places.
 */

/** The short line under each cut type. */
export const CUT_TYPE_HINTS: Record<CutType, string> = {
  DIE: "Through the backing",
  KISS: "On a backing square",
};

/** Preset sticker sizes are square, in mm. */
export const SIZE_PRESETS: { key: string; label: string; mm: number }[] = [
  { key: "small", label: "Small", mm: 50 },
  { key: "medium", label: "Medium", mm: 75 },
  { key: "large", label: "Large", mm: 100 },
  { key: "xlarge", label: "X-Large", mm: 125 },
];

/** Sticker sheets come in standard A-series paper sizes (portrait, in mm). */
export const SHEET_SIZE_PRESETS: { key: string; label: string; widthMm: number; heightMm: number }[] = [
  { key: "a6", label: "A6", widthMm: 105, heightMm: 148 },
  { key: "a5", label: "A5", widthMm: 148, heightMm: 210 },
  { key: "a4", label: "A4", widthMm: 210, heightMm: 297 },
];

export const QUANTITY_PRESETS = [50, 100, 200, 300, 500, 1000, 2000];

/** The preset an item's size matches ("Medium", "A5"), or undefined for a custom size. */
export function sizePresetLabel(isSheet: boolean, widthMm: number, heightMm: number): string | undefined {
  if (isSheet) return SHEET_SIZE_PRESETS.find((p) => p.widthMm === widthMm && p.heightMm === heightMm)?.label;
  if (widthMm !== heightMm) return undefined;
  return SIZE_PRESETS.find((p) => p.mm === widthMm)?.label;
}
