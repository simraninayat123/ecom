CREATE TYPE "SellerMembershipRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');

CREATE TABLE "Seller" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Seller_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Seller_slug_key" ON "Seller"("slug");

CREATE TABLE "SellerMembership" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "SellerMembershipRole" NOT NULL DEFAULT 'STAFF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SellerMembership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SellerMembership_sellerId_userId_key" ON "SellerMembership"("sellerId", "userId");
CREATE INDEX "SellerMembership_userId_idx" ON "SellerMembership"("userId");

INSERT INTO "Seller" ("id", "name", "slug", "updatedAt") VALUES ('default-seller-morrow', 'Morrow Supply', 'morrow', CURRENT_TIMESTAMP);

ALTER TABLE "Product" ADD COLUMN "sellerId" TEXT;
ALTER TABLE "Category" ADD COLUMN "sellerId" TEXT;
ALTER TABLE "ProductEmbedding" ADD COLUMN "sellerId" TEXT;
ALTER TABLE "ProductIndexJob" ADD COLUMN "sellerId" TEXT;
ALTER TABLE "InventoryAdjustment" ADD COLUMN "sellerId" TEXT;
ALTER TABLE "Cart" ADD COLUMN "sellerId" TEXT;
ALTER TABLE "Order" ADD COLUMN "sellerId" TEXT;

UPDATE "Product" SET "sellerId" = 'default-seller-morrow';
UPDATE "Category" SET "sellerId" = 'default-seller-morrow';
UPDATE "ProductEmbedding" e SET "sellerId" = p."sellerId" FROM "Product" p WHERE p."id" = e."productId";
UPDATE "ProductIndexJob" j SET "sellerId" = p."sellerId" FROM "Product" p WHERE p."id" = j."productId";
UPDATE "InventoryAdjustment" i SET "sellerId" = p."sellerId" FROM "Product" p WHERE p."id" = i."productId";
UPDATE "Cart" SET "sellerId" = 'default-seller-morrow';
UPDATE "Order" o SET "sellerId" = COALESCE((SELECT p."sellerId" FROM "OrderItem" oi JOIN "Product" p ON p."id" = oi."productId" WHERE oi."orderId" = o."id" LIMIT 1), 'default-seller-morrow');

ALTER TABLE "Product" ALTER COLUMN "sellerId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "sellerId" SET NOT NULL;
ALTER TABLE "ProductEmbedding" ALTER COLUMN "sellerId" SET NOT NULL;
ALTER TABLE "ProductIndexJob" ALTER COLUMN "sellerId" SET NOT NULL;
ALTER TABLE "InventoryAdjustment" ALTER COLUMN "sellerId" SET NOT NULL;
ALTER TABLE "Cart" ALTER COLUMN "sellerId" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "sellerId" SET NOT NULL;

DROP INDEX "Product_slug_key";
DROP INDEX "Product_sku_key";
DROP INDEX "Category_slug_key";
DROP INDEX "Cart_userId_key";
CREATE UNIQUE INDEX "Product_sellerId_slug_key" ON "Product"("sellerId", "slug");
CREATE UNIQUE INDEX "Product_sellerId_sku_key" ON "Product"("sellerId", "sku");
CREATE UNIQUE INDEX "Category_sellerId_slug_key" ON "Category"("sellerId", "slug");
CREATE UNIQUE INDEX "Cart_userId_sellerId_key" ON "Cart"("userId", "sellerId");
CREATE INDEX "Product_sellerId_active_published_idx" ON "Product"("sellerId", "active", "published");
CREATE INDEX "ProductEmbedding_sellerId_idx" ON "ProductEmbedding"("sellerId");
CREATE INDEX "Category_sellerId_idx" ON "Category"("sellerId");
CREATE INDEX "Order_sellerId_createdAt_idx" ON "Order"("sellerId", "createdAt");

ALTER TABLE "SellerMembership" ADD CONSTRAINT "SellerMembership_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SellerMembership" ADD CONSTRAINT "SellerMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductEmbedding" ADD CONSTRAINT "ProductEmbedding_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductIndexJob" ADD CONSTRAINT "ProductIndexJob_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
