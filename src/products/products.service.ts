import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductQueryDto } from './products.types.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      active: true,
      published: true,
      ...(query.search
        ? { OR: [{ name: { contains: query.search, mode: 'insensitive' as const } }, { description: { contains: query.search, mode: 'insensitive' as const } }] }
        : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? { price: { ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}), ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}) } }
        : {}),
    };
    const orderBy = query.sort === 'price_asc' ? { price: 'asc' as const } : query.sort === 'price_desc' ? { price: 'desc' as const } : { createdAt: 'desc' as const };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit, include: { category: true, images: { orderBy: { sortOrder: 'asc' } }, variants: { where: { active: true }, orderBy: { createdAt: 'asc' } } } }),
      this.prisma.product.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(idOrSlug: string) {
    const product = await this.prisma.product.findFirst({ where: { active: true, published: true, OR: [{ id: idOrSlug }, { slug: idOrSlug }] }, include: { category: true, images: { orderBy: { sortOrder: 'asc' } }, variants: { where: { active: true }, orderBy: { createdAt: 'asc' } } } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}