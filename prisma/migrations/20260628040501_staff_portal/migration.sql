-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('CLOCK_IN', 'CLOCK_OUT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BoardType" ADD VALUE 'INTERNAL';
ALTER TYPE "BoardType" ADD VALUE 'SUGGESTION';

-- CreateTable
CREATE TABLE "AttendanceLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AttendanceType" NOT NULL,
    "clockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoverItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandoverItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoverCheck" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "shiftDate" DATE NOT NULL,
    "shiftSlot" TEXT NOT NULL,
    "checkedBy" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HandoverCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeVote" (
    "id" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "voteDate" DATE NOT NULL,
    "voteYear" INTEGER NOT NULL,
    "voteMonth" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttendanceLog_userId_clockedAt_idx" ON "AttendanceLog"("userId", "clockedAt");

-- CreateIndex
CREATE INDEX "AttendanceLog_clockedAt_idx" ON "AttendanceLog"("clockedAt");

-- CreateIndex
CREATE INDEX "HandoverItem_isActive_order_idx" ON "HandoverItem"("isActive", "order");

-- CreateIndex
CREATE INDEX "HandoverCheck_shiftDate_shiftSlot_idx" ON "HandoverCheck"("shiftDate", "shiftSlot");

-- CreateIndex
CREATE INDEX "HandoverCheck_checkedBy_idx" ON "HandoverCheck"("checkedBy");

-- CreateIndex
CREATE UNIQUE INDEX "HandoverCheck_itemId_shiftDate_shiftSlot_checkedBy_key" ON "HandoverCheck"("itemId", "shiftDate", "shiftSlot", "checkedBy");

-- CreateIndex
CREATE INDEX "EmployeeVote_voteYear_voteMonth_targetId_idx" ON "EmployeeVote"("voteYear", "voteMonth", "targetId");

-- CreateIndex
CREATE INDEX "EmployeeVote_voterId_voteDate_idx" ON "EmployeeVote"("voterId", "voteDate");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeVote_voterId_voteDate_key" ON "EmployeeVote"("voterId", "voteDate");

-- AddForeignKey
ALTER TABLE "AttendanceLog" ADD CONSTRAINT "AttendanceLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverCheck" ADD CONSTRAINT "HandoverCheck_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "HandoverItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverCheck" ADD CONSTRAINT "HandoverCheck_checkedBy_fkey" FOREIGN KEY ("checkedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeVote" ADD CONSTRAINT "EmployeeVote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeVote" ADD CONSTRAINT "EmployeeVote_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
