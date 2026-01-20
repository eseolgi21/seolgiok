-- CreateTable
CREATE TABLE "ItemClassification" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" "KeywordType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemClassification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemClassification_type_idx" ON "ItemClassification"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ItemClassification_itemName_type_key" ON "ItemClassification"("itemName", "type");
