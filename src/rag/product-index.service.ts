import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ProductIndexOperation } from './rag.types.js';

export function buildProductDocument(product: {
  name: string;
  sku: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  category?: { name: string } | null;
  variants?: Array<{ name: string; options: Prisma.JsonValue; active: boolean }>;
}) {
  const variants = (product.variants ?? []).filter((variant) => variant.active).map((variant) => {
    const values = typeof variant.options === 'object' && variant.options !== null && !Array.isArray(variant.options)
      ? Object.entries(variant.options).map(([key, value]) => `${key}: ${String(value)}`).join(', ')
      : String(variant.options);
    return `${variant.name}${values ? `, ${values}` : ''}`;
  });
  return [
    `Product: ${product.name}`,
    product.category ? `Category: ${product.category.name}` : null,
    `SKU: ${product.sku}`,
    `Description: ${product.description}`,
    variants.length ? `Variants: ${variants.join('; ')}` : null,
    `Price: ${product.currency} ${product.price.toLocaleString('en-IN')}`,
    `Availability: ${product.stock > 0 ? 'In stock' : 'Out of stock'}`,
  ].filter(Boolean).join('\n');
}

@Injectable()
export class ProductIndexService {
  constructor(private readonly prisma: PrismaService) {}

  enqueue(tx: Prisma.TransactionClient, productId: string, operation: ProductIndexOperation) {
    return tx.productIndexJob.upsert({
      where: { productId },
      create: { productId, operation, status: 'PENDING' },
      update: { operation, status: 'PENDING', attempts: 0, lastError: null, processedAt: null },
    });
  }

  async buildDocument(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, include: { category: true, variants: true } });
    return product ? buildProductDocument(product) : null;
  }

  buildDocumentFromProduct(product: Parameters<typeof buildProductDocument>[0]) {
    return buildProductDocument(product);
  }

  async enqueueAll() {
    const products = await this.prisma.product.findMany({ select: { id: true } });
    await this.prisma.$transaction(async (tx) => {
      for (const product of products) await this.enqueue(tx, product.id, 'UPSERT');
    });
    return { enqueued: products.length };
  }

  async status() {
    const [counts, failed, latest] = await Promise.all([
      this.prisma.productIndexJob.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.productIndexJob.findMany({ where: { status: 'FAILED' }, select: { id: true, productId: true, attempts: true, lastError: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: 20 }),
      this.prisma.productEmbedding.aggregate({ _max: { indexedAt: true } }),
    ]);
    return { counts: Object.fromEntries(counts.map((item) => [item.status, item._count._all])), failedJobs: failed, latestSuccessfulEmbeddingAt: latest._max.indexedAt };
  }
}