/** Well-known PricingSetting.key values the formula reads. No prisma import — safe from prisma/seed.ts too. */
export const PRICING_SETTING_KEYS = {
  WHITE_INK_RATE_PER_SQ_CM: "WHITE_INK_RATE_PER_SQ_CM",
  LAMINATION_SURCHARGE_PER_SQ_CM: "LAMINATION_SURCHARGE_PER_SQ_CM",
} as const;

/** Quantity at which the discount curve starts (0% — every other tier is relative to this). */
export const DISCOUNT_BASELINE_QUANTITY = 50;
