import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminService } from '../admin/admin.service.js';
import { EmbeddingService } from './embedding.service.js';
import { IndexingWorkerService } from './indexing-worker.service.js';
import { buildProductDocument } from './product-index.service.js';
import { RagService } from './rag.service.js';

const config = { get: vi.fn((key: string) => ({ RAG_RETRIEVAL_LIMIT: 5, RAG_MIN_SIMILARITY: 0.35 } as Record<string, unknown>)[key]) } as unknown as ConfigService;

describe('RAG product recommendations', () => {
  it('builds a canonical document with recommendation facts', () => {
    const document = buildProductDocument({ name: 'Warm Throw', sku: 'THROW-1', description: 'Soft merino wool for cool evenings.', price: 9200, currency: 'INR', stock: 2, category: { name: 'Home' }, variants: [{ name: 'Classic', options: { colour: 'Oat' }, active: true }] });
    expect(document).toContain('Product: Warm Throw');
    expect(document).toContain('Category: Home');
    expect(document).toContain('Variants: Classic, colour: Oat');
    expect(document).toContain('Availability: In stock');
  });

  it('queues UPSERT and DELETE jobs through admin product mutations', async () => {
    const jobs = { upsert: vi.fn() };
    const product = { id: 'product-1', category: null, images: [], variants: [] };
    const tx = { product: { create: vi.fn().mockResolvedValue(product), update: vi.fn().mockResolvedValue(product) }, productIndexJob: jobs };
    const prisma = { $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)) };
    const indexer = { enqueue: vi.fn() };
    const service = new AdminService(prisma as never, indexer as never);
    await service.createProduct({ name: 'Test', slug: 'test', sku: 'TEST-1', description: 'Test', price: 100, imageUrl: 'image', stock: 1 });
    await service.updateProduct('product-1', { name: 'Updated' });
    await service.deleteProduct('product-1');
    expect(indexer.enqueue).toHaveBeenNthCalledWith(1, tx, 'product-1', 'UPSERT');
    expect(indexer.enqueue).toHaveBeenNthCalledWith(2, tx, 'product-1', 'UPSERT');
    expect(indexer.enqueue).toHaveBeenNthCalledWith(3, tx, 'product-1', 'DELETE');
  });

  it('maps only current active and published product cards', async () => {
    const embeddings = { embed: vi.fn().mockResolvedValue([[...Array(384).fill(0.1)]]) };
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ productId: 'active', similarity: 0.82 }, { productId: 'hidden', similarity: 0.8 }]), product: { findMany: vi.fn().mockResolvedValue([{ id: 'active', name: 'Throw', slug: 'throw', description: 'Soft merino wool.', price: 9200, currency: 'INR', imageUrl: 'image', stock: 2, category: { name: 'Home', slug: 'home' } }]) } };
    const result = await new RagService(prisma as never, embeddings as never, config).recommend('warm blanket');
    expect(result.products).toHaveLength(1);
    expect(result.products[0].id).toBe('active');
    expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ active: true, published: true }) }));
  });

  it('returns a grounded no-match response', async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([]) };
    const embeddings = { embed: vi.fn().mockResolvedValue([[...Array(384).fill(0.1)]]) };
    const result = await new RagService(prisma as never, embeddings as never, config).recommend('something unavailable');
    expect(result.products).toEqual([]);
    expect(result.answer).toContain('confident match');
  });

  it('reports a clear error when HF_TOKEN is missing', async () => {
    const service = new EmbeddingService({ get: vi.fn((key: string) => key === 'HF_EMBEDDING_MODEL' ? 'BAAI/bge-small-en-v1.5' : undefined) } as never);
    await expect(service.embed(['query'])).rejects.toThrow(ServiceUnavailableException);
  });

  it('validates the embedding dimension', () => {
    const service = new EmbeddingService({ get: vi.fn() } as never);
    expect(() => service.normalizeVector([0.1])).toThrow('Embedding dimension must be 384');
  });

  it('marks successful and retryable worker jobs correctly', async () => {
    const job = { id: 'job-1', productId: 'product-1', operation: 'UPSERT' as const, attempts: 0 };
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([job]), product: { findUnique: vi.fn().mockResolvedValue({ id: 'product-1', active: true, published: true }) }, $executeRaw: vi.fn(), productIndexJob: { update: vi.fn(), updateMany: vi.fn() } };
    const indexer = { buildDocumentFromProduct: vi.fn().mockReturnValue('Product: Test') };
    const embeddings = { embed: vi.fn().mockResolvedValue([[...Array(384).fill(0.1)]]) };
    const worker = new IndexingWorkerService(prisma as never, embeddings as never, indexer as never);
    await worker.processNext();
    expect(prisma.productIndexJob.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }));

    prisma.$queryRaw.mockResolvedValue([{ ...job, attempts: 1 }]);
    embeddings.embed.mockRejectedValueOnce(new Error('provider unavailable'));
    await worker.processNext();
    expect(prisma.productIndexJob.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING', attempts: 2 }) }));
  });

  it('marks a worker job failed after the final attempt', async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ id: 'job-1', productId: 'product-1', operation: 'UPSERT', attempts: 4 }]), product: { findUnique: vi.fn().mockResolvedValue({ id: 'product-1', active: true, published: true }) }, productIndexJob: { update: vi.fn(), updateMany: vi.fn() } };
    const worker = new IndexingWorkerService(prisma as never, { embed: vi.fn().mockRejectedValue(new Error('failure')) } as never, { buildDocumentFromProduct: vi.fn().mockReturnValue('doc') } as never);
    await worker.processNext();
    expect(prisma.productIndexJob.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED', attempts: 5 }) }));
  });
});