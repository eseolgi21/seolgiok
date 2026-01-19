-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "confirmed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "confirmed" BOOLEAN NOT NULL DEFAULT false;
