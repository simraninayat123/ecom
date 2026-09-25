/*
  Warnings:

  - A unique constraint covering the columns `[productId]` on the table `ProductIndexJob` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProductIndexJob_productId_key" ON "ProductIndexJob"("productId");
