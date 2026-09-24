import { BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service.js';

describe('AdminService', () => {
  it('rejects invalid order status transitions', async () => {
    const prisma = { order: { findUnique: vi.fn().mockResolvedValue({ id: 'order-1', orderStatus: 'PENDING' }) } };
    await expect(new AdminService(prisma as never).updateOrderStatus('order-1', 'SHIPPED')).rejects.toThrow(BadRequestException);
  });

  it('records inventory adjustments in the same transaction as the stock change', async () => {
    const tx = {
      product: { findUnique: vi.fn().mockResolvedValue({ id: 'product-1', stock: 4 }), update: vi.fn() },
      inventoryAdjustment: { create: vi.fn().mockResolvedValue({ id: 'adjustment-1' }) },
    };
    const prisma = { $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)) };
    const result = await new AdminService(prisma as never).adjustInventory('admin-1', 'product-1', { type: 'INCREASE', quantity: 3, reason: 'Restock' });
    expect(result).toEqual({ id: 'adjustment-1' });
    expect(tx.product.update).toHaveBeenCalledWith({ where: { id: 'product-1' }, data: { stock: 7 } });
    expect(tx.inventoryAdjustment.create).toHaveBeenCalled();
  });
});