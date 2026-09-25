import type { DiscountTier, PricingConfig } from "@/lib/pricing";

/** Pure, client-safe pricing math — no Prisma import, safe to use in "use client" components. */

export const MIN_QUANTITY = 50;

// There's no business cap on quantity — this is only the Postgres INTEGER
// ceiling for OrderItem.quantity, so an absurd entry can't break checkout.
const QUANTITY_STORAGE_LIMIT = 2_147_483_647;

export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

// Sizes are stored and priced in cm (OrderItem.widthCm / heightCm) but shown
// and entered in mm, rounded to the nearest 0.5 mm. The 0.5"-14" printer
// limits are the underlying constraint (see CLAUDE.md — "up to max printer
// width"), converted once here rather than re-derived at each call site.
export const MIN_SIZE_CM = inchesToCm(0.5);
export const MAX_SIZE_CM = inchesToCm(14);

export function roundToHalfMm(mm: number): number {
  return Math.round(mm * 2) / 2;
}

/** Rounded up / down to a whole half-mm so the range never exceeds the printer limits. */
export const MIN_SIZE_MM = Math.ceil(MIN_SIZE_CM * 20) / 2;
export const MAX_SIZE_MM = Math.floor(MAX_SIZE_CM * 20) / 2;

export function cmToMm(cm: number): number {
  return roundToHalfMm(cm * 10);
}

export function mmToCm(mm: number): number {
  return mm / 10;
}

export function clampSizeMm(mm: number): number {
  if (Number.isNaN(mm)) return MIN_SIZE_MM;
  return Math.min(MAX_SIZE_MM, Math.max(MIN_SIZE_MM, roundToHalfMm(mm)));
}

/** "51" or "101.5" — a mm value without a trailing ".0" (no unit). */
export function formatMmValue(mm: number): string {
  return Number.isInteger(mm) ? String(mm) : mm.toFixed(1);
}

/** A stored cm size as customers and staff see it, e.g. "101.5 mm". */
export function formatSizeMm(cm: number): string {
  return `${formatMmValue(cmToMm(cm))} mm`;
}

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return MIN_QUANTITY;
  return Math.min(QUANTITY_STORAGE_LIMIT, Math.max(MIN_QUANTITY, Math.round(quantity)));
}

export function clampSizeCm(cm: number): number {
  if (Number.isNaN(cm)) return MIN_SIZE_CM;
  return Math.min(MAX_SIZE_CM, Math.max(MIN_SIZE_CM, cm));
}

/** The discount tier in effect for a quantity: the highest minQuantity at or below it. */
export function pickDiscountTier(
  tiers: readonly DiscountTier[],
  quantity: number,
): DiscountTier {
  const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
  let active: DiscountTier = { minQuantity: 0, discountPercent: 0 };
  for (const tier of sorted) {
    if (quantity >= tier.minQuantity) active = tier;
  }
  return active;
}

export type StickerPricingInput = {
  config: PricingConfig;
  isHolographic: boolean;
  whiteInk: boolean;
  lamination: boolean;
  widthCm: number;
  heightCm: number;
  quantity: number;
};

export type StickerPricingResult = {
  /** Undiscounted per-unit price — the 50-unit baseline rate. */
  baselinePricePerUnit: number;
  pricePerUnit: number;
  totalPrice: number;
  discountPercent: number;
};

/**
 * Price per sticker = area (sq cm) x effective rate (cents per sq cm),
 * converted to Rand, then discounted by the active quantity tier.
 *
 * Effective rate: holographic uses its own rate outright; white ink replaces
 * the base rate (but never overrides holographic); lamination adds a flat
 * surcharge on top of whichever rate applies.
 */
export function calculateStickerPricing(
  input: StickerPricingInput,
): StickerPricingResult {
  const { config, isHolographic, whiteInk, lamination, widthCm, heightCm, quantity } = input;

  const areaCm2 = widthCm * heightCm;

  let rate = config.ratePerSqCm;
  if (isHolographic) {
    rate = config.ratePerSqCm;
  } else if (whiteInk) {
    rate = config.whiteInkRatePerSqCm;
  }
  if (lamination) {
    rate += config.laminationSurchargePerSqCm;
  }

  const baselinePricePerUnit = round2((areaCm2 * rate) / 100);
  const tier = pickDiscountTier(config.discountTiers, quantity);
  const pricePerUnit = round2(baselinePricePerUnit * (1 - tier.discountPercent / 100));

  return {
    baselinePricePerUnit,
    pricePerUnit,
    totalPrice: round2(pricePerUnit * quantity),
    discountPercent: tier.discountPercent,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount);
}
