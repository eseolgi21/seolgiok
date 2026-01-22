/*
  Warnings:

  - You are about to drop the `MonthlySettlement` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "MonthlySettlement";

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reportedCashSales" INTEGER NOT NULL DEFAULT 0,
    "managerRentSupport" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_startDate_endDate_key" ON "Settlement"("startDate", "endDate");
