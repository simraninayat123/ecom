import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service.js';

describe('CartService', () => {
  const product = { id: 'p1', price: 1250, stock: 3, active: true, published: true, currency: 'INR' };

  it('rejects quantities that exceed inventory', async () => {
    const prisma = { product: { findFirst: vi.fn().mockResolvedValue(product) }, cart: { upsert: vi.fn().mockResolvedValue({ id: 'c1', items: [] }) }, cartItem: { findUnique: vi.fn().mockResolvedValue({ quantity: 2 }) } };
    const service = new CartService(prisma as never);
    await expect(service.addItem('user-1', 'p1', 2)).rejects.toThrow(BadRequestException);
  });

  it('does not update another user cart item', async () => {
    const prisma = { cartItem: { findFirst: vi.fn().mockResolvedValue(null) } };
    const service = new CartService(prisma as never);
    await expect(service.updateItem('user-1', 'item-owned-by-user-2', 1)).rejects.toThrow(NotFoundException);
  });
});