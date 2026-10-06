CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "ProductIndexOperation" AS ENUM ('UPSERT', 'DELETE');

-- CreateEnum
CREATE TYPE "ProductIndexJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ProductEmbedding" (
    "productId" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "embedding" vector(384) NOT NULL,
    "embeddingModel" TEXT NOT NULL,
    "indexedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductEmbedding_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "ProductIndexJob" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "operation" "ProductIndexOperation" NOT NULL,
    "status" "ProductIndexJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "ProductIndexJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductIndexJob_status_createdAt_idx" ON "ProductIndexJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ProductIndexJob_productId_status_idx" ON "ProductIndexJob"("productId", "status");

-- AddForeignKey
ALTER TABLE "ProductEmbedding" ADD CONSTRAINT "ProductEmbedding_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIndexJob" ADD CONSTRAINT "ProductIndexJob_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

