import { prisma } from "@/lib/prisma";
import type { SheetCuts, StickerType } from "@/generated/prisma/client";
import { PRICING_SETTING_KEYS } from "@/lib/pricingConstants";

export type DiscountTier = {
  minQuantity: number;
  discountPercent: number;
};

export type PricingConfig = {
  ratePerSqCm: number;
  whiteInkRatePerSqCm: number;
  laminationSurchargePerSqCm: number;
  /** Sticker sheets: % added per cut tier. */
  sheetCutSurchargePercent: Record<SheetCuts, number>;
  discountTiers: DiscountTier[];
};

export class MissingPricingRuleError extends Error {
  constructor(stickerType: StickerType) {
    super(`No PricingRule row exists yet for stickerType=${stickerType}`);
    this.name = "MissingPricingRuleError";
  }
}

/**
 * Everything the pricing formula needs for one sticker type, fetched once so
 * the configurator can compute price locally for any shape/size/add-on/
 * quantity combination without further round trips. See
 * src/lib/pricingUtils.ts for the formula itself (area x rate, discounted by
 * quantity tier).
 */
export async function getPricingConfig(
  stickerType: StickerType,
): Promise<PricingConfig> {
  const [rule, settings, discountTiers] = await Promise.all([
    prisma.pricingRule.findUnique({ where: { stickerType } }),
    prisma.pricingSetting.findMany(),
    prisma.quantityDiscountTier.findMany({ orderBy: { minQuantity: "asc" } }),
  ]);

  if (!rule) {
    throw new MissingPricingRuleError(stickerType);
  }

  const settingValue = (key: string): number => {
    const row = settings.find((s) => s.key === key);
    return row ? Number(row.value) : 0;
  };

  return {
    ratePerSqCm: Number(rule.ratePerSqCm),
    whiteInkRatePerSqCm: settingValue(PRICING_SETTING_KEYS.WHITE_INK_RATE_PER_SQ_CM),
    laminationSurchargePerSqCm: settingValue(
      PRICING_SETTING_KEYS.LAMINATION_SURCHARGE_PER_SQ_CM,
    ),
    sheetCutSurchargePercent: {
      CUTS_1_4: 0,
      CUTS_5_8: settingValue(PRICING_SETTING_KEYS.SHEET_CUTS_5_8_SURCHARGE_PERCENT),
      CUTS_9_12: settingValue(PRICING_SETTING_KEYS.SHEET_CUTS_9_12_SURCHARGE_PERCENT),
    },
    discountTiers: discountTiers.map((t) => ({
      minQuantity: t.minQuantity,
      discountPercent: Number(t.discountPercent),
    })),
  };
}
