import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AddressDto } from './address.types.js';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) { return this.prisma.address.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }); }

  create(userId: string, data: AddressDto) { return this.prisma.address.create({ data: { ...data, userId } }); }

  async update(userId: string, id: string, data: Partial<AddressDto>) {
    const result = await this.prisma.address.updateMany({ where: { id, userId }, data });
    if (!result.count) throw new NotFoundException('Address not found');
    return this.prisma.address.findUnique({ where: { id } });
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.address.deleteMany({ where: { id, userId } });
    if (!result.count) throw new NotFoundException('Address not found');
    return { deleted: true };
  }
}