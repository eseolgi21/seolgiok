-- CreateTable HandoverShiftSlot
CREATE TABLE "HandoverShiftSlot" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HandoverShiftSlot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HandoverShiftSlot_isActive_order_idx" ON "HandoverShiftSlot"("isActive", "order");

-- Seed initial 3 slots (고정 ID — 재현성 보장)
INSERT INTO "HandoverShiftSlot" ("id", "label", "order", "isActive", "updatedAt") VALUES
    ('slot_morning', '오전 교대', 1, true, NOW()),
    ('slot_evening', '오후 교대', 2, true, NOW()),
    ('slot_night',   '야간 교대', 3, true, NOW());

-- AlterTable HandoverItem: add category column
ALTER TABLE "HandoverItem" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'HALL';
CREATE INDEX "HandoverItem_category_isActive_order_idx" ON "HandoverItem"("category", "isActive", "order");

-- AlterTable HandoverCheck: add shiftSlotId (nullable first for data migration)
ALTER TABLE "HandoverCheck" ADD COLUMN "shiftSlotId" TEXT;

-- DataMigration: backfill shiftSlotId from existing shiftSlot string values
UPDATE "HandoverCheck" SET "shiftSlotId" = CASE "shiftSlot"
    WHEN 'morning' THEN 'slot_morning'
    WHEN 'evening' THEN 'slot_evening'
    WHEN 'night'   THEN 'slot_night'
    ELSE 'slot_morning'
END;

-- Make shiftSlotId NOT NULL
ALTER TABLE "HandoverCheck" ALTER COLUMN "shiftSlotId" SET NOT NULL;

-- Drop old index and unique constraint referencing shiftSlot
DROP INDEX IF EXISTS "HandoverCheck_shiftDate_shiftSlot_idx";
DROP INDEX IF EXISTS "HandoverCheck_itemId_shiftDate_shiftSlot_checkedBy_key";

-- Drop old shiftSlot column
ALTER TABLE "HandoverCheck" DROP COLUMN "shiftSlot";

-- Create new indexes for shiftSlotId
CREATE INDEX "HandoverCheck_shiftDate_shiftSlotId_idx" ON "HandoverCheck"("shiftDate", "shiftSlotId");
CREATE UNIQUE INDEX "HandoverCheck_itemId_shiftDate_shiftSlotId_checkedBy_key"
    ON "HandoverCheck"("itemId", "shiftDate", "shiftSlotId", "checkedBy");

-- Add FK constraint for shiftSlotId
ALTER TABLE "HandoverCheck" ADD CONSTRAINT "HandoverCheck_shiftSlotId_fkey"
    FOREIGN KEY ("shiftSlotId") REFERENCES "HandoverShiftSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable HandoverComment
CREATE TABLE "HandoverComment" (
    "id" TEXT NOT NULL,
    "shiftDate" DATE NOT NULL,
    "shiftSlotId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HandoverComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HandoverComment_shiftDate_shiftSlotId_category_idx"
    ON "HandoverComment"("shiftDate", "shiftSlotId", "category");
CREATE INDEX "HandoverComment_authorId_idx" ON "HandoverComment"("authorId");

ALTER TABLE "HandoverComment" ADD CONSTRAINT "HandoverComment_shiftSlotId_fkey"
    FOREIGN KEY ("shiftSlotId") REFERENCES "HandoverShiftSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HandoverComment" ADD CONSTRAINT "HandoverComment_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable HandoverApproval
CREATE TABLE "HandoverApproval" (
    "id" TEXT NOT NULL,
    "shiftDate" DATE NOT NULL,
    "shiftSlotId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    CONSTRAINT "HandoverApproval_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HandoverApproval_shiftDate_shiftSlotId_category_key"
    ON "HandoverApproval"("shiftDate", "shiftSlotId", "category");
CREATE INDEX "HandoverApproval_shiftDate_shiftSlotId_idx"
    ON "HandoverApproval"("shiftDate", "shiftSlotId");

ALTER TABLE "HandoverApproval" ADD CONSTRAINT "HandoverApproval_shiftSlotId_fkey"
    FOREIGN KEY ("shiftSlotId") REFERENCES "HandoverShiftSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HandoverApproval" ADD CONSTRAINT "HandoverApproval_approvedBy_fkey"
    FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
