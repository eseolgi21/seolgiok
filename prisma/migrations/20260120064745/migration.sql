-- CreateTable
CREATE TABLE "ExcelFilter" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "type" "KeywordType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExcelFilter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExcelFilter_type_idx" ON "ExcelFilter"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ExcelFilter_keyword_type_key" ON "ExcelFilter"("keyword", "type");
