-- DropIndex
DROP INDEX "ItemClassification_itemName_type_key";

-- CreateIndex
CREATE INDEX "ItemClassification_itemName_idx" ON "ItemClassification"("itemName");
