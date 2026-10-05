-- CreateEnum
CREATE TYPE "SheetCuts" AS ENUM ('CUTS_1_4', 'CUTS_5_8', 'CUTS_9_12');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "sheetCuts" "SheetCuts",
ADD COLUMN     "sheetMaterial" "StickerType";
