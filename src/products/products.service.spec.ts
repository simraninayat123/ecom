import { ProductsService } from './products.service.js';

describe('ProductsService', () => {
  const productIndexService = { enqueue: vi.fn() };

  beforeEach(() => productIndexService.enqueue.mockReset());

  it('returns stable pagination metadata and catalogue filters', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 'p1' }]);
    const count = vi.fn().mockResolvedValue(5);
    const prisma = {
      product: { findMany, count },
      $transaction: vi.fn((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    };
    const service = new ProductsService(
      prisma as never,
      productIndexService as never,
    );

    const result = await service.findAll({
      search: 'mug',
      category: 'home',
      minPrice: 100,
      maxPrice: 5000,
      sort: 'price_asc',
      page: 2,
      limit: 2,
    });

    expect(result.meta).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 2,
        take: 2,
        orderBy: { price: 'asc' },
        where: expect.objectContaining({ active: true, published: true }),
      }),
    );
  });

  it('queues a re-index in the same transaction as each product change', async () => {
    const product = {
      id: 'product-1',
      category: null,
      images: [],
      variants: [],
    };
    const tx = {
      product: {
        create: vi.fn().mockResolvedValue(product),
        update: vi.fn().mockResolvedValue(product),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new ProductsService(
      prisma as never,
      productIndexService as never,
    );

    await service.create({
      name: 'Test',
      slug: 'test',
      sku: 'TEST-1',
      description: 'Test',
      price: 100,
      imageUrl: 'image',
      stock: 1,
    });
    await service.update('product-1', { name: 'Updated' });
    await service.remove('product-1');

    expect(productIndexService.enqueue.mock.calls).toEqual([
      [tx, 'product-1', 'UPSERT'],
      [tx, 'product-1', 'UPSERT'],
      [tx, 'product-1', 'DELETE'],
    ]);
  });

  it('records inventory adjustments in the same transaction as the stock change', async () => {
    const tx = {
      product: {
        findUnique: vi.fn().mockResolvedValue({ id: 'product-1', stock: 4 }),
        update: vi.fn(),
      },
      inventoryAdjustment: {
        create: vi.fn().mockResolvedValue({ id: 'adjustment-1' }),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const result = await new ProductsService(
      prisma as never,
      productIndexService as never,
    ).adjustInventory('admin-1', 'product-1', {
      type: 'INCREASE',
      quantity: 3,
      reason: 'Restock',
    });
    expect(result).toEqual({ id: 'adjustment-1' });
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { stock: 7 },
    });
    expect(tx.inventoryAdjustment.create).toHaveBeenCalled();
  });
});
