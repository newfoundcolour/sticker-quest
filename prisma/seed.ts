import "dotenv/config";
import { PrismaClient, StickerType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PRICING_SETTING_KEYS,
  DISCOUNT_BASELINE_QUANTITY,
} from "../src/lib/pricingConstants";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Placeholder rates in cents per sq cm, per PRICING ENGINE spec. Vinyl and every
// type without a real number yet share the 5.5 base rate until real numbers land.
const MATERIAL_RATES: Record<StickerType, number> = {
  VINYL: 5.5,
  HOLOGRAPHIC: 18,
  CHROME: 5.5,
  CLEAR: 5.5,
  ECONOMY: 5.5,
  STICKER_SHEETS: 5.5,
  LABEL_SHEETS: 5.5,
};

// Placeholder bulk-discount curve, relative to the 50-unit baseline (0%).
const DISCOUNT_TIERS: { minQuantity: number; discountPercent: number }[] = [
  { minQuantity: DISCOUNT_BASELINE_QUANTITY, discountPercent: 0 },
  { minQuantity: 100, discountPercent: 35 },
  { minQuantity: 200, discountPercent: 54 },
  { minQuantity: 300, discountPercent: 61 },
  { minQuantity: 500, discountPercent: 68 },
  { minQuantity: 1000, discountPercent: 74 },
  { minQuantity: 3000, discountPercent: 83 },
];

async function main() {
  for (const [stickerType, ratePerSqCm] of Object.entries(MATERIAL_RATES) as [
    StickerType,
    number,
  ][]) {
    await prisma.pricingRule.upsert({
      where: { stickerType },
      update: {},
      create: { stickerType, ratePerSqCm },
    });
  }

  for (const tier of DISCOUNT_TIERS) {
    await prisma.quantityDiscountTier.upsert({
      where: { minQuantity: tier.minQuantity },
      update: {},
      create: tier,
    });
  }

  await prisma.pricingSetting.upsert({
    where: { key: PRICING_SETTING_KEYS.WHITE_INK_RATE_PER_SQ_CM },
    update: {},
    create: { key: PRICING_SETTING_KEYS.WHITE_INK_RATE_PER_SQ_CM, value: 11 },
  });
  await prisma.pricingSetting.upsert({
    where: { key: PRICING_SETTING_KEYS.LAMINATION_SURCHARGE_PER_SQ_CM },
    update: {},
    create: { key: PRICING_SETTING_KEYS.LAMINATION_SURCHARGE_PER_SQ_CM, value: 5 },
  });

  console.log("Pricing data seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
