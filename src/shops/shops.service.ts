import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.seller.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
        products: {
          where: { active: true, published: true },
          select: { imageUrl: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });
  }

  async findOne(slug: string) {
    const shop = await this.prisma.seller.findFirst({
      where: { slug, active: true },
      include: { _count: { select: { products: true } } },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  async findProducts(slug: string) {
    return this.prisma.product.findMany({
      where: { seller: { slug, active: true }, active: true, published: true },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { active: true }, orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async findProduct(slug: string, idOrSlug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        seller: { slug, active: true },
        active: true,
        published: true,
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        seller: true,
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { active: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    const { seller: shop, ...productWithoutSeller } = product;
    return { shop, product: productWithoutSeller };
  }
}
