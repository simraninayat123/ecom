import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } });
  }

  async findOne(slug: string) {
    const category = await this.prisma.category.findUnique({ where: { slug }, include: { products: { where: { active: true, published: true }, orderBy: { createdAt: 'desc' } } } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }
}