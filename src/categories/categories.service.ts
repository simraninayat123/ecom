import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { throwNotFoundOrConflict } from '../utils/prisma-errors.util.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(sellerId: string) {
    return this.prisma.category.findMany({
      where: { sellerId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async findOne(sellerId: string, slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { sellerId_slug: { sellerId, slug } },
      include: {
        products: {
          where: { active: true, published: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  create(sellerId: string, data: CreateCategoryDto) {
    return this.prisma.category.create({ data: { ...data, sellerId } });
  }

  async update(sellerId: string, id: string, data: UpdateCategoryDto) {
    try {
      return await this.prisma.category.update({
        where: { id, sellerId },
        data,
      });
    } catch (error) {
      throwNotFoundOrConflict(error, 'Category not found');
    }
  }

  async remove(sellerId: string, id: string) {
    try {
      await this.prisma.category.delete({ where: { id, sellerId } });
      return { deleted: true };
    } catch (error) {
      throwNotFoundOrConflict(error, 'Category not found');
    }
  }
}
