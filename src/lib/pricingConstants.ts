/** Well-known PricingSetting.key values the formula reads. No prisma import — safe from prisma/seed.ts too. */
export const PRICING_SETTING_KEYS = {
  WHITE_INK_RATE_PER_SQ_CM: "WHITE_INK_RATE_PER_SQ_CM",
  LAMINATION_SURCHARGE_PER_SQ_CM: "LAMINATION_SURCHARGE_PER_SQ_CM",
  /** Sticker sheets: % added to the price for 5–8 and 9–12 stickers on a sheet (1–4 is standard). */
  SHEET_CUTS_5_8_SURCHARGE_PERCENT: "SHEET_CUTS_5_8_SURCHARGE_PERCENT",
  SHEET_CUTS_9_12_SURCHARGE_PERCENT: "SHEET_CUTS_9_12_SURCHARGE_PERCENT",
} as const;

/** Quantity at which the discount curve starts (0% — every other tier is relative to this). */
export const DISCOUNT_BASELINE_QUANTITY = 50;
