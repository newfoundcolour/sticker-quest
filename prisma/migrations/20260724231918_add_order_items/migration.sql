/*
  Warnings:

  - You are about to drop the column `artworkUrl` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `cutType` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `finish` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shape` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `stickerType` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "artworkUrl",
DROP COLUMN "cutType",
DROP COLUMN "finish",
DROP COLUMN "quantity",
DROP COLUMN "shape",
DROP COLUMN "size",
DROP COLUMN "stickerType";

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stickerType" "StickerType" NOT NULL,
    "cutType" "CutType" NOT NULL,
    "shape" "Shape" NOT NULL,
    "finish" "Finish" NOT NULL,
    "whiteInk" BOOLEAN NOT NULL DEFAULT false,
    "lamination" BOOLEAN NOT NULL DEFAULT false,
    "widthCm" DECIMAL(6,2) NOT NULL,
    "heightCm" DECIMAL(6,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "artworkUrl" TEXT NOT NULL,
    "artworkFilename" TEXT,
    "pricePerUnit" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
