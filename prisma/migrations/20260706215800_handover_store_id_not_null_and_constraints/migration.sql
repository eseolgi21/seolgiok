-- DropIndex
DROP INDEX "HandoverApproval_shiftDate_shiftSlotId_category_key";

-- DropIndex
DROP INDEX "HandoverCheck_itemId_shiftDate_shiftSlotId_checkedBy_key";

-- AlterTable
ALTER TABLE "HandoverApproval" ALTER COLUMN "storeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "HandoverCheck" ALTER COLUMN "storeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "HandoverComment" ALTER COLUMN "storeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "HandoverItem" ALTER COLUMN "storeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "HandoverShiftSlot" ALTER COLUMN "storeId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "HandoverApproval_storeId_shiftDate_shiftSlotId_idx" ON "HandoverApproval"("storeId", "shiftDate", "shiftSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "HandoverApproval_storeId_shiftDate_shiftSlotId_category_key" ON "HandoverApproval"("storeId", "shiftDate", "shiftSlotId", "category");

-- CreateIndex
CREATE INDEX "HandoverCheck_storeId_shiftDate_shiftSlotId_idx" ON "HandoverCheck"("storeId", "shiftDate", "shiftSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "HandoverCheck_storeId_itemId_shiftDate_shiftSlotId_checkedB_key" ON "HandoverCheck"("storeId", "itemId", "shiftDate", "shiftSlotId", "checkedBy");

-- CreateIndex
CREATE INDEX "HandoverComment_storeId_shiftDate_shiftSlotId_category_idx" ON "HandoverComment"("storeId", "shiftDate", "shiftSlotId", "category");

-- CreateIndex
CREATE INDEX "HandoverItem_storeId_isActive_order_idx" ON "HandoverItem"("storeId", "isActive", "order");

-- CreateIndex
CREATE INDEX "HandoverShiftSlot_storeId_isActive_category_order_idx" ON "HandoverShiftSlot"("storeId", "isActive", "category", "order");
