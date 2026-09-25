import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmbeddingService } from './embedding.service.js';
import { ProductIndexService } from './product-index.service.js';

const MAX_ATTEMPTS = 5;

@Injectable()
export class IndexingWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndexingWorkerService.name);
  private interval: NodeJS.Timeout | undefined;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly productIndexService: ProductIndexService,
  ) {}

  onModuleInit() {
    const intervalMs = Number(process.env.RAG_INDEXING_INTERVAL_MS ?? 5000);
    this.interval = setInterval(() => void this.processNext(), intervalMs);
    this.interval.unref();
    void this.processNext();
  }

  async onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
    await this.prisma.productIndexJob.updateMany({ where: { status: 'PROCESSING' }, data: { status: 'PENDING' } });
  }

  async processNext() {
    if (this.running) return;
    this.running = true;
    try {
      const job = await this.claimJob();
      if (job) await this.processJob(job);
    } finally {
      this.running = false;
    }
  }

  private async claimJob() {
    const jobs = await this.prisma.$queryRaw<Array<{ id: string; productId: string; operation: 'UPSERT' | 'DELETE'; attempts: number }>>(Prisma.sql`
      UPDATE "ProductIndexJob" AS job
      SET "status" = 'PROCESSING'::"ProductIndexJobStatus", "updatedAt" = NOW()
      FROM (
        SELECT "id"
        FROM "ProductIndexJob"
        WHERE "status" = 'PENDING'::"ProductIndexJobStatus"
          AND "updatedAt" <= NOW() - (POWER(2, "attempts") * INTERVAL '5 seconds')
        ORDER BY "createdAt"
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      ) AS next_job
      WHERE job."id" = next_job."id"
      RETURNING job."id", job."productId", job."operation", job."attempts"
    `);
    return jobs[0];
  }

  private async processJob(job: { id: string; productId: string; operation: 'UPSERT' | 'DELETE'; attempts: number }) {
    try {
      if (job.operation === 'DELETE') {
        await this.deleteEmbedding(job.productId);
      } else {
        const product = await this.prisma.product.findUnique({ where: { id: job.productId }, include: { category: true, variants: true } });
        if (!product || !product.active || !product.published) await this.deleteEmbedding(job.productId);
        else {
          const document = this.productIndexService.buildDocumentFromProduct(product);
          const [embedding] = await this.embeddingService.embed([document]);
          await this.upsertEmbedding(job.productId, document, embedding);
        }
      }
      await this.prisma.productIndexJob.update({ where: { id: job.id }, data: { status: 'COMPLETED', processedAt: new Date(), lastError: null } });
    } catch (error) {
      const attempts = job.attempts + 1;
      const message = error instanceof Error ? error.message.slice(0, 500) : 'Indexing failed';
      await this.prisma.productIndexJob.update({ where: { id: job.id }, data: { status: attempts >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING', attempts, lastError: message } });
      this.logger.warn(`Product indexing job ${job.id} ${attempts >= MAX_ATTEMPTS ? 'failed permanently' : 'will retry'}`);
    }
  }

  private async upsertEmbedding(productId: string, document: string, embedding: number[]) {
    const vector = `[${embedding.join(',')}]`;
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "ProductEmbedding" ("productId", "document", "embedding", "embeddingModel", "indexedAt", "createdAt", "updatedAt")
      VALUES (${productId}, ${document}, ${vector}::vector, ${process.env.HF_EMBEDDING_MODEL ?? 'BAAI/bge-small-en-v1.5'}, NOW(), NOW(), NOW())
      ON CONFLICT ("productId") DO UPDATE SET "document" = EXCLUDED."document", "embedding" = EXCLUDED."embedding", "embeddingModel" = EXCLUDED."embeddingModel", "indexedAt" = NOW(), "updatedAt" = NOW()
    `);
  }

  private deleteEmbedding(productId: string) {
    return this.prisma.$executeRaw(Prisma.sql`DELETE FROM "ProductEmbedding" WHERE "productId" = ${productId}`);
  }
}