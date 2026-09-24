import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';

function makePrisma(overrides: Record<string, unknown> = {}) {
  const tx = {
    address: { findFirst: vi.fn().mockResolvedValue({ id: 'address-1', userId: 'user-1', recipientName: 'A', line1: '1 Main', city: 'Pune', state: 'MH', postalCode: '411001', country: 'IN' }) },
    cart: { findUnique: vi.fn().mockResolvedValue({ id: 'cart-1', items: [{ productId: 'product-1', quantity: 2, product: { id: 'product-1' } }] }) },
    product: { findUnique: vi.fn().mockResolvedValue({ id: 'product-1', name: 'Mug', sku: 'MUG-1', price: 1250, currency: 'INR', stock: 3, active: true, published: true }), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    order: { create: vi.fn().mockResolvedValue({ id: 'order-1', total: 2500, items: [] }) },
    cartItem: { deleteMany: vi.fn() },
  };
  return { ...tx, ...overrides, $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)) };
}

describe('OrdersService', () => {
  it('calculates order totals from current product prices', async () => {
    const prisma = makePrisma();
    const result = await new OrdersService(prisma as never).checkout('user-1', { shippingAddressId: 'address-1' });
    expect(result.total).toBe(2500);
    expect(prisma.order.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ subtotal: 2500, total: 2500 }) }));
  });

  it('fails checkout when atomic stock decrement cannot be completed', async () => {
    const prisma = makePrisma();
    prisma.product.updateMany.mockResolvedValue({ count: 0 });
    await expect(new OrdersService(prisma as never).checkout('user-1', { shippingAddressId: 'address-1' })).rejects.toThrow(BadRequestException);
  });

  it('does not retrieve another user order', async () => {
    const prisma = { order: { findFirst: vi.fn().mockResolvedValue(null) } };
    await expect(new OrdersService(prisma as never).findOne('user-1', 'order-user-2')).rejects.toThrow(NotFoundException);
  });
});