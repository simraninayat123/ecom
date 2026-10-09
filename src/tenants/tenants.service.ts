import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export const DEFAULT_SELLER_SLUG = 'morrow';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  findBySlug(slug?: string) {
    return this.prisma.seller.findFirst({
      where: { slug: slug?.trim() || DEFAULT_SELLER_SLUG, active: true },
    });
  }

  async requireBySlug(slug?: string) {
    const seller = await this.findBySlug(slug);
    if (!seller) throw new NotFoundException('Seller not found');
    return seller;
  }

  async requireMembership(sellerId: string, userId: string) {
    const membership = await this.prisma.sellerMembership.findUnique({
      where: { sellerId_userId: { sellerId, userId } },
    });
    if (!membership)
      throw new ForbiddenException('You do not have access to this seller');
    return membership;
  }
}
