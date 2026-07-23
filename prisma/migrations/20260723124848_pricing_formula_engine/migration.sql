-- AlterEnum
BEGIN;
CREATE TYPE "StickerType_new" AS ENUM ('VINYL', 'HOLOGRAPHIC', 'CHROME', 'CLEAR', 'ECONOMY', 'STICKER_SHEETS', 'LABEL_SHEETS');
ALTER TABLE "PricingRule" ALTER COLUMN "stickerType" TYPE "StickerType_new" USING ("stickerType"::text::"StickerType_new");
ALTER TABLE "Order" ALTER COLUMN "stickerType" TYPE "StickerType_new" USING ("stickerType"::text::"StickerType_new");
ALTER TYPE "StickerType" RENAME TO "StickerType_old";
ALTER TYPE "StickerType_new" RENAME TO "StickerType";
DROP TYPE "public"."StickerType_old";
COMMIT;

-- DropIndex
DROP INDEX "PricingRule_stickerType_size_minQuantity_idx";

-- AlterTable
ALTER TABLE "PricingRule" DROP COLUMN "maxQuantity",
DROP COLUMN "minQuantity",
DROP COLUMN "pricePerUnit",
DROP COLUMN "size",
ADD COLUMN     "ratePerSqCm" DECIMAL(6,2) NOT NULL;

-- CreateTable
CREATE TABLE "QuantityDiscountTier" (
    "id" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuantityDiscountTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" DECIMAL(6,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuantityDiscountTier_minQuantity_key" ON "QuantityDiscountTier"("minQuantity");

-- CreateIndex
CREATE UNIQUE INDEX "PricingSetting_key_key" ON "PricingSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PricingRule_stickerType_key" ON "PricingRule"("stickerType");

