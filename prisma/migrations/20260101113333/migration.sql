/*
  Warnings:

  - A unique constraint covering the columns `[approvalNo,amount]` on the table `CardTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CardTransaction_approvalNo_key";

-- CreateIndex
CREATE UNIQUE INDEX "CardTransaction_approvalNo_amount_key" ON "CardTransaction"("approvalNo", "amount");
