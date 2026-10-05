import type { CutType, Finish, OrderStatus, Shape, SheetCuts, StickerType } from "@/generated/prisma/client";
import { STICKER_TYPE_LABELS } from "@/lib/stickerTypeSlug";

/** Shared between the cart and checkout summaries — the configurator's own labels live inline there. */
export const CUT_TYPE_LABELS: Record<CutType, string> = {
  DIE: "Die Cut",
  KISS: "Kiss Cut",
};

export const SHAPE_LABELS: Record<Shape, string> = {
  SQUARE: "Square",
  CIRCLE: "Circle",
  RECTANGLE: "Rectangle",
  OVAL: "Oval",
  CUSTOM: "Custom Shape",
};

export const FINISH_LABELS: Record<Finish, string> = {
  MATTE: "Matte",
  GLOSS: "Gloss",
};

/** What a sticker sheet can be printed on. */
export const SHEET_MATERIALS: StickerType[] = ["VINYL", "HOLOGRAPHIC", "CHROME", "CLEAR"];

export const SHEET_CUTS_VALUES: SheetCuts[] = ["CUTS_1_4", "CUTS_5_8", "CUTS_9_12"];

export const SHEET_CUTS_LABELS: Record<SheetCuts, string> = {
  CUTS_1_4: "1–4 Stickers",
  CUTS_5_8: "5–8 Stickers",
  CUTS_9_12: "9–12 Stickers",
};

type ItemMaterial = { stickerType: StickerType; sheetMaterial?: StickerType | null };

/**
 * The material an item is printed on: a sticker sheet's chosen material, or
 * the type itself. Sheets carted before materials existed fall back to the type.
 */
export function itemMaterial(item: ItemMaterial): StickerType {
  return (item.stickerType === "STICKER_SHEETS" && item.sheetMaterial) || item.stickerType;
}

/**
 * Only vinyl and label sheets offer a matte/gloss choice; every other material
 * is MATTE, shown as its material name. Pass a sheet's material, not STICKER_SHEETS.
 */
export function hasFinishChoice(material: StickerType): boolean {
  return material === "VINYL" || material === "LABEL_SHEETS";
}

/** Vinyl and label sheets don't offer white ink. Pass a sheet's material, not STICKER_SHEETS. */
export function hasWhiteInkOption(material: StickerType): boolean {
  return material !== "VINYL" && material !== "LABEL_SHEETS";
}

/** Older non-vinyl GLOSS items keep reading "Gloss" so staff print them as ordered. */
export function finishLabel(item: ItemMaterial & { finish: Finish }): string {
  const material = itemMaterial(item);
  if (hasFinishChoice(material) || item.finish === "GLOSS") return FINISH_LABELS[item.finish];
  return STICKER_TYPE_LABELS[material];
}

/**
 * The one-line spec under an item's type in the cart, checkout and admin:
 * "Circle · Die Cut · Gloss", or for a sheet "Vinyl · Gloss · 5–8 Stickers".
 */
export function itemSpecLine(
  item: ItemMaterial & {
    shape: Shape;
    cutType: CutType;
    finish: Finish;
    sheetCuts?: SheetCuts | null;
  },
): string {
  if (item.stickerType !== "STICKER_SHEETS") {
    return `${SHAPE_LABELS[item.shape]} · ${CUT_TYPE_LABELS[item.cutType]} · ${finishLabel(item)}`;
  }
  const material = itemMaterial(item);
  return [
    material !== "STICKER_SHEETS" && STICKER_TYPE_LABELS[material],
    (hasFinishChoice(material) || item.finish === "GLOSS") && FINISH_LABELS[item.finish],
    item.sheetCuts && SHEET_CUTS_LABELS[item.sheetCuts],
  ]
    .filter(Boolean)
    .join(" · ");
}

/** What one unit of an item is: a sticker sheet, or a single sticker. */
export function unitNoun(stickerType: StickerType, count = 1): string {
  const noun = stickerType === "STICKER_SHEETS" ? "sheet" : "sticker";
  return count === 1 ? noun : `${noun}s`;
}

/**
 * The yes/no extras a customer said yes to, as one " · "-joined line —
 * anything they said no to is left out. Shared by the cart, checkout and admin.
 */
export function formatAddOns(item: {
  roundedCorners?: boolean;
  whiteInk: boolean;
  lamination: boolean;
}): string {
  return [
    item.roundedCorners && "Rounded corners",
    item.whiteInk && "White ink",
    item.lamination && "Laminated",
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Pipeline order per CLAUDE.md: awaiting_proof -> approved -> printing -> shipped. */
export const ORDER_STATUS_VALUES: OrderStatus[] = [
  "AWAITING_PROOF",
  "APPROVED",
  "PRINTING",
  "SHIPPED",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  AWAITING_PROOF: "Awaiting Proof",
  APPROVED: "Approved",
  PRINTING: "Printing",
  SHIPPED: "Shipped",
};

/** Used for the status badge in the admin orders list and detail view. */
export const ORDER_STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  AWAITING_PROOF: "bg-waypoint-gold/20 text-ink-navy",
  APPROVED: "bg-trail-teal/15 text-trail-teal",
  PRINTING: "bg-coral-signal/15 text-coral-signal",
  SHIPPED: "bg-ink-navy text-paper",
};
