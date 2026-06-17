-- CreateIndex
CREATE INDEX "PurchaseItem_confirmed_date_idx" ON "PurchaseItem"("confirmed", "date");

-- CreateIndex
CREATE INDEX "SaleItem_confirmed_date_idx" ON "SaleItem"("confirmed", "date");
