-- CreateTable
CREATE TABLE "ItemCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "KeywordType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemCategory_type_idx" ON "ItemCategory"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ItemCategory_name_type_key" ON "ItemCategory"("name", "type");
