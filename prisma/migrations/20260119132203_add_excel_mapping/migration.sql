-- CreateTable
CREATE TABLE "ExcelMapping" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "KeywordType" NOT NULL,
    "colDate" TEXT NOT NULL,
    "colItem" TEXT NOT NULL,
    "colAmount" TEXT NOT NULL,
    "colCategory" TEXT,
    "colNote" TEXT,
    "colPayment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExcelMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExcelMapping_userId_type_idx" ON "ExcelMapping"("userId", "type");

-- AddForeignKey
ALTER TABLE "ExcelMapping" ADD CONSTRAINT "ExcelMapping_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
