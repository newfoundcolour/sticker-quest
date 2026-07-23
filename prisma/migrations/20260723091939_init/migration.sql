-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "StickerType" AS ENUM ('VINYL', 'HOLOGRAPHIC', 'CHROME', 'GLITTER', 'CLEAR', 'ECONOMY', 'STICKER_SHEETS', 'LABEL_SHEETS');

-- CreateEnum
CREATE TYPE "CutType" AS ENUM ('KISS', 'DIE');

-- CreateEnum
CREATE TYPE "Shape" AS ENUM ('SQUARE', 'CIRCLE', 'RECTANGLE', 'OVAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Finish" AS ENUM ('MATTE', 'GLOSS');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('AWAITING_PROOF', 'APPROVED', 'PRINTING', 'SHIPPED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL,
    "stickerType" "StickerType" NOT NULL,
    "size" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "maxQuantity" INTEGER,
    "pricePerUnit" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'AWAITING_PROOF',
    "customerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "shippingAddress" TEXT NOT NULL,
    "stickerType" "StickerType" NOT NULL,
    "cutType" "CutType" NOT NULL,
    "shape" "Shape" NOT NULL,
    "finish" "Finish" NOT NULL,
    "size" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "artworkUrl" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "notes" TEXT,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "PricingRule_stickerType_size_minQuantity_idx" ON "PricingRule"("stickerType", "size", "minQuantity");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");
