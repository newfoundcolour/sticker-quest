import type { CutType, Finish, OrderStatus, Shape, SheetCuts, StickerType } from "@/generated/prisma/client";
import { STICKER_TYPE_LABELS } from "@/lib/stickerTypeSlug";
import { cmToMm, formatMmValue } from "@/lib/pricingUtils";

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

/**
 * Label sheets are always kiss cut (the labels peel off a backing sheet), so
 * customers only pick a shape. Sticker sheets are pinned separately.
 */
export function hasCutChoice(stickerType: StickerType): boolean {
  return stickerType !== "LABEL_SHEETS";
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
    return [
      SHAPE_LABELS[item.shape],
      hasCutChoice(item.stickerType) && CUT_TYPE_LABELS[item.cutType],
      finishLabel(item),
    ]
      .filter(Boolean)
      .join(" · ");
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

/** "Vinyl" → "Vinyl Stickers"; the sheet types already say what they are. */
export function productName(stickerType: StickerType): string {
  const label = STICKER_TYPE_LABELS[stickerType];
  return label.endsWith("Sheets") ? label : `${label} Stickers`;
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

/** Pipeline order per CLAUDE.md: awaiting_proof -> awaiting_approval -> approved -> printing -> shipped. */
export const ORDER_STATUS_VALUES: OrderStatus[] = [
  "AWAITING_PROOF",
  "AWAITING_APPROVAL",
  "APPROVED",
  "PRINTING",
  "SHIPPED",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  AWAITING_PROOF: "Awaiting Proof",
  AWAITING_APPROVAL: "Awaiting Approval",
  APPROVED: "Approved",
  PRINTING: "Printing",
  SHIPPED: "Shipped",
};

/**
 * Used for the status badge in the admin orders list and detail view.
 * Awaiting Approval is outlined Waypoint Gold: the ball is in the customer's court.
 * (Ring, not border, so it survives the select's border-0 in the orders table.)
 */
export const ORDER_STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  AWAITING_PROOF: "bg-waypoint-gold/20 text-ink-navy",
  AWAITING_APPROVAL: "bg-paper text-ink-navy ring-2 ring-inset ring-waypoint-gold",
  APPROVED: "bg-trail-teal/15 text-trail-teal",
  PRINTING: "bg-coral-signal/15 text-coral-signal",
  SHIPPED: "bg-ink-navy text-paper",
};

/**
 * Orders that are still in progress for the customer.
 * TODO(payfast): once Order.paymentStatus exists, also require it to be PAID —
 * an unpaid order shouldn't count as active. Not invented here on purpose.
 */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ["AWAITING_PROOF", "AWAITING_APPROVAL", "APPROVED", "PRINTING"];

/** Proof version states as people see them ("superseded" = a newer version exists). */
export const PROOF_STATUS_LABELS = {
  PENDING: "Awaiting approval",
  APPROVED: "Approved",
  REJECTED: "Changes requested",
  SUPERSEDED: "Superseded",
} as const;

export const PROOF_STATUS_CLASSES = {
  PENDING: "bg-paper text-ink-navy ring-2 ring-inset ring-waypoint-gold",
  APPROVED: "bg-trail-teal/15 text-trail-teal",
  REJECTED: "bg-coral-signal/15 text-coral-signal",
  SUPERSEDED: "bg-ink-navy/10 text-ink-navy/60",
} as const;

/** The short order number customers see, e.g. "#K3J9X2QZ" (the last 8 characters of the id). */
export function orderNumber(orderId: string): string {
  return `#${orderId.slice(-8).toUpperCase()}`;
}

/** "75 × 75 mm" from an item's cm dimensions. */
export function itemSizeLabel(item: { widthCm: number | { toString(): string }; heightCm: number | { toString(): string } }): string {
  const mm = (cm: number) => formatMmValue(cmToMm(cm));
  return `${mm(Number(item.widthCm))} × ${mm(Number(item.heightCm))} mm`;
}

/**
 * One readable line per item for the customer's order tables, e.g.
 * "Vinyl · Die cut · Circle · 75 × 75 mm · Matte · 100 pcs", or for a sheet
 * "Sticker Sheets · Holographic · 5–8 Stickers · 148 × 210 mm · 50 sheets".
 */
export function itemSummary(
  item: ItemMaterial & {
    cutType: CutType;
    shape: Shape;
    finish: Finish;
    sheetCuts?: SheetCuts | null;
    widthCm: number | { toString(): string };
    heightCm: number | { toString(): string };
    quantity: number;
  },
): string {
  const qty = item.quantity.toLocaleString("en-ZA");
  if (item.stickerType === "STICKER_SHEETS") {
    const material = itemMaterial(item);
    return [
      STICKER_TYPE_LABELS.STICKER_SHEETS,
      material !== "STICKER_SHEETS" && STICKER_TYPE_LABELS[material],
      (hasFinishChoice(material) || item.finish === "GLOSS") && FINISH_LABELS[item.finish],
      item.sheetCuts && SHEET_CUTS_LABELS[item.sheetCuts],
      itemSizeLabel(item),
      `${qty} ${unitNoun(item.stickerType, item.quantity)}`,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return [
    STICKER_TYPE_LABELS[item.stickerType],
    hasCutChoice(item.stickerType) && CUT_TYPE_LABELS[item.cutType].replace(" Cut", " cut"),
    SHAPE_LABELS[item.shape],
    itemSizeLabel(item),
    finishLabel(item),
    `${qty} pcs`,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * A design's name for the order summary, from its artwork filename:
 * "quest-wizard.png" → "Quest wizard". Null when there's nothing usable.
 */
export function designName(filename: string | null | undefined): string | null {
  if (!filename) return null;
  const base = filename
    .replace(/\.[a-z0-9]{1,5}$/i, "")
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!base) return null;
  const name = base.length > 32 ? `${base.slice(0, 31).trimEnd()}…` : base;
  return name.charAt(0).toUpperCase() + name.slice(1);
}
