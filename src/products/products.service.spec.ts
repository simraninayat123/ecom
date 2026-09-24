import { ProductsService } from './products.service.js';

describe('ProductsService', () => {
  it('returns stable pagination metadata and catalogue filters', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 'p1' }]);
    const count = vi.fn().mockResolvedValue(5);
    const prisma = { product: { findMany, count }, $transaction: vi.fn((operations: Promise<unknown>[]) => Promise.all(operations)) };
    const service = new ProductsService(prisma as never);

    const result = await service.findAll({ search: 'mug', category: 'home', minPrice: 100, maxPrice: 5000, sort: 'price_asc', page: 2, limit: 2 });

    expect(result.meta).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 2, take: 2, orderBy: { price: 'asc' }, where: expect.objectContaining({ active: true, published: true }) }));
  });
});