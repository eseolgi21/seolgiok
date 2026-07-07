-- AlterTable
ALTER TABLE "HandoverApproval" ADD COLUMN     "storeId" TEXT;

-- AlterTable
ALTER TABLE "HandoverCheck" ADD COLUMN     "storeId" TEXT;

-- AlterTable
ALTER TABLE "HandoverComment" ADD COLUMN     "storeId" TEXT;

-- AlterTable
ALTER TABLE "HandoverItem" ADD COLUMN     "storeId" TEXT;

-- AlterTable
ALTER TABLE "HandoverShiftSlot" ADD COLUMN     "storeId" TEXT;

-- AddForeignKey
ALTER TABLE "HandoverItem" ADD CONSTRAINT "HandoverItem_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverShiftSlot" ADD CONSTRAINT "HandoverShiftSlot_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverCheck" ADD CONSTRAINT "HandoverCheck_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverComment" ADD CONSTRAINT "HandoverComment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverApproval" ADD CONSTRAINT "HandoverApproval_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
