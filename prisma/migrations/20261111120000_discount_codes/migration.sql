-- Discount codes: staff create them in /admin/discounts; customers apply one
-- in the cart. The discount comes off the items subtotal (never shipping) and
-- each order keeps the code text and amount it was given.

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- CreateTable
CREATE TABLE "DiscountCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "minOrderTotal" DECIMAL(10,2),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "oncePerCustomer" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCode_code_key" ON "DiscountCode"("code");

-- CreateIndex
CREATE INDEX "DiscountCode_active_idx" ON "DiscountCode"("active");

-- Existing orders had no discount: amount 0, no code.
ALTER TABLE "Order" ADD COLUMN "discountCodeId" TEXT,
ADD COLUMN "discountCodeText" TEXT,
ADD COLUMN "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Order_discountCodeId_userId_idx" ON "Order"("discountCodeId", "userId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Same lockdown as every public table: RLS on with no policies (deny-all),
-- and no privileges for the anon/authenticated API roles. Prisma connects
-- as postgres and bypasses RLS.
ALTER TABLE "DiscountCode" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "DiscountCode" FROM anon, authenticated;
