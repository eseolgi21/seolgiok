/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `HandoverApproval` table. All the data in the column will be lost.
  - You are about to drop the column `approvedBy` on the `HandoverApproval` table. All the data in the column will be lost.
  - Added the required column `submittedBy` to the `HandoverApproval` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "HandoverApproval" DROP CONSTRAINT "HandoverApproval_approvedBy_fkey";

-- Safe: v2 incompatible rows 삭제 (submittedBy NOT NULL 추가 전 필수)
DELETE FROM "HandoverApproval";

-- AlterTable
ALTER TABLE "HandoverApproval" DROP COLUMN "approvedAt",
DROP COLUMN "approvedBy",
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedBy" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "submittedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "HandoverComment" ADD COLUMN     "imageUrl" TEXT;

-- AddForeignKey
ALTER TABLE "HandoverApproval" ADD CONSTRAINT "HandoverApproval_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverApproval" ADD CONSTRAINT "HandoverApproval_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
