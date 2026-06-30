-- AlterTable: HandoverShiftSlot에 category 필드 추가
-- 기존 슬롯(오전/오후/야간)은 DEFAULT 'HALL'로 설정됨
ALTER TABLE "HandoverShiftSlot" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'HALL';

-- DropIndex
DROP INDEX "HandoverShiftSlot_isActive_order_idx";

-- CreateIndex
CREATE INDEX "HandoverShiftSlot_isActive_category_order_idx" ON "HandoverShiftSlot"("isActive", "category", "order");
