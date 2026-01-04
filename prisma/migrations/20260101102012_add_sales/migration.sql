-- CreateTable
CREATE TABLE "CardTransaction" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "confirmedAt" DATE,
    "cardName" TEXT NOT NULL,
    "merchant" TEXT NOT NULL,
    "bizNo" TEXT,
    "approvalNo" TEXT NOT NULL,
    "installment" TEXT,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardTransaction_approvalNo_key" ON "CardTransaction"("approvalNo");

-- CreateIndex
CREATE INDEX "CardTransaction_date_idx" ON "CardTransaction"("date");
