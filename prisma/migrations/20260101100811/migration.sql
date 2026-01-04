-- CreateTable
CREATE TABLE "DailySales" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "salesAmount" INTEGER NOT NULL DEFAULT 0,
    "costAmount" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailySales_date_key" ON "DailySales"("date");

-- CreateIndex
CREATE INDEX "DailySales_date_idx" ON "DailySales"("date");
