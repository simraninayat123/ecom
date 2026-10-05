import { BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service.js';

describe('AdminService', () => {
  it('rejects invalid order status transitions', async () => {
    const prisma = {
      order: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: 'order-1', orderStatus: 'PENDING' }),
      },
    };
    await expect(
      new AdminService(prisma as never).updateOrderStatus('order-1', 'SHIPPED'),
    ).rejects.toThrow(BadRequestException);
  });
});
