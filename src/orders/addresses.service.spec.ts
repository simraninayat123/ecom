import { NotFoundException } from '@nestjs/common';
import { AddressesService } from './addresses.service.js';

describe('AddressesService', () => {
  it('does not delete another user address', async () => {
    const prisma = { address: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) } };
    await expect(new AddressesService(prisma as never).remove('user-1', 'address-user-2')).rejects.toThrow(NotFoundException);
  });
});